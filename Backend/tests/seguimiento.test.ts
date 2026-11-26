import { beforeEach,describe,expect,it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository,User } from '../src/modules/auth/repositories/auth.repository.js';
import { SeguimientoService } from '../src/modules/seguimiento/services/seguimiento.service.js';
import type { SeguimientoRepository,TrackingContext,TrackingQuery } from '../src/modules/seguimiento/repositories/seguimiento.repository.js';
const fixture=():TrackingContext=>({application:{id:'1',job_id:'10',title:'Desarrollo web',status:'PENDING',job_status:'PUBLISHED',registered_at:'2026-11-25T12:00:00Z',process_finished_at:null,filename:'CV.pdf',last_event_state:null,last_event_at:null},events:[]});
class MemorySeguimiento implements SeguimientoRepository {
 context=fixture();query:TrackingQuery|null=null;
 async list(candidate:string,q:TrackingQuery){this.query=q;return {items:candidate==='1'?[structuredClone(this.context.application)]:[],total:candidate==='1'?1:0};}
 async read(candidate:string,id:string){return candidate==='1'&&id==='1'?structuredClone(this.context):null;}
}
let repo:MemorySeguimiento,app:ReturnType<typeof createApp>,service:SeguimientoService;
const list='/api/v1/candidate/applications/tracking',detail='/api/v1/candidate/applications/1/tracking';
const get=(path=detail,actor=1)=>request(app).get(path).set('Cookie','qt_session='+String(actor).repeat(64));
beforeEach(()=>{
 repo=new MemorySeguimiento();service=new SeguimientoService(repo);const unused=async():Promise<never>=>{throw new Error('No usado');};
 const auth:AuthRepository={findByEmail:unused,createUser:unused,createSession:unused,touchSession:unused,deleteSession:unused,updateProfile:unused,findSession:async hash=>{
  const id=[1,2,3].find(n=>tokenHash(String(n).repeat(64))===hash);
  return id?{user:{id:String(id),role:id===3?'RECRUITER':'CANDIDATE',account_state:'ACTIVE',kind:id===3?'COMPANY':null} as User,expires_at:new Date(Date.now()+60000)}:null;
 }};
 app=createApp({checkConnection:async()=>{}},auth,undefined,undefined,undefined,undefined,undefined,undefined,undefined,repo);
});
describe('M08: seguimiento privado',()=>{
 it.each([list,detail])('exige sesión y rol en %s',async path=>{
  const absent=await request(app).get(path);expect(absent.status).toBe(401);expect(absent.body.error.request_id).toBe(absent.headers['x-request-id']);
  expect((await get(path,3)).status).toBe(403);expect((await get(path).set('Sec-Fetch-Site','cross-site')).status).toBe(403);
  const own=await get(path);expect(own.status).toBe(200);expect(own.headers['cache-control']).toBe('no-store');
 });
 it('aísla postulantes e identificadores inexistentes',async()=>{
  expect((await get(list,2)).body.items).toEqual([]);expect((await get(detail,2)).status).toBe(404);
  expect((await get(detail.replace('/1/','/99/'))).status).toBe(404);
  for(const id of ['0','-1','abc','18446744073709551616'])expect((await get(detail.replace('/1/','/'+id+'/'))).status).toBe(400);
 });
 it('valida filtros sin aceptar identidad enviada por cliente',async()=>{
  for(const q of ['user_id=2','status=HIRED','page=0','page=-1','page=1.5','search=a&search=b','search='+('a'.repeat(161))])
   expect((await get(list+'?'+q)).status).toBe(400);
  expect((await get(list+'?search=%25_%27&status=IN_REVIEW&page=2')).status).toBe(200);
  expect(repo.query).toMatchObject({search:"%_'",status:'IN_REVIEW',page:2,page_size:20});
 });
 it('muestra registro inicial sin inventar historial ni fechas',async()=>{
  const r=await get();expect(r.body.application).toMatchObject({status:'PENDING',status_at:'2026-11-25T12:00:00Z',can_replace_cv:true,final:false});
  expect(r.body.history).toEqual([]);expect(r.body.history_complete).toBe(true);
 });
 it.each(['ADVANCES','NOT_ADVANCES'] as const)('refleja final %s directo sin inventar pasos',async status=>{
  repo.context.application.status=status;repo.context.application.last_event_state=status;repo.context.application.last_event_at='2026-11-25T13:00:00Z';
  repo.context.events=[{previous_state:'PENDING',next_state:status,at:'2026-11-25T13:00:00Z'}];
  const r=await get();expect(r.body.application).toMatchObject({status,final:true,can_replace_cv:false,status_at:'2026-11-25T13:00:00Z'});
  expect(r.body.history).toEqual([{status,at:'2026-11-25T13:00:00Z'}]);expect(r.body.history_complete).toBe(true);
 });
 it('muestra flujo completo en orden con fechas persistidas',async()=>{
  repo.context.events=[{previous_state:'PENDING',next_state:'IN_REVIEW',at:'2026-11-25T13:00:00Z'},{previous_state:'IN_REVIEW',next_state:'SHORTLISTED',at:'2026-11-25T14:00:00Z'}];
  Object.assign(repo.context.application,{status:'SHORTLISTED',last_event_state:'SHORTLISTED',last_event_at:'2026-11-25T14:00:00Z'});
  const r=await get();expect(r.body.history.map((h:{status:string})=>h.status)).toEqual(['IN_REVIEW','SHORTLISTED']);expect(r.body.history_complete).toBe(true);
 });
 it('no confunde proceso cerrado con rechazo ni cambia estados',async()=>{
  Object.assign(repo.context.application,{job_status:'CLOSED',process_finished_at:'2026-11-25T13:00:00Z'});
  const before=structuredClone(repo.context),r=await get();expect(r.body.application).toMatchObject({status:'PENDING',final:false,process_finished_at:'2026-11-25T13:00:00Z'});
  expect(repo.context).toEqual(before);
 });
 it('protege notas privadas, actores y scores mediante lista blanca',async()=>{
  Object.assign(repo.context.application,{reason:'SECRETO',actor_name:'SECRETO',score:99,candidate_user_id:'2'});
  repo.context.events.push(Object.assign({previous_state:'PENDING',next_state:'IN_REVIEW',at:'2026-11-25T13:00:00Z'},{actor_user_id:'999',reason:'SECRETO'}));
  for(const path of [list,detail]){const r=await get(path);const json=JSON.stringify(r.body);for(const key of ['SECRETO','actor_user_id','actor_name','candidate_user_id','score'])expect(json).not.toContain(key);}
 });
 it('marca parcial un estado sin eventos y no inventa su fecha',async()=>{
  repo.context.application.status='IN_REVIEW';const r=await get();expect(r.body.history_complete).toBe(false);expect(r.body.application.status_at).toBeNull();expect(r.body.history).toEqual([]);
 });
 it('trata estados desconocidos e historial inconsistente como parcial',async()=>{
  repo.context.application.status='LEGACY';repo.context.events=[{previous_state:'PENDING',next_state:'LEGACY',at:'2026-11-25T13:00:00Z'}];
  let r=await get();expect(r.body.application.status).toBeNull();expect(r.body.history).toEqual([]);expect(r.body.history_complete).toBe(false);expect(JSON.stringify(r.body)).not.toContain('LEGACY');
  repo.context.application.status='SHORTLISTED';repo.context.events=[{previous_state:'PENDING',next_state:'SHORTLISTED',at:'2026-11-25T13:00:00Z'}];r=await get();expect(r.body.history_complete).toBe(false);
 });
 it('detecta fechas anteriores al registro y acepta evento inicial explícito',async()=>{
  repo.context.events=[{previous_state:null,next_state:'PENDING',at:'2026-11-25T12:00:00Z'}];expect((await get()).body.history_complete).toBe(true);
  repo.context.events=[{previous_state:'PENDING',next_state:'IN_REVIEW',at:'2026-11-24T12:00:00Z'}];expect((await get()).body.history_complete).toBe(false);expect((await get()).body.history).toEqual([]);
 });
 it('no expone operaciones de escritura al postulante',async()=>{
  const r=await request(app).post(detail).set('Cookie','qt_session='+'1'.repeat(64)).set('X-Qori-Client','web').send({status:'ADVANCES'});expect(r.status).toBe(404);expect(repo.context.application.status).toBe('PENDING');
  await expect(service.read({id:'1',role:'RECRUITER'},'1')).rejects.toMatchObject({status:403});
 });
});
