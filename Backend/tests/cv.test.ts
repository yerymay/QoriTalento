import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/shared/errors.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository, User } from '../src/modules/auth/repositories/auth.repository.js';
import type { Actor, ConfirmedProfile, CvChange, CvContext, CvNote, CvRepository } from '../src/modules/cv/repositories/cv.repository.js';
import { extractPdf, extractProfile } from '../src/modules/cv/services/extractor.js';
import { makePdf, sampleLines, samplePdf } from './cv-fixtures.js';

class Memory implements CvRepository {
  context: CvContext = { application_id:'1', candidate_id:'1', title:'Vacante sintética', status:'PENDING', document:{id:'10',filename:'cv.pdf',bytes:samplePdf()}, extraction:null, confirmed:null, current_profile_id:null };
  profile: ConfirmedProfile | null = null; notes: CvNote[] = []; writes = 0;
  async getContext(actor: Actor, id: string) { if (id !== '1' || !((actor.role === 'CANDIDATE' && actor.id === '1') || (actor.role === 'RECRUITER' && actor.id === '3'))) throw new AppError(404,'APPLICATION_NOT_FOUND','No disponible.'); return structuredClone(this.context); }
  async change(actor: Actor, id: string, decide: (c: CvContext) => CvChange) {
    const action = decide(await this.getContext(actor,id));
    if (action.kind === 'extract') this.context.extraction = action.extraction;
    if (action.kind === 'confirm') { this.writes++; this.profile = {id:String(this.writes),source_cv_id:this.context.document!.id,confirmed_at:new Date().toISOString(),profile:action.profile}; this.context.confirmed=this.profile; this.context.current_profile_id=this.profile.id; }
    if (action.kind === 'note') this.notes.push({id:'1',body:action.body,created_at:new Date().toISOString()});
  }
  async getProfile(id: string) { return id==='1' ? this.profile : null; }
  async getDocument(actor: Actor,id: string,doc: string) { await this.getContext(actor,id); if(doc!==this.context.document?.id) throw new AppError(404,'CV_NOT_FOUND','No disponible.'); return this.context.document; }
  async listNotes(actor: Actor,id: string) { await this.getContext(actor,id); return this.notes; }
  async listApplications(owner: string,job: string) { if(owner!=='3'||job!=='1')throw new AppError(404,'JOB_NOT_FOUND','No disponible.');return [{id:'1',name:'Ana',title:'Oferta',confirmed:!!this.profile}]; }
}
const cookie=(id:string)=>`qt_session=${id.repeat(64)}`;
let repo:Memory, app:ReturnType<typeof createApp>;
beforeEach(()=>{
  const users=['CANDIDATE','CANDIDATE','RECRUITER','RECRUITER'].map((role,i)=>({id:String(i+1),role,name:'Prueba',email:`${i}@example.test`,phone:null,kind:null,account_state:'ACTIVE',email_verified:true,phone_verified:true,password_hash:''} as User));
  const unused=async():Promise<never>=>{throw new Error('No usado');};
  const auth:AuthRepository={findByEmail:unused,createUser:unused,createSession:unused,touchSession:unused,deleteSession:unused,updateProfile:unused,findSession:async hash=>{const user=users.find(u=>tokenHash(u.id.repeat(64))===hash);return user?{user,expires_at:new Date(Date.now()+60000)}:null;}};
  repo=new Memory();app=createApp({checkConnection:async()=>undefined},auth,undefined,undefined,repo);
});
const base='/api/v1/candidate/applications/1';
const review=()=>request(app).get(base+'/cv-extraction').set('Cookie',cookie('1'));
const confirm=(body:object,id='1')=>request(app).put(base+'/profile-confirmation').set('Cookie',cookie(id)).set('X-Qori-Client','web').send(body);
describe('M04: extracción clásica',()=>{
  it('extrae los nueve grupos de un PDF digital con evidencia de página',async()=>{
    const result=await extractPdf(samplePdf());
    expect(result.profile).toEqual({name:'Ana Torres',email:'ana@example.test',phone:'+51 987 654 321',location:'Abancay, Perú',summary:'Desarrolladora de sistemas de información.',education:['UNAMBA, Ingeniería Informática, 2018 - 2023'],experience:['Desarrolladora en Empresa Demo, 2023 - Actualidad\nImplementación de aplicaciones web.'],skills:['TypeScript','SQL','Git'],languages:['Español nativo','Inglés intermedio']});
    expect(result.evidence.email?.[0].page).toBe(1);
  });
  it('lee todas las páginas, conserva tildes y separa columnas',async()=>{
    const lines=[{text:'Nombre: Ana Torres',x:40,y:740}, ...['Contacto','ana@example.test','+51 987 654 321','Idiomas','Español','Inglés'].map((text,i)=>({text,x:40,y:640-i*22})), ...['Experiencia','Empresa Demo','2020 - 2024','Desarrollo web','Formación','UNAMBA'].map((text,i)=>({text,x:330,y:640-i*22}))];
    const result=await extractPdf(makePdf([lines,[{text:'Habilidades: SQL, Git'}]]));
    expect(result.profile.languages).toEqual(['Español','Inglés']);expect(result.profile.experience.join(' ')).toContain('Empresa Demo');expect(result.profile.skills).toEqual(['SQL','Git']);expect(result.evidence.skills?.[0].page).toBe(2);
  });
  it('no inventa campos ni confunde fechas o contactos de referencias',()=>{
    const result=extractProfile(['Experiencia','2018 - 2022','Referencias','Otro Nombre','otro@example.test','999888777'].map(text=>({text,page:1})));
    expect(result.profile.email).toBe('');expect(result.profile.phone).toBe('');expect(result.profile.name).toBe('');expect(result.profile.education).toEqual([]);
  });
  it('marca contactos ambiguos para revisión',()=>{
    const result=extractProfile(['a@example.test b@example.test','987654321','912345678'].map(text=>({text,page:1})));
    expect(result.profile.email).toBe('');expect(result.profile.phone).toBe('');expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });
  it('rechaza PDF ilegible, sin texto y demasiado largo',async()=>{
    await expect(extractPdf(Buffer.from('%PDF-invalido'))).rejects.toMatchObject({code:'INVALID_PDF'});
    await expect(extractPdf(makePdf([[]]))).rejects.toMatchObject({code:'INVALID_PDF'});
    await expect(extractPdf(makePdf(Array.from({length:41},()=>[{text:'Texto'}])))).rejects.toMatchObject({code:'CV_TOO_LONG'});
  });
});
describe('M04: API y confirmación',()=>{
  it('propone sin actualizar; confirma correcciones e impide modificación posterior',async()=>{
    const result=await review();expect(result.status).toBe(200);expect(repo.profile).toBeNull();
    const profile={...result.body.extraction.profile,name:'Ana Torres Corregida'};
    const payload={document_id:'10',base_profile_id:null,profile};
    const saved=await confirm(payload);expect(saved.status).toBe(200);expect(saved.body.confirmed.profile.name).toBe(profile.name);expect(saved.body.can_confirm).toBe(false);
    expect((await confirm(payload)).status).toBe(200);expect(repo.writes).toBe(1);
    expect((await confirm({...payload,profile:{...profile,name:'Otro'}})).status).toBe(409);
    expect((await request(app).get('/api/v1/candidate/profile').set('Cookie',cookie('1'))).body.profile.profile.name).toBe(profile.name);
    expect((await request(app).get('/api/v1/candidate/profile').set('Cookie',cookie('2'))).body.profile).toBeNull();
  });
  it('valida propiedad, roles, origen y campos extra en cada recurso',async()=>{
    for(const path of [base+'/cv-extraction',base+'/cv/10']) {
      expect((await request(app).get(path)).status).toBe(401);
      expect((await request(app).get(path).set('Cookie',cookie('2'))).status).toBe(404);
      expect((await request(app).get(path).set('Cookie',cookie('3'))).status).toBe(403);
    }
    const data=(await review()).body.extraction.profile;
    expect((await confirm({document_id:'10',base_profile_id:null,profile:data},'2')).status).toBe(404);
    expect((await confirm({document_id:'10',base_profile_id:null,profile:data},'3')).status).toBe(403);
    expect((await confirm({document_id:'10',base_profile_id:null,profile:data,user_id:'2'})).status).toBe(400);
    expect((await confirm({document_id:'10',base_profile_id:null,profile:{...data,email:'invalido'}})).status).toBe(400);
    expect((await request(app).put(base+'/profile-confirmation').set('Cookie',cookie('1')).send({})).status).toBe(403);
    const error=await request(app).get(base+'/cv/10').set('Cookie',cookie('1')).set('Sec-Fetch-Site','cross-site');expect(error.status).toBe(403);expect(error.body.error.request_id).toBe(error.headers['x-request-id']);
  });
  it('impide confirmar versiones obsoletas, perfil concurrente o postulación en evaluación',async()=>{
    const profile=(await review()).body.extraction.profile;
    const payload={document_id:'10',base_profile_id:null,profile};
    repo.context.current_profile_id='22';expect((await confirm(payload)).body.error.code).toBe('PROFILE_CHANGED');
    repo.context.current_profile_id=null;repo.context.document!.id='11';expect((await confirm(payload)).body.error.code).toBe('CV_CHANGED');
    repo.context.document!.id='10';repo.context.status='IN_REVIEW';expect((await confirm(payload)).body.error.code).toBe('CONFIRMATION_UNAVAILABLE');
    expect(repo.writes).toBe(0);
  });
  it('conserva el perfil confirmado tras reemplazo hasta nueva confirmación',async()=>{
    const profile=(await review()).body.extraction.profile;
    await confirm({document_id:'10',base_profile_id:null,profile});
    repo.context.document!.id='11';repo.context.extraction=null;
    const replacement=await review();expect(replacement.body.confirmed.source_cv_id).toBe('10');expect(replacement.body.can_confirm).toBe(true);
    expect((await confirm({document_id:'11',base_profile_id:'1',profile:{...profile,name:'Ana Actualizada'}})).status).toBe(200);
    expect(repo.profile?.source_cv_id).toBe('11');
  });
  it('reclutador ve solo datos confirmados, PDF privado y notas de su oferta',async()=>{
    await review();const path='/api/v1/recruiter/applications/1';
    const get=(suffix:string,id='3')=>request(app).get(path+suffix).set('Cookie',cookie(id));
    expect((await get('/cv-extraction')).body.extraction).toBeNull();expect((await get('/cv-extraction')).body.confirmed).toBeNull();
    const pdf=await get('/cv/10');expect(pdf.status).toBe(200);expect(pdf.headers['cache-control']).toBe('no-store');expect(pdf.headers['content-type']).toContain('application/pdf');
    for(const suffix of ['/cv-extraction','/cv/10','/notes']) expect((await get(suffix,'4')).status).toBe(404);
    expect((await request(app).post(path+'/notes').set('Cookie',cookie('4')).set('X-Qori-Client','web').send({body:'Nota'})).status).toBe(404);
    expect((await request(app).post(path+'/notes').set('Cookie',cookie('3')).set('X-Qori-Client','web').send({body:'Nota de revisión'})).status).toBe(201);
    expect((await get('/notes')).body.items[0].body).toBe('Nota de revisión');
    expect((await request(app).get('/api/v1/recruiter/jobs/1/applications').set('Cookie',cookie('3'))).body.items).toHaveLength(1);
    expect((await request(app).get('/api/v1/recruiter/jobs/1/applications').set('Cookie',cookie('4'))).status).toBe(404);
  });
});
