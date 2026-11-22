import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository, User } from '../src/modules/auth/repositories/auth.repository.js';
import { EvaluacionService, objectiveGrades, sources } from '../src/modules/evaluacion/services/evaluacion.service.js';
import { OllamaEvaluationAssistant } from '../src/modules/evaluacion/persistence/ollama-evaluation.assistant.js';
import { FakeAssistant, MemoryEvaluacion, withExam } from './evaluacion.fake.js';
let repo:MemoryEvaluacion,assistant:FakeAssistant,app:ReturnType<typeof createApp>;
const base='recruiter/applications/1/evaluation';
const call=(method:'get'|'post'|'put',path=base,body?:object,actor=1)=>{
  const r=request(app)[method]('/api/v1/'+path).set('Cookie','qt_session='+String(actor).repeat(64)).set('X-Qori-Client','web');
  return method==='get'?r:r.send(body);
};
const prepare=()=>call('post',base,{});
const reviewBody=(rating='MEETS')=>({revision:repo.context.evaluation!.revision,criteria:repo.context.evaluation!.criteria.map((c,i)=>({
  id:c.id,weight:c.weight,review:{rating,source_refs:[i?'languages:0':'skills:0'],explanation:'Evidencia revisada según el requisito.'},
}))});
beforeEach(()=>{
  repo=new MemoryEvaluacion();assistant=new FakeAssistant();
  const unsupported=async():Promise<never>=>{throw new Error('No usado');};
  const auth:AuthRepository={findByEmail:unsupported,createUser:unsupported,createSession:unsupported,touchSession:unsupported,deleteSession:unsupported,updateProfile:unsupported,findSession:async hash=>{
    const id=[1,2,3,4].find(id=>tokenHash(String(id).repeat(64))===hash);
    return id?{user:{id:String(id),role:id<3?'RECRUITER':'CANDIDATE',account_state:'ACTIVE',kind:id<3?'COMPANY':null} as User,expires_at:new Date(Date.now()+60000)}:null;
  }};
  app=createApp({checkConnection:async()=>{}},auth,undefined,undefined,undefined,undefined,repo,assistant);
});
describe('M06: evidencia y evaluación bajo revisión humana',()=>{
  it('consulta vacío y prepara perfil sobre 100 con pesos iguales, sin decisiones',async()=>{
    expect((await call('get')).body.total).toBeNull();
    const result=await prepare();expect(result.status).toBe(200);
    expect(result.body.evaluation.criteria.map((c:{weight:number})=>c.weight)).toEqual([50,50]);
    expect(result.body.profile_max).toBe(100);expect(result.body.total).toBeNull();
    expect(result.body.indicative).toBe(true);expect(result.body.filter_questions_scored).toBe(false);
    expect(JSON.stringify(result.body)).not.toContain('privado@example.test');
    expect((await prepare()).body.evaluation.revision).toBe(1);expect(repo.history).toHaveLength(1);
  });
  it.each(['get','post','put'] as const)('protege sesión, rol y propietario en %s',async method=>{
    const path=method==='put'?base+'/review':base,body=method==='put'?{revision:1,criteria:[]}:{};
    const absent=request(app)[method]('/api/v1/'+path).set('X-Qori-Client','web');
    const unauth=await (method==='get'?absent:absent.send(body));
    expect(unauth.status).toBe(401);expect(unauth.body.error.request_id).toBe(unauth.headers['x-request-id']);
    expect((await call(method,path,body,3)).status).toBe(403);
    expect((await call(method,path,body,2)).status).toBe(404);
    expect((await call(method,path.replace('/1/','/99/'),body)).status).toBe(404);
  });
  it('protege también la asistencia y rechaza origen/identificadores/campos',async()=>{
    await prepare();
    for(const actor of [2,3])expect((await call('post',base+'/assist',{revision:1},actor)).status).toBe(actor===2?404:403);
    expect(assistant.calls).toBe(0);
    expect((await request(app).post('/api/v1/'+base).set('Cookie','qt_session='+'1'.repeat(64)).send({})).status).toBe(403);
    expect((await call('get').set('Sec-Fetch-Site','cross-site')).status).toBe(403);
    expect((await call('get',base.replace('/1/','/0/'))).status).toBe(400);
    expect((await call('post',base,{user_id:'2'})).status).toBe(400);
    expect((await call('get')).headers['cache-control']).toBe('no-store');
  });
  it('no usa perfiles sin confirmar ni ofertas sin requisitos',async()=>{
    repo.context.confirmed=null;expect((await prepare()).body.error.code).toBe('PROFILE_UNCONFIRMED');
    repo=new MemoryEvaluacion();const service=new EvaluacionService(repo,assistant);repo.context.requirements=[];
    await expect(service.prepare({id:'1',role:'RECRUITER'},'1',{})).rejects.toMatchObject({code:'NO_REQUIREMENTS'});
  });
  it('califica correctas, incorrectas y omitidas desde respuestas guardadas',async()=>{
    withExam(repo.context);const result=await prepare();
    expect(result.body.grades[0]).toMatchObject({correct:1,total:3,unanswered:1});
    expect(result.body.profile_max).toBe(60);expect(result.body.exam_points).toBe(13.33);
    expect(repo.grades.size).toBe(1);await prepare();expect(repo.grades.size).toBe(1);
    const reviewed=await call('put',base+'/review',reviewBody());
    expect(reviewed.body.total).toBe(73.33);
  });
  it('no califica intentos abiertos ni respuestas tardías, ajenas o posteriores al envío',async()=>{
    withExam(repo.context);const t=repo.context.exams[0]!.attempts[0]!;
    t.status='IN_PROGRESS';expect(objectiveGrades(repo.context)).toEqual([]);
    t.status='EXPIRED';t.finished_at_utc=t.deadline_at_utc;
    t.answers[0]!.accepted_at_utc=t.deadline_at_utc;
    t.answers[1]!.option_id='11';expect(objectiveGrades(repo.context)[0]).toMatchObject({correct:0,unanswered:3});
    t.answers[0]!.accepted_at_utc='2026-11-22T10:00:55.000Z';t.finished_at_utc='2026-11-22T10:00:50.000Z';
    expect(objectiveGrades(repo.context)[0]!.correct).toBe(0);
  });
  it('rechaza claves de examen mal formadas',async()=>{
    withExam(repo.context);repo.context.exams[0]!.exam.questions[0]!.options[0]!.is_correct=false;
    expect((await prepare()).body.error.code).toBe('INVALID_EXAM_KEY');expect(repo.history).toHaveLength(0);
  });
  it('no inventa una ponderación para varios exámenes',async()=>{
    withExam(repo.context);repo.context.exams.push({...structuredClone(repo.context.exams[0]!),exam:{...repo.context.exams[0]!.exam,id:'21'}});
    await prepare();const result=await call('put',base+'/review',reviewBody());
    expect(result.body.total).toBeNull();expect(result.body.pending.join(' ')).toContain('varios exámenes');
  });
  it('mantiene el total pendiente si falta completar el examen',async()=>{
    withExam(repo.context);repo.context.exams[0]!.attempts=[];await prepare();
    expect((await call('put',base+'/review',reviewBody())).body.total).toBeNull();
  });
  it('guarda sugerencias sin convertirlas en valoraciones humanas',async()=>{
    await prepare();const result=await call('post',base+'/assist',{revision:1});
    expect(result.status).toBe(200);expect(result.body.evaluation.criteria[0].suggestion.rating).toBe('MEETS');
    expect(result.body.evaluation.criteria[0].review).toBeNull();expect(result.body.total).toBeNull();
    expect(result.body.evaluation.prompt_version).toBe('m06-evidence-v1');
  });
  it.each(['MEETS','PARTIAL','DOES_NOT_MEET','INSUFFICIENT_EVIDENCE'])('aplica %s y preserva faltantes',async rating=>{
    await prepare();const body=reviewBody(rating);
    if(rating==='INSUFFICIENT_EVIDENCE')body.criteria.forEach(c=>c.review.source_refs=[]);
    const result=await call('put',base+'/review',body);
    expect(result.status).toBe(200);
    expect(result.body.total).toBe(({MEETS:100,PARTIAL:50,DOES_NOT_MEET:0,INSUFFICIENT_EVIDENCE:null} as Record<string,number|null>)[rating]);
    expect(result.body.evaluation.reviewed_by).toBe('1');
  });
  it('ajusta pesos y calcula sin redondear cada contribución',async()=>{
    await prepare();const body=reviewBody();body.criteria[0]!.weight=20;body.criteria[1]!.weight=80;body.criteria[1]!.review.rating='PARTIAL';
    expect((await call('put',base+'/review',body)).body.total).toBe(60);
  });
  it('reparte exactamente cien puntos entre tres requisitos',async()=>{
    repo.context.requirements.push({id:'third',text:'Experiencia'});await prepare();
    expect(repo.context.evaluation!.criteria.map(c=>c.weight)).toEqual([33.34,33.33,33.33]);
  });
  it('rechaza pesos inválidos, duplicados y evidencias inventadas',async()=>{
    await prepare();
    for(const weight of [-1,0.001,101,49]){
      const body=reviewBody();body.criteria[0]!.weight=weight;
      expect((await call('put',base+'/review',body)).status).toBe(400);
    }
    let body=reviewBody();body.criteria[1]!.id=body.criteria[0]!.id;expect((await call('put',base+'/review',body)).status).toBe(400);
    body=reviewBody();body.criteria[0]!.review.source_refs=['name:0'];expect((await call('put',base+'/review',body)).status).toBe(400);
    body=reviewBody('DOES_NOT_MEET');body.criteria[0]!.review.source_refs=[];expect((await call('put',base+'/review',body)).status).toBe(400);
    expect(repo.history).toHaveLength(1);
  });
  it.each([
    {items:[]},
    {items:[{id:'requirement:1',rating:'MEETS',source_refs:['inventada'],explanation:'Inventado'},{id:'requirement:2',rating:'PARTIAL',source_refs:[],explanation:'Sin evidencia'}]},
    {items:[{id:'requirement:1',rating:'DOES_NOT_MEET',source_refs:[],explanation:'No consta'},{id:'requirement:2',rating:'PARTIAL',source_refs:['languages:0'],explanation:'Parcial'}]},
  ])('no persiste respuesta IA inválida',async output=>{
    await prepare();assistant.output=output;
    expect((await call('post',base+'/assist',{revision:1})).body.error.code).toBe('INVALID_AI_RESPONSE');
    expect(repo.history).toHaveLength(1);
  });
  it('conserva revisión humana al pedir otra sugerencia',async()=>{
    await prepare();await call('put',base+'/review',reviewBody('PARTIAL'));
    const result=await call('post',base+'/assist',{revision:2});
    expect(result.body.evaluation.criteria[0].review.rating).toBe('PARTIAL');expect(result.body.total).toBe(50);
  });
  it('impide escrituras perdidas y conserva historial',async()=>{
    await prepare();const body=reviewBody();
    const results=await Promise.all([call('put',base+'/review',body),call('put',base+'/review',body)]);
    expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(repo.history).toHaveLength(2);
  });
  it('bloquea reevaluación de nuevas fuentes y oculta el total anterior',async()=>{
    await prepare();await call('put',base+'/review',reviewBody());repo.context.confirmed!.id='6';
    const result=await call('get');expect(result.body.stale).toBe(true);expect(result.body.total).toBeNull();
    expect((await call('post',base+'/assist',{revision:2})).body.error.code).toBe('EVALUATION_STALE');
    expect((await call('put',base+'/review',reviewBody())).status).toBe(409);expect(assistant.calls).toBe(0);
  });
  it('detecta cambios durante la llamada a Ollama',async()=>{
    await prepare();assistant.suggest=async()=>{repo.context.requirements[0]!.text='Otro requisito';return assistant.output;};
    expect((await call('post',base+'/assist',{revision:1})).body.error.code).toBe('EVALUATION_STALE');
    expect(repo.history).toHaveLength(1);
  });
  it('limita las fuentes a información profesional confirmada',()=>{
    expect(sources(repo.context).map(s=>s.ref)).toEqual(['education:0','experience:0','skills:0','languages:0']);
  });
  it('oculta fallos de infraestructura sin datos privados',async()=>{
    repo.read=async()=>{throw new Error('mysql secreto contraseña');};
    const result=await call('get');expect(result.status).toBe(503);expect(JSON.stringify(result.body)).not.toContain('secreto');
  });
});
describe('Adaptador local Ollama',()=>{
  it('usa salida estructurada, timeout y solo datos profesionales',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({done:true,message:{content:JSON.stringify({items:[]})}})));
    const adapter=new OllamaEvaluationAssistant(fetcher as typeof fetch);
    expect(await adapter.suggest(repo.context.requirements,sources(repo.context))).toEqual({items:[]});
    const args=fetcher.mock.calls[0] as unknown as [string,RequestInit];
    expect(args[0]).toBe('http://127.0.0.1:11434/api/chat');
    const body=JSON.parse(args[1].body as string);
    expect(body.model).toBe('qwen2.5:7b-instruct');expect(body.stream).toBe(false);expect(body.format.type).toBe('object');
    expect(args[1].redirect).toBe('error');expect(args[1].signal).toBeTruthy();
    expect(body.messages[1].content).not.toContain('privado@example.test');
  });
  it.each(['offline','bad-json','incomplete','oversized'])('falla sin inventar resultados: %s',async mode=>{
    const fetcher=async()=>{
      if(mode==='offline')throw new Error('secreto');
      return new Response(mode==='bad-json'?'no-json':mode==='oversized'?'x'.repeat(128001):JSON.stringify({done:false,message:{content:'{}'}}));
    };
    await expect(new OllamaEvaluationAssistant(fetcher as typeof fetch).suggest([],[])).rejects.toMatchObject({code:'OLLAMA_UNAVAILABLE'});
  });
  it('no trunca silenciosamente perfiles grandes',async()=>{
    const fetcher=vi.fn();
    await expect(new OllamaEvaluationAssistant(fetcher).suggest([],[{ref:'skills:0',text:'a'.repeat(24001)}])).rejects.toMatchObject({code:'AI_INPUT_TOO_LARGE'});
    expect(fetcher).not.toHaveBeenCalled();
  });
});
