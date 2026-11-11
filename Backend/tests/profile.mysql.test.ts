import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { getMysqlPool } from '../src/shared/mysql.js';

describe.skipIf(process.env.TEST_MYSQL !== '1')('Perfil M01 con MySQL real', () => {
  const pool = getMysqlPool(), repo = new MySqlAuthRepository(pool);
  const app = createApp({checkConnection: async () => undefined}, repo);
  let id: string | undefined;
  afterAll(async () => {
    if (id) {
      await pool.execute('DELETE FROM auth_sessions WHERE user_id=?', [id]);
      await pool.execute('DELETE FROM users WHERE id=?', [id]);
    }
    await pool.end();
  });
  it('guarda y recupera el DNI del titular y rechaza datos inválidos', async () => {
    const email = `perfil-test-${randomUUID()}@example.test`, password = 'Clave prueba 123';
    const send = (path: string, body: unknown) => request(app).post(path).set('X-Qori-Client','web').send(body);
    const registered = await send('/api/v1/auth/candidates/register', {name:'Prueba Perfil', email, password});
    expect(registered.status).toBe(201);
    id = registered.body.user.id;
    const login = await send('/api/v1/auth/login', {email, password});
    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const profile = {name:'Prueba Perfil', email, phone:'+51 987 654 321', dni:'01234567'};
    const patch = (body: unknown) => request(app).patch('/api/v1/me').set('Cookie',cookie).set('X-Qori-Client','web').send(body);
    expect((await patch(profile)).status).toBe(200);
    expect((await repo.findByEmail(email))?.dni).toBe('01234567');
    expect((await patch({...profile,dni:'1234'})).status).toBe(400);
    expect((await patch({...profile,phone:'-------'})).status).toBe(400);
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
  });
});
