import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import { AppError } from '../src/shared/errors.js';
import type { AuthRepository, User } from '../src/modules/auth/repositories/auth.repository.js';
import type { Application, CvFile, PostulacionesRepository } from '../src/modules/postulaciones/repositories/postulaciones.repository.js';

function pdf(text: string) {
  const content = `BT /F1 12 Tf 40 700 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let result = '%PDF-1.4\n', offsets = [0];
  for (let i=0;i<objects.length;i++) { offsets.push(Buffer.byteLength(result)); result += `${i+1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(result);
  result += `xref\n0 ${offsets.length}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10,'0')} 00000 n \n`).join('');
  return Buffer.from(result + `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
class Memory implements PostulacionesRepository {
  rows: Array<Application & {candidate:string}> = [];
  async finish(owner: string, job: string) {
    if (owner !== '3' || job !== '1') throw new AppError(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.');
    return {finished_at: '2026-11-06T12:00:00.000Z'};
  }
  async list(candidate: string) { return this.rows.filter(x=>x.candidate===candidate).map(({candidate:_,...x})=>x); }
  async create(candidate:string, job:string, file:CvFile) {
    if (job !== '1') throw new AppError(404,'JOB_NOT_AVAILABLE','Esta oferta ya no está disponible.');
    if (this.rows.some(x=>x.candidate===candidate && x.job_id===job && x.status==='PENDING')) throw new AppError(409,'ACTIVE_APPLICATION','Ya tienes una postulación activa.');
    const row = {id:String(this.rows.length+1),job_id:job,title:'Oferta',status:'PENDING',created_at:new Date().toISOString(),submitted_at:new Date().toISOString(),filename:file.filename,candidate};
    this.rows.push(row); const {candidate:_,...result}=row; return result;
  }
  async replace(candidate:string,id:string,file:CvFile) {
    const row=this.rows.find(x=>x.id===id && x.candidate===candidate);
    if (!row) throw new AppError(404,'APPLICATION_NOT_FOUND','No se encontró la postulación.');
    if (row.status!=='PENDING') throw new AppError(409,'CV_REPLACEMENT_UNAVAILABLE','No disponible.');
    row.filename=file.filename; const {candidate:_,...result}=row; return result;
  }
}
const cookie = (id:string) => `qt_session=${id.repeat(64)}`;
let repo:Memory, app:ReturnType<typeof createApp>;
beforeEach(() => {
  const users = ['CANDIDATE','CANDIDATE','RECRUITER'].map((role,index)=>({ id:String(index+1),name:'Prueba',email:`test${index}@example.test`,phone:null,role,kind:null,account_state:'ACTIVE',email_verified:true,phone_verified:true,password_hash:'' } as User));
  const unsupported=async ():Promise<never>=>{throw new Error('No usado');};
  const auth:AuthRepository={findByEmail:unsupported,createUser:unsupported,createSession:unsupported,touchSession:unsupported,deleteSession:unsupported,updateProfile:unsupported,findSession:async hash=>{
    const user=users.find((_,i)=>tokenHash(String(i+1).repeat(64))===hash);return user?{user,expires_at:new Date(Date.now()+60000)}:null;
  }};
  repo=new Memory(); app=createApp({checkConnection:async()=>undefined},auth,undefined,repo);
});
describe('M03: postulaciones',()=>{
  it('registra un PDF válido y lo muestra solo a su propietario',async()=>{
    const created=await request(app).post('/api/v1/jobs/1/applications').set('Cookie',cookie('1')).set('X-Qori-Client','web').attach('cv',pdf('Experiencia profesional'),{filename:'cv.pdf',contentType:'application/pdf'});
    expect(created.status).toBe(201); expect(created.body).toMatchObject({status:'PENDING',filename:'cv.pdf'});
    expect((await request(app).get('/api/v1/applications').set('Cookie',cookie('1'))).body.items).toHaveLength(1);
    expect((await request(app).get('/api/v1/applications').set('Cookie',cookie('2'))).body.items).toHaveLength(0);
    expect((await request(app).put('/api/v1/applications/1/cv').set('Cookie',cookie('2')).set('X-Qori-Client','web').attach('cv',pdf('CV nuevo'),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(404);
    expect((await request(app).get('/api/v1/applications').set('Cookie',cookie('3'))).status).toBe(403);
    expect((await request(app).get('/api/v1/applications')).status).toBe(401);
  });
  it('rechaza formatos inválidos, archivos vacíos y campos extra',async()=>{
    const post=()=>request(app).post('/api/v1/jobs/1/applications').set('Cookie',cookie('1')).set('X-Qori-Client','web');
    expect((await post().attach('cv',Buffer.from('malicioso'),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(400);
    expect((await post().attach('cv',pdf(''),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(400);
    expect((await post().field('user_id','2').attach('cv',pdf('Texto'),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(400);
    expect((await post().attach('cv',Buffer.alloc(5_000_001),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(413);
    expect(repo.rows).toHaveLength(0);
  });
  it('bloquea duplicados y permite reemplazar solo en estado inicial',async()=>{
    const post=()=>request(app).post('/api/v1/jobs/1/applications').set('Cookie',cookie('1')).set('X-Qori-Client','web').attach('cv',pdf('Texto'),{filename:'cv.pdf',contentType:'application/pdf'});
    expect((await post()).status).toBe(201); expect((await post()).status).toBe(409);
    const replace=()=>request(app).put('/api/v1/applications/1/cv').set('Cookie',cookie('1')).set('X-Qori-Client','web').attach('cv',pdf('Texto nuevo'),{filename:'nuevo.pdf',contentType:'application/pdf'});
    expect((await replace()).body.filename).toBe('nuevo.pdf'); repo.rows[0]!.status='IN_REVIEW'; expect((await replace()).status).toBe(409);
  });
  it('solo permite finalizar al reclutador propietario con entrada válida',async()=>{
    const path='/api/v1/recruiter/jobs/1/finish';
    expect((await request(app).post(path).set('Cookie',cookie('1')).set('X-Qori-Client','web').send({})).status).toBe(403);
    expect((await request(app).post(path).set('Cookie',cookie('3')).set('X-Qori-Client','web').send({owner:'otro'})).status).toBe(400);
    const result=await request(app).post(path).set('Cookie',cookie('3')).set('X-Qori-Client','web').send({});
    expect(result.status).toBe(200); expect(result.body.finished_at).toBe('2026-11-06T12:00:00.000Z');
    expect((await request(app).post('/api/v1/recruiter/jobs/2/finish').set('Cookie',cookie('3')).set('X-Qori-Client','web').send({})).status).toBe(404);
  });
  it('rechaza oferta no disponible y origen cruzado',async()=>{
    expect((await request(app).post('/api/v1/jobs/2/applications').set('Cookie',cookie('1')).set('X-Qori-Client','web').attach('cv',pdf('Texto'),{filename:'cv.pdf',contentType:'application/pdf'})).status).toBe(404);
    expect((await request(app).get('/api/v1/applications').set('Cookie',cookie('1')).set('Sec-Fetch-Site','cross-site')).status).toBe(403);
  });
});
