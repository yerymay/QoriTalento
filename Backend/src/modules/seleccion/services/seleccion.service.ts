import { AppError } from '../../../shared/errors.js';
import type { Actor } from '../../cv/repositories/cv.repository.js';
import type { EvaluacionRepository } from '../../evaluacion/repositories/evaluacion.repository.js';
import { evaluationView } from '../../evaluacion/services/evaluacion.service.js';
import { examId } from '../../examenes/services/examenes.service.js';
import { selectionStates, type SeleccionRepository, type SelectionQuery, type SelectionRecord, type SelectionState } from '../repositories/seleccion.repository.js';
const transitions:Record<string,SelectionState[]> = {
  PENDING:['IN_REVIEW','ADVANCES','NOT_ADVANCES'],
  IN_REVIEW:['SHORTLISTED','ADVANCES','NOT_ADVANCES'],
  SHORTLISTED:['ADVANCES','NOT_ADVANCES'],
};
const fail=(message:string):never=>{throw new AppError(400,'INVALID_INPUT',message);};
const missing=():never=>{throw new AppError(404,'SELECTION_NOT_FOUND','El expediente o la oferta no están disponibles para tu cuenta.');};
export const allowedActions=(record:SelectionRecord):SelectionState[]=>record.process_finished||record.decision?[]:transitions[record.status??'']??[];
export class SeleccionService {
  constructor(private repo:SeleccionRepository,private evaluations:EvaluacionRepository){}
  private actor(actor:Actor){if(actor.role!=='RECRUITER')throw new AppError(403,'FORBIDDEN','Solo el reclutador propietario puede consultar resultados y decidir.');}
  async jobs(actor:Actor){this.actor(actor);return {items:await this.repo.jobs(actor.id)};}
  async list(actor:Actor,value:unknown,input:Record<string,unknown>){
    this.actor(actor);const id=examId(value);
    if(Object.keys(input).some(k=>!['search','status','sort','direction','page'].includes(k)))return fail('Filtro no permitido.');
    const text=(key:string,fallback:string)=>{const v=input[key]??fallback;if(typeof v!=='string')return fail('Filtro no válido.');return v;};
    const search=text('search','').trim(),status=text('status',''),sort=text('sort','date'),direction=text('direction','desc'),pageText=text('page','1');
    if(search.length>160||!/^\d{1,6}$/.test(pageText)||Number(pageText)<1||!['name','status','date'].includes(sort)||!['asc','desc'].includes(direction)||
      (status&&!selectionStates.includes(status as SelectionState)))return fail('Revisa los filtros y la página.');
    const query:SelectionQuery={search,status:status as SelectionState||null,sort:sort as SelectionQuery['sort'],direction:direction as SelectionQuery['direction'],page:Number(pageText),page_size:20};
    const result=await this.repo.list(actor.id,id,query)??missing();
    const items=[];
    // Página acotada. Las lecturas M06 vuelven a verificar propietario y no llaman a Ollama.
    for(const record of result.items){
      const context=await this.evaluations.read(actor.id,record.id);
      const view=context?evaluationView(context):null;
      items.push({...record,allowed_actions:allowedActions(record),results:view?{
        grades:view.grades.map(g=>({title:g.title,percent:g.percent})),exam_count:view.exam_count,
        profile_points:view.stale?null:view.profile_points,profile_max:view.profile_max,
        total:view.total,pending:view.pending,stale:view.stale,reviewed:!!view.evaluation?.criteria.some(c=>c.review&&c.review.rating!=='INSUFFICIENT_EVIDENCE'),
      }:null});
    }
    return {...result,items,page:query.page,page_size:query.page_size,indicative:true,ranking_enabled:false};
  }
  async detail(actor:Actor,value:unknown){
    this.actor(actor);const id=examId(value),result=await this.repo.read(actor.id,id)??missing();
    const context=await this.evaluations.read(actor.id,id)??missing();
    return {...result,allowed_actions:allowedActions(result.record),profile:context.confirmed?.profile??null,evaluation:evaluationView(context)};
  }
  async decide(actor:Actor,value:unknown,input:unknown){
    this.actor(actor);const id=examId(value);
    if(!input||typeof input!=='object'||Array.isArray(input))return fail('Envía una decisión válida.');
    const body=input as Record<string,unknown>;
    if(Object.keys(body).some(k=>!['state','expected_status','reason','confirmed'].includes(k))||
      !selectionStates.includes(body.state as SelectionState)||!selectionStates.includes(body.expected_status as SelectionState)||
      body.confirmed!==true)return fail('Confirma la acción y el estado que has revisado.');
    if(body.reason!==undefined&&body.reason!==null&&typeof body.reason!=='string')return fail('El motivo debe ser texto.');
    const reason=typeof body.reason==='string'?body.reason.trim():null;
    if(reason&&reason.length>2000)return fail('El motivo admite hasta 2000 caracteres.');
    const final=['ADVANCES','NOT_ADVANCES'].includes(String(body.state));
    if(reason&&!final)return fail('El motivo corresponde a una decisión final.');
    const record=await this.repo.change(actor.id,id,current=>{
      if(current.status!==body.expected_status)throw new AppError(409,'SELECTION_CONFLICT','El estado cambió. Vuelve a abrir la ficha antes de decidir.');
      if(!allowedActions(current).includes(body.state as SelectionState))throw new AppError(409,'TRANSITION_NOT_ALLOWED','La acción ya no está disponible. Las decisiones finales no pueden revertirse.');
      return {state:body.state as SelectionState,reason:reason||null};
    })??missing();
    return {record,allowed_actions:allowedActions(record)};
  }
}
