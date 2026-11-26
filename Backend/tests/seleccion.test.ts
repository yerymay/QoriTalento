import { beforeEach,describe,expect,it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository,User } from '../src/modules/auth/repositories/auth.repository.js';
import type { SeleccionRepository,SelectionRecord,SelectionChange,SelectionQuery,SelectionEvent } from '../src/modules/seleccion/repositories/seleccion.repository.js';
import { MemoryEvaluacion,withExam,FakeAssistant } from './evaluacion.fake.js';
import { EvaluacionService } from '../src/modules/evaluacion/services/evaluacion.service.js';
export class MemorySeleccion implements SeleccionRepository {
  record:SelectionRecord={id:'1',job_id:'10',job_title:'Desarrollo web',name:'Valeria Quispe',email:'valeria@example.test',status:'PENDING',submitted_at:'2026-11-25T12:00:00Z',process_finished:false,decision:null};
  history:SelectionEvent[]=[];query:SelectionQuery|null=null;private queue:Promise<unknown>=Promise.resolve();
  async jobs(owner:string){return owner==='1'?[{id:'10',title:'Desarrollo web'}]:[];}
  async list(owner:string,job:string,q:SelectionQuery){this.query=q;return owner==='1'&&job==='10'?{items:[structuredClone(this.record)],total:1}:null;}
  async read(owner:string,id:string){return owner==='1'&&id==='1'?{record:structuredClone(this.record),history:structuredClone(this.history)}:null;}
  async change(owner:string,id:string,decide:(r:SelectionRecord)=>SelectionChange){
    const run=this.queue.then(async()=>{const data=await this.read(owner,id);if(!data)return null;const next=decide(data.record),previous=data.record.status;
      this.record.status=next.state;this.history.push({previous_state:previous,next_state:next.state,actor_name:'Reclutador propietario',at:new Date().toISOString()});
      if(['ADVANCES','NOT_ADVANCES'].includes(next.state))this.record.decision={state:next.state,reason:next.reason,actor_id:owner,actor_name:'Reclutador propietario',at:new Date().toISOString()};
      return structuredClone(this.record);
    });this.queue=run.catch(()=>undefined);return run;
  }
}
let repo:MemorySeleccion,evaluations:MemoryEvaluacion,app:ReturnType<typeof createApp>;
const base='/api/v1/recruiter/applications/1/selection';
const call=(method:'get'|'post',path=base,body?:object,actor=1)=>{
  const r=request(app)[method](path).set('Cookie','qt_session='+String(actor).repeat(64)).set('X-Qori-Client','web');return method==='get'?r:r.send(body);
};
const change=(state:string,expected_status='PENDING')=>call('post',base,{state,expected_status,confirmed:true});
beforeEach(()=>{
  repo=new MemorySeleccion();evaluations=new MemoryEvaluacion();const unsupported=async():Promise<never>=>{throw new Error('No usado');};
  const auth:AuthRepository={findByEmail:unsupported,createUser:unsupported,createSession:unsupported,touchSession:unsupported,deleteSession:unsupported,updateProfile:unsupported,findSession:async hash=>{
    const id=[1,2,3].find(id=>tokenHash(String(id).repeat(64))===hash);
    return id?{user:{id:String(id),role:id===3?'CANDIDATE':'RECRUITER',account_state:'ACTIVE',kind:'COMPANY'} as User,expires_at:new Date(Date.now()+60000)}:null;
  }};
  app=createApp({checkConnection:async()=>{}},auth,undefined,undefined,undefined,undefined,evaluations,undefined,repo);
});
describe('M07: resultados y decisión humana',()=>{
  it.each(['/recruiter/selection/jobs','/recruiter/jobs/10/results','/recruiter/applications/1/selection'])('exige sesión y rol: %s',async path=>{
    const url='/api/v1'+path;expect((await request(app).get(url)).status).toBe(401);expect((await call('get',url,undefined,3)).status).toBe(403);
    const owner=await call('get',url);expect(owner.status).toBe(200);expect(owner.headers['cache-control']).toBe('no-store');
    const other=await call('get',url,undefined,2);if(path.endsWith('/jobs'))expect(other.body.items).toEqual([]);else expect(other.status).toBe(404);
  });
  it('devuelve perfil confirmado, notas de examen sin clave y totales pendientes',async()=>{
    withExam(evaluations.context);const detail=await call('get');expect(detail.body.profile.skills).toEqual(['TypeScript']);expect(detail.body.evaluation.total).toBeNull();
    expect(detail.body.evaluation.grades[0].correct).toBe(1);expect(JSON.stringify(detail.body)).not.toContain('is_correct');
    const list=await call('get','/api/v1/recruiter/jobs/10/results');expect(list.body.items[0].results.total).toBeNull();expect(list.body.ranking_enabled).toBe(false);
    expect(JSON.stringify(list.body)).not.toContain('source_refs');
  });
  it('mantiene resultados indicativos de M06 y oculta puntaje antiguo si cambian fuentes',async()=>{
    const service=new EvaluacionService(evaluations,new FakeAssistant());const prepared=await service.prepare({id:'1',role:'RECRUITER'},'1',{});
    await service.review({id:'1',role:'RECRUITER'},'1',{revision:1,criteria:prepared.evaluation!.criteria.map(c=>({id:c.id,weight:c.weight,review:{rating:'MEETS',source_refs:['skills:0'],explanation:'Revisado.'}}))});
    expect((await call('get','/api/v1/recruiter/jobs/10/results')).body.items[0].results.total).toBe(100);
    evaluations.context.requirements[0]!.text='Otro requisito';
    const stale=await call('get','/api/v1/recruiter/jobs/10/results');expect(stale.body.items[0].results).toMatchObject({total:null,profile_points:null,stale:true});
  });
  it('valida filtros, paginación e identificadores; no admite ranking',async()=>{
    for(const query of ['page=0','page=1.1','sort=total','status=HIRED','search=a&search=b','direction=DROP','unknown=x'])
      expect((await call('get','/api/v1/recruiter/jobs/10/results?'+query)).status).toBe(400);
    expect((await call('get','/api/v1/recruiter/jobs/0/results')).status).toBe(400);
    const ok=await call('get','/api/v1/recruiter/jobs/10/results?search=%25_%27&sort=name&direction=asc&page=2');
    expect(ok.status).toBe(200);expect(repo.query).toMatchObject({search:"%_'",sort:'name',direction:'asc',page:2,page_size:20});
  });
  it('registra el flujo completo, motivo, autor y fecha sin reversión',async()=>{
    expect((await change('IN_REVIEW')).status).toBe(200);expect((await change('SHORTLISTED','IN_REVIEW')).status).toBe(200);
    const final=await call('post',base,{state:'ADVANCES',expected_status:'SHORTLISTED',confirmed:true,reason:' Evidencia revisada '});
    expect(final.status).toBe(200);expect(final.body.record.decision).toMatchObject({actor_id:'1',state:'ADVANCES',reason:'Evidencia revisada'});expect(final.body.allowed_actions).toEqual([]);
    expect(repo.history.map(h=>h.next_state)).toEqual(['IN_REVIEW','SHORTLISTED','ADVANCES']);
    expect((await change('NOT_ADVANCES','ADVANCES')).status).toBe(409);expect((await change('ADVANCES','SHORTLISTED')).status).toBe(409);expect(repo.history).toHaveLength(3);
  });
  it.each(['PENDING','IN_REVIEW','SHORTLISTED'])('permite decisión humana final desde %s sin score automático',async state=>{
    repo.record.status=state;expect((await change('NOT_ADVANCES',state)).status).toBe(200);expect(repo.record.decision?.state).toBe('NOT_ADVANCES');
  });
  it('rechaza saltos, reversión, estados desconocidos y procesos finalizados',async()=>{
    expect((await change('SHORTLISTED')).status).toBe(409);repo.record.status='SHORTLISTED';expect((await change('IN_REVIEW','SHORTLISTED')).status).toBe(409);
    repo.record.status='PENDING';repo.record.process_finished=true;expect((await change('ADVANCES')).status).toBe(409);expect(repo.history).toHaveLength(0);
    repo.record.process_finished=false;repo.record.status=null;expect((await change('ADVANCES')).status).toBe(409);
  });
  it('protege mutaciones de otro propietario, postulante, sesión ausente y CSRF',async()=>{
    const body={state:'ADVANCES',expected_status:'PENDING',confirmed:true};
    expect((await call('post',base,body,2)).status).toBe(404);expect((await call('post',base,body,3)).status).toBe(403);
    expect((await request(app).post(base).set('X-Qori-Client','web').send(body)).status).toBe(401);
    expect((await request(app).post(base).set('Cookie','qt_session='+'1'.repeat(64)).send(body)).status).toBe(403);
    const cross=await call('post',base,body).set('Sec-Fetch-Site','cross-site');expect(cross.status).toBe(403);expect(cross.body.error.request_id).toBe(cross.headers['x-request-id']);
    expect(repo.history).toHaveLength(0);
  });
  it('no confía en campos del cliente ni permite decisiones sin confirmación',async()=>{
    for(const extra of [{user_id:'2'},{total:100},{confirmed:false},{state:'HIRED'},{reason:'x'.repeat(2001)},{reason:123}]){
      expect((await call('post',base,{state:'ADVANCES',expected_status:'PENDING',confirmed:true,...extra})).status).toBe(400);
    }expect(repo.history).toHaveLength(0);
  });
  it('serializa decisiones concurrentes: una sola gana y se audita una vez',async()=>{
    const results=await Promise.all([change('ADVANCES'),change('NOT_ADVANCES')]);expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(repo.history).toHaveLength(1);
  });
});
