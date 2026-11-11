import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/shared/errors.js';
import { AuthService } from '../src/modules/auth/services/auth.service.js';
import { hashPassword, tokenHash } from '../src/modules/auth/services/password.js';
import { requireRole } from '../src/modules/auth/routes/auth.routes.js';
import type { AuthRepository, NewUser, Profile, User } from '../src/modules/auth/repositories/auth.repository.js';
import express from 'express';
export class MemoryAuth implements AuthRepository {
  users: User[] = [];
  sessions = new Map<string,{id:string;expires:Date}>();
  async findByEmail(email: string) { return this.users.find(u=>u.email===email) ?? null; }
  async createUser(input: NewUser) {
    if (await this.findByEmail(input.email)) throw new AppError(409,'EMAIL_IN_USE','Ese correo ya está registrado.');
    const user: User = {...input,dni:null,id:String(this.users.length+1),account_state:'ACTIVE',email_verified:false,phone_verified:false};
    this.users.push(user); return user;
  }
  async createSession(hash: string,id: string,expires: Date) { this.sessions.set(hash,{id,expires}); }
  async findSession(hash: string, now: Date) {
    const session=this.sessions.get(hash), user=this.users.find(u=>u.id===session?.id);
    return session && user && session.expires>now ? {user,expires_at:session.expires} : null;
  }
  async touchSession(hash: string,now: Date,expires: Date) { const s=this.sessions.get(hash); if(!s || s.expires<=now) return false; s.expires=expires; return true; }
  async deleteSession(hash: string) { this.sessions.delete(hash); }
  async updateProfile(id: string,profile: Profile) {
    const user=this.users.find(u=>u.id===id)!;
    if(this.users.some(u=>u.id!==id && u.email===profile.email)) throw new AppError(409,'EMAIL_IN_USE','Correo registrado.');
    if(user.email!==profile.email || (user.kind==='INDIVIDUAL' && user.phone!==profile.phone)) {
      user.account_state='ACTIVE';user.email_verified=false;
      for(const [hash,s] of this.sessions) if(s.id===id) this.sessions.delete(hash);
    }
    Object.assign(user,profile);return user;
  }
}
let passwordHash: string;
beforeAll(async()=>{passwordHash=await hashPassword('Clave de prueba 123');});
function setup() {
  const repo=new MemoryAuth();
  repo.users.push({id:'1',name:'Ana Prueba',email:'ana@example.test',phone:null,dni:null,role:'CANDIDATE',kind:null,password_hash:passwordHash,account_state:'ACTIVE',email_verified:true,phone_verified:false});
  return {repo,app:createApp({checkConnection:async()=>undefined},repo)};
}
const credentials={email:'ana@example.test',password:'Clave de prueba 123'};
const candidate={name:'Nuevo Usuario',email:'nuevo@example.test',password:'Clave de prueba 123'};
const client=(app: ReturnType<typeof createApp>)=>({
  post:(path:string,body:unknown)=>request(app).post(path).set('X-Qori-Client','web').set('Content-Type','application/json').send(body),
});
const cookie=(response:request.Response)=>response.headers['set-cookie'][0].split(';')[0];
describe('M01: API, autenticación y permisos',()=>{
  afterEach(()=>vi.unstubAllEnvs());
  it('registra postulante activo, normaliza correo y nunca devuelve el hash',async()=>{
    const {app,repo}=setup();const res=await client(app).post('/api/v1/auth/candidates/register',{...candidate,email:' NUEVO@EXAMPLE.TEST '});
    expect(res.status).toBe(201);expect(res.body.user.email).toBe('nuevo@example.test');expect(res.body.user.account_state).toBe('ACTIVE');
    expect(res.body.user.password_hash).toBeUndefined();expect(repo.users[1].password_hash).toMatch(/^scrypt\$/);expect(repo.users[1].password_hash).not.toContain(candidate.password);
    expect((await client(app).post('/api/v1/auth/login',{email:candidate.email,password:candidate.password})).status).toBe(200);
  });
  it('permite entrar con cuentas recién registradas en cualquier entorno',async()=>{
    const {app}=setup();
    const postulante=await client(app).post('/api/v1/auth/candidates/register',candidate);
    expect(postulante.status).toBe(201);expect(postulante.body.message).toContain('Ya puedes iniciar sesión');
    expect((await client(app).post('/api/v1/auth/login',{email:candidate.email,password:candidate.password})).status).toBe(200);
    const reclutador={...candidate,email:'reclutador@example.test',kind:'INDIVIDUAL',phone:'+51 999 888 777'};
    expect((await client(app).post('/api/v1/auth/recruiters/register',reclutador)).status).toBe(201);
    expect((await client(app).post('/api/v1/auth/login',{email:reclutador.email,password:reclutador.password})).status).toBe(200);
  });
  it('sigue bloqueando cuentas desactivadas',async()=>{
    const {app,repo}=setup();repo.users[0].account_state='DISABLED';
    expect((await client(app).post('/api/v1/auth/login',credentials)).status).toBe(403);
  });
  it('rechaza correo duplicado y payloads inválidos sin elevar privilegios',async()=>{
    const {app}=setup();
    expect((await client(app).post('/api/v1/auth/candidates/register',{...candidate,email:credentials.email})).status).toBe(409);
    for(const body of [{...candidate,role:'RECRUITER'},{...candidate,user_id:'1'},{...candidate,password:'123'},{...candidate,email:'sin-arroba'},null]) expect((await client(app).post('/api/v1/auth/candidates/register',body)).status).toBe(400);
  });
  it('valida clase de reclutador, correo corporativo y teléfono particular',async()=>{
    const {app,repo}=setup();
    for(const body of [{...candidate,kind:'ADMIN'},{...candidate,kind:'COMPANY',email:'empresa@gmail.com'},{...candidate,kind:'INDIVIDUAL'}]) expect((await client(app).post('/api/v1/auth/recruiters/register',body)).status).toBe(400);
    expect((await client(app).post('/api/v1/auth/recruiters/register',{...candidate,kind:'COMPANY'})).status).toBe(201);
    expect(repo.users[1].role).toBe('RECRUITER');expect(repo.users[1].kind).toBe('COMPANY');
  });
  it('rechaza credenciales erróneas y cuentas desactivadas',async()=>{
    const {app,repo}=setup();
    expect((await client(app).post('/api/v1/auth/login',{...credentials,password:'incorrecta'})).status).toBe(401);
    expect((await client(app).post('/api/v1/auth/login',{...credentials,email:'nadie@example.test'})).body.error.code).toBe('INVALID_CREDENTIALS');
    repo.users[0].account_state='DISABLED';expect((await client(app).post('/api/v1/auth/login',credentials)).status).toBe(403);
  });
  it('inicia, consulta, renueva y cierra sesión revocándola en servidor',async()=>{
    const {app,repo}=setup();const login=await client(app).post('/api/v1/auth/login',credentials);
    expect(login.status).toBe(200);expect(login.headers['set-cookie'][0]).toContain('HttpOnly');expect(login.headers['set-cookie'][0]).toContain('SameSite=Strict');
    expect(login.body.token).toBeUndefined();const value=cookie(login);
    expect([...repo.sessions.keys()][0]).toBe(tokenHash(value.split('=')[1]));
    const me=await request(app).get('/api/v1/me').set('Cookie',value);expect(me.body.user.id).toBe('1');expect(me.headers['cache-control']).toBe('no-store');
    expect((await request(app).post('/api/v1/auth/session/refresh').set('Cookie',value).set('X-Qori-Client','web').send({})).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/logout').set('Cookie',value).set('X-Qori-Client','web').send({})).status).toBe(204);
    expect((await request(app).get('/api/v1/me').set('Cookie',value)).status).toBe(401);
  });
  it('bloquea sesiones expiradas, falsificadas y cuentas desactivadas después del acceso',async()=>{
    const {app,repo}=setup();const login=await client(app).post('/api/v1/auth/login',credentials);const value=cookie(login);
    repo.users[0].account_state='DISABLED';expect((await request(app).get('/api/v1/me').set('Cookie',value)).status).toBe(403);
    repo.users[0].account_state='ACTIVE';for(const s of repo.sessions.values())s.expires=new Date(0);
    expect((await request(app).get('/api/v1/me').set('Cookie',value)).status).toBe(401);
    expect((await request(app).get('/api/v1/me').set('Cookie','qt_session=falso')).status).toBe(401);
  });
  it('solo edita el perfil propio y revoca sesiones al cambiar correo',async()=>{
    const {app,repo}=setup();const login=await client(app).post('/api/v1/auth/login',credentials);const value=cookie(login);
    const patch=(body:unknown)=>request(app).patch('/api/v1/me').set('Cookie',value).set('X-Qori-Client','web').send(body);
    const profile={name:'Ana Actualizada',email:credentials.email,phone:'+51 999 888 777'};
    expect((await patch({...profile,user_id:'2'})).status).toBe(400);
    expect((await patch({...profile,role:'RECRUITER'})).status).toBe(400);
    expect((await patch(profile)).body.user.name).toBe(profile.name);expect(repo.users[0].role).toBe('CANDIDATE');
    expect((await patch({...profile,email:'otro@example.test'})).body.verification_required).toBe(true);
    expect((await request(app).get('/api/v1/me').set('Cookie',value)).status).toBe(401);
  });
  it('exige sesión en consulta y actualización de perfil',async()=>{
    const {app}=setup();expect((await request(app).get('/api/v1/me')).status).toBe(401);
    expect((await request(app).patch('/api/v1/me').set('X-Qori-Client','web').send({})).status).toBe(401);
  });
  it('impide CSRF y devuelve request_id incluso para JSON inválido',async()=>{
    const {app}=setup();expect((await request(app).post('/api/v1/auth/login').send(credentials)).status).toBe(403);
    expect((await request(app).post('/api/v1/auth/login').set('X-Qori-Client','web').set('Sec-Fetch-Site','cross-site').send(credentials)).status).toBe(403);
    const invalid=await request(app).post('/api/v1/auth/login').set('Content-Type','application/json').send('{');
    expect(invalid.status).toBe(400);expect(invalid.body.error.request_id).toBe(invalid.headers['x-request-id']);
  });
  it('no filtra errores SQL ni credenciales',async()=>{
    const {app,repo}=setup();repo.findByEmail=async()=>{throw new Error('mysql password SUPER_SECRET');};
    const res=await client(app).post('/api/v1/auth/login',credentials);expect(res.status).toBe(503);expect(JSON.stringify(res.body)).not.toContain('SUPER_SECRET');
  });
  it('valida y guarda DNI y teléfono del perfil sin permitir acceder a otra cuenta',async()=>{
    const {app,repo}=setup();const login=await client(app).post('/api/v1/auth/login',credentials);const value=cookie(login);
    const patch=(body:unknown,session=value)=>request(app).patch('/api/v1/me').set('Cookie',session).set('X-Qori-Client','web').send(body);
    const profile={name:'Ana Prueba',email:credentials.email,phone:'+51 987 654 321',dni:'01234567'};
    expect((await patch(profile,'qt_session=incorrecta')).status).toBe(401);
    const saved=await patch(profile);expect(saved.status).toBe(200);expect(saved.body.user.dni).toBe('01234567');expect(repo.users[0].dni).toBe('01234567');
    expect((await request(app).get('/api/v1/me').set('Cookie',value)).body.user.dni).toBe('01234567');
    for(const invalid of ['1234567','123456789','1234567a'])expect((await patch({...profile,dni:invalid})).status).toBe(400);
    for(const invalid of ['-------','123456','1234567890123456','+51 999 abc 777'])expect((await patch({...profile,phone:invalid})).status).toBe(400);
    expect((await patch({name:profile.name,email:profile.email,phone:profile.phone})).body.user.dni).toBe('01234567');
    expect((await patch({...profile,dni:''})).body.user.dni).toBeNull();
  });
  it('limita intentos repetidos de acceso',async()=>{
    const {app}=setup();for(let i=0;i<20;i++)await client(app).post('/api/v1/auth/login',{});
    expect((await client(app).post('/api/v1/auth/login',{})).status).toBe(429);
  });
  it('el middleware de rol protege rutas en el servidor',async()=>{
    const {repo}=setup();const service=new AuthService(repo,30);const login=await service.login(credentials);
    const app=express();app.get('/privada',requireRole(service,'RECRUITER'),(_req,res)=>res.json({ok:true}));
    app.use((err:AppError,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{res.status(err.status).json({code:err.code});});
    expect((await request(app).get('/privada').set('Cookie',`qt_session=${login.token}`)).status).toBe(403);
    Object.assign(repo.users[0],{role:'RECRUITER',kind:'COMPANY'});
    expect((await request(app).get('/privada').set('Cookie',`qt_session=${login.token}`)).status).toBe(200);
  });
});
