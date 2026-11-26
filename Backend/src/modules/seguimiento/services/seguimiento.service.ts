import { AppError } from '../../../shared/errors.js';
import type { Actor } from '../../cv/repositories/cv.repository.js';
import { examId } from '../../examenes/services/examenes.service.js';
import { trackingStates,type SeguimientoRepository,type TrackingRecord,type TrackingState,type TrackingQuery } from '../repositories/seguimiento.repository.js';
const state=(value:string|null):TrackingState|null=>trackingStates.includes(value as TrackingState)?value as TrackingState:null;
const allowed:Record<string,string[]>={PENDING:['IN_REVIEW','ADVANCES','NOT_ADVANCES'],IN_REVIEW:['SHORTLISTED','ADVANCES','NOT_ADVANCES'],SHORTLISTED:['ADVANCES','NOT_ADVANCES']};
const invalid=():never=>{throw new AppError(400,'INVALID_INPUT','Revisa los filtros de seguimiento.');};
function summary(r:TrackingRecord){
  // Lista blanca pública: sin notas, motivos privados, autor, scores ni datos de terceros.
  const status=state(r.status);
  return {id:r.id,job_id:r.job_id,title:r.title,status,registered_at:r.registered_at,
    job_status:r.job_status,process_finished_at:r.process_finished_at,filename:r.filename,
    status_at:status&&status===r.last_event_state?r.last_event_at:status==='PENDING'&&!r.last_event_state?r.registered_at:null,
    final:status==='ADVANCES'||status==='NOT_ADVANCES',can_replace_cv:status==='PENDING'};
}
export class SeguimientoService {
  constructor(private repo:SeguimientoRepository){}
  private authorize(actor:Actor){if(actor.role!=='CANDIDATE')throw new AppError(403,'FORBIDDEN','Solo el postulante puede consultar su seguimiento.');}
  async list(actor:Actor,input:Record<string,unknown>){
    this.authorize(actor);
    if(Object.keys(input).some(k=>!['search','status','page'].includes(k)))return invalid();
    const search=input.search??'',status=input.status??'',page=input.page??'1';
    if(typeof search!=='string'||search.trim().length>160||typeof status!=='string'||(status&&!state(status))||typeof page!=='string'||!/^\d{1,6}$/.test(page)||Number(page)<1)return invalid();
    const query:TrackingQuery={search:search.trim(),status:status?status as TrackingState:null,page:Number(page),page_size:20};
    const result=await this.repo.list(actor.id,query);
    return {items:result.items.map(summary),total:result.total,page:query.page,page_size:query.page_size,checked_at:new Date().toISOString()};
  }
  async read(actor:Actor,value:unknown){
    this.authorize(actor);
    const context=await this.repo.read(actor.id,examId(value));
    if(!context)throw new AppError(404,'APPLICATION_NOT_FOUND','La postulación no está disponible para tu cuenta.');
    const application=summary(context.application);
    let previous:string='PENDING',complete=application.status!==null,last=Date.parse(application.registered_at);
    const history:{status:TrackingState;at:string}[]=[];
    for(const event of context.events){
      const next=state(event.next_state),time=Date.parse(event.at);
      if(!next||!Number.isFinite(time)||time<last){complete=false;continue;}
      // El registro inicial puede existir en bases nuevas, pero nunca se sintetizan etapas intermedias.
      const initial=history.length===0&&event.previous_state===null&&next==='PENDING';
      if(!initial&&(event.previous_state!==previous||!allowed[previous]?.includes(next)))complete=false;
      history.push({status:next,at:event.at});previous=next;last=time;
    }
    if(previous!==application.status)complete=false;
    return {application,history,history_complete:complete,checked_at:new Date().toISOString()};
  }
}
