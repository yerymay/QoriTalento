import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository, User } from '../src/modules/auth/repositories/auth.repository.js';
import { MemoryExamenes } from './examenes.fake.js';
import { startExamExpiryWorker } from '../src/modules/examenes/services/expiry-worker.js';
let repo:MemoryExamenes,app:ReturnType<typeof createApp>;
const input={title:'Fundamentos de TypeScript',time_limit_minutes:1,questions:[{text:'¿Qué permite tipar una variable?',options:[{text:'Una anotación de tipo',is_correct:true},{text:'Una hoja CSS',is_correct:false}]}]};
const call=(method:'get'|'post'|'put',path:string,body?:unknown,actor=1)=>{const r=request(app)[method]('/api/v1/'+path).set('Cookie','qt_session='+String(actor).repeat(64)).set('X-Qori-Client','web');return method==='get'?r:r.send(body);};
const create=async()=>{const r=await call('post','recruiter/jobs/1/exams',input);expect(r.status).toBe(201);return r.body;};
const published=async()=>{await create();expect((await call('post','recruiter/exams/1/publish',{})).status).toBe(200);};
const start=()=>call('post','candidate/exams/1/attempts',{application_id:'1'},3);
const answer=(body:unknown={option_id:'1',client_revision:1},question='1')=>call('put','candidate/attempts/1/answers/'+question,body,3);
beforeEach(()=>{
  repo=new MemoryExamenes();
  const unsupported=async():Promise<never>=>{throw new Error('No usado');};
  const auth:AuthRepository={findByEmail:unsupported,createUser:unsupported,createSession:unsupported,touchSession:unsupported,deleteSession:unsupported,updateProfile:unsupported,findSession:async hash=>{
    const id=[1,2,3,4].find(id=>tokenHash(String(id).repeat(64))===hash);
    return id?{user:{id:String(id),role:id<3?'RECRUITER':'CANDIDATE',account_state:'ACTIVE',kind:id<3?'COMPANY':null} as User,expires_at:new Date(Date.now()+60000)}:null;
  }};
  app=createApp({checkConnection:async()=>{}},auth,undefined,undefined,undefined,repo);
});
describe('M05: contrato y reglas de exámenes',()=>{
  it('crea, consulta, edita y publica un examen de oferta propia',async()=>{
    await create();
    expect((await call('get','recruiter/exams')).body.items).toHaveLength(1);
    expect((await call('get','recruiter/exams/1')).body.questions[0].options[0].is_correct).toBe(true);
    expect((await call('put','recruiter/exams/1',{...input,title:'Prueba técnica'})).body.title).toBe('Prueba técnica');
    expect((await call('post','recruiter/exams/1/publish',{})).body.status).toBe('PUBLISHED');
    expect((await call('put','recruiter/exams/1',input)).body.error.code).toBe('EXAM_IMMUTABLE');
    expect((await call('post','recruiter/exams/1/publish',{})).status).toBe(200);
  });
  it('permite borradores parciales pero no publicarlos',async()=>{
    expect((await call('post','recruiter/jobs/1/exams',{...input,questions:[]})).status).toBe(201);
    expect((await call('post','recruiter/exams/1/publish',{})).body.error.code).toBe('EXAM_INCOMPLETE');
    expect((await start()).status).toBe(404);
    expect((await call('get','candidate/exams',undefined,3)).body.items).toEqual([]);
  });
  it('rechaza tiempo, campos, identificadores y alternativas inválidos',async()=>{
    for(const body of [{...input,user_id:'1'},{...input,time_limit_minutes:0},{...input,time_limit_minutes:1.2},{...input,time_limit_minutes:481},{...input,questions:[{text:'?',options:[{text:'1',is_correct:true}]}]},{...input,questions:[{text:'?',options:[{text:'1',is_correct:true},{text:'2',is_correct:true}]}]}]){
      expect((await call('post','recruiter/jobs/1/exams',body)).status).toBe(400);
    }
    expect((await call('get','recruiter/exams/0')).status).toBe(400);
    expect((await call('get','recruiter/exams/18446744073709551616')).status).toBe(400);
  });
  it('exige sesión, rol, propiedad y origen confiable',async()=>{
    await create();
    const unauth=await request(app).get('/api/v1/recruiter/exams');expect(unauth.status).toBe(401);expect(unauth.body.error.request_id).toBe(unauth.headers['x-request-id']);
    expect((await call('get','recruiter/exams/1',undefined,3)).status).toBe(403);
    expect((await call('get','recruiter/exams/1',undefined,2)).status).toBe(404);
    expect((await call('put','recruiter/exams/1',input,2)).status).toBe(404);
    expect((await call('post','recruiter/jobs/1/exams',input,2)).status).toBe(404);
    expect((await request(app).post('/api/v1/recruiter/jobs/1/exams').set('Cookie','qt_session='+'1'.repeat(64)).send(input)).status).toBe(403);
    expect((await call('get','recruiter/exams').set('Sec-Fetch-Site','cross-site')).status).toBe(403);
  });
  it('un solo intento, reloj del servidor y ninguna clave correcta para el postulante',async()=>{
    await published();const first=await start(),second=await start();
    expect(first.body.attempt.id).toBe(second.body.attempt.id);expect(repo.attempts).toHaveLength(1);
    expect(first.body.attempt.started_at_utc).toBe(repo.clock);
    expect(first.body.attempt.deadline_at_utc).toBe('2026-11-15T12:01:00.000Z');
    expect(JSON.stringify(first.body)).not.toContain('is_correct');
    expect(JSON.stringify((await call('get','candidate/exams',undefined,3)).body)).not.toContain('options');
    expect((await call('post','candidate/exams/1/attempts',{application_id:'1',deadline_at_utc:'2099-01-01'},3)).status).toBe(400);
  });
  it('aísla intentos y comprueba postulación, pregunta y alternativa',async()=>{
    await published();await start();
    expect((await call('post','candidate/exams/1/attempts',{application_id:'2'},3)).status).toBe(404);
    expect((await call('get','candidate/attempts/1',undefined,4)).status).toBe(404);
    expect((await call('put','candidate/attempts/1/answers/1',{option_id:'1',client_revision:1},4)).status).toBe(404);
    expect((await call('post','candidate/attempts/1/submit',{},4)).status).toBe(404);
    expect((await answer({option_id:'99',client_revision:1})).status).toBe(400);
    expect((await answer(undefined,'99')).status).toBe(400);
  });
  it('guarda por pregunta, reintento idempotente y revisión monotónica',async()=>{
    await published();await start();
    const first=await answer();expect(first.status).toBe(200);
    repo.clock='2026-11-15T12:00:05.000Z';
    expect((await answer()).body.attempt.answers[0].accepted_at_utc).toBe('2026-11-15T12:00:00.000Z');
    expect((await answer({option_id:'2',client_revision:1})).body.error.code).toBe('ANSWER_CONFLICT');
    expect((await answer({option_id:'2',client_revision:2})).status).toBe(200);
    expect((await answer()).status).toBe(409);
    expect((await answer({option_id:'1',client_revision:0})).status).toBe(400);
    expect(repo.attempts[0]!.answers).toHaveLength(1);
  });
  it('acepta justo antes del límite y rechaza exactamente en el límite sin perder lo guardado',async()=>{
    await published();await start();repo.clock='2026-11-15T12:00:59.999Z';expect((await answer()).status).toBe(200);
    repo.clock='2026-11-15T12:01:00.000Z';expect((await answer({option_id:'2',client_revision:2})).body.error.code).toBe('ATTEMPT_CLOSED');
    expect(repo.attempts[0]).toMatchObject({status:'EXPIRED',finished_at_utc:repo.clock,answers:[{option_id:'1'}]});
    expect((await start()).body.attempt.status).toBe('EXPIRED');
  });
  it('envío manual idempotente y sin escritura posterior',async()=>{
    await published();await start();await answer();
    const first=await call('post','candidate/attempts/1/submit',{},3);repo.clock='2026-11-15T12:00:30.000Z';
    expect((await call('post','candidate/attempts/1/submit',{},3)).body.attempt.finished_at_utc).toBe(first.body.attempt.finished_at_utc);
    expect((await answer({option_id:'2',client_revision:2})).status).toBe(409);
    expect(JSON.stringify(first.body)).not.toContain('is_correct');
  });
  it('reconexión y lectura cierran un intento vencido',async()=>{
    await published();await start();repo.clock='2026-11-15T12:03:00.000Z';
    const result=await call('get','candidate/attempts/1',undefined,3);
    expect(result.body.attempt.status).toBe('EXPIRED');expect(result.body.attempt.finished_at_utc).toBe('2026-11-15T12:01:00.000Z');
    expect(result.headers['cache-control']).toBe('no-store');
  });
  it('proceso finalizado bloquea nuevos intentos y permite recuperar los existentes',async()=>{
    await published();repo.finished=true;expect((await start()).body.error.code).toBe('PROCESS_FINISHED');
    repo.finished=false;await start();repo.finished=true;expect((await start()).status).toBe(200);
  });
  it('oculta detalles de fallos de persistencia',async()=>{
    repo.listOwned=async()=>{throw new Error('mysql password secreto');};
    const result=await call('get','recruiter/exams');expect(result.status).toBe(503);expect(JSON.stringify(result.body)).not.toContain('secreto');
  });
  it('worker cierra sin cliente y reintenta después de un fallo',async()=>{
    vi.useFakeTimers();try{
      await published();await start();repo.clock='2026-11-15T12:02:00.000Z';
      const task=vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(()=>repo.expireDue()),failure=vi.fn();
      const stop=startExamExpiryWorker({expireDue:task},failure);await vi.advanceTimersByTimeAsync(1000);
      expect(failure).toHaveBeenCalledTimes(1);expect(repo.attempts[0]!.status).toBe('EXPIRED');stop();
    }finally{vi.useRealTimers();}
  });
});
