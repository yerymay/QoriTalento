import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { createApp } from '../src/app.js';
import type { RowDataPacket } from 'mysql2/promise';
// Solo cuentas sintéticas propias de esta ejecución; nunca activa usuarios existentes.
const enabled=process.env.TEST_MYSQL==='1';
describe.skipIf(!enabled)('M01 con MySQL real',()=>{
  const pool=getMysqlPool(),repo=new MySqlAuthRepository(pool),app=createApp({checkConnection:async()=>undefined},repo);
  const ids:string[]=[];
  afterAll(async()=>{
    for(const id of ids){await pool.execute('DELETE FROM auth_sessions WHERE user_id=?',[id]);await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);}
    await pool.end();
  });
  it('persiste los dos roles y verifica sesión, perfil, duplicados y revocación',async()=>{
    for(const role of ['candidates','recruiters']){
      const email=`m01-test-${randomUUID()}@example.test`,password='Prueba sintética M01 123';
      const post=(path:string,body:unknown)=>request(app).post(`/api/v1/${path}`).set('X-Qori-Client','web').send(body);
      const payload={name:'Prueba M01',email,password,...(role==='recruiters'?{kind:'COMPANY'}:{})};
      const registered=await post(`auth/${role}/register`,payload);expect(registered.status).toBe(201);ids.push(registered.body.user.id);
      expect((await post('auth/login',{email,password})).status).toBe(403);
      expect((await post(`auth/${role}/register`,payload)).status).toBe(409);
      // Preparación de fixture, no es un flujo de activación de la aplicación.
      await pool.execute("UPDATE users SET account_state='ACTIVE',email_verified_at=UTC_TIMESTAMP(3) WHERE id=?",[ids.at(-1)]);
      const login=await post('auth/login',{email,password});expect(login.status).toBe(200);
      const cookie=login.headers['set-cookie'][0].split(';')[0];
      const [rows]=await pool.execute<RowDataPacket[]>('SELECT token_hash FROM auth_sessions WHERE user_id=?',[ids.at(-1)]);
      expect(rows[0].token_hash).not.toBe(cookie.split('=')[1]);
      const profile={name:'Perfil actualizado',email,phone:'+51 999 000 111'};
      const updated=await request(app).patch('/api/v1/me').set('Cookie',cookie).set('X-Qori-Client','web').send(profile);
      expect(updated.status).toBe(200);expect(updated.body.user.name).toBe(profile.name);
      const stored=await repo.findByEmail(email);expect(stored?.name).toBe(profile.name);
      expect((await request(app).get('/api/v1/me').set('Cookie',cookie)).status).toBe(200);
      const changed=await request(app).patch('/api/v1/me').set('Cookie',cookie).set('X-Qori-Client','web').send({...profile,email:`changed-${email}`});
      expect(changed.status).toBe(200);expect(changed.body.verification_required).toBe(true);
      expect((await request(app).get('/api/v1/me').set('Cookie',cookie)).status).toBe(401);
      expect((await repo.findByEmail(`changed-${email}`))?.email_verified).toBe(false);
    }
  });
});
