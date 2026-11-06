import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlOfertasRepository } from '../src/modules/ofertas/persistence/mysql-ofertas.repository.js';
import { newToken, tokenHash } from '../src/modules/auth/services/password.js';
import { createApp } from '../src/app.js';

describe.skipIf(process.env.TEST_MYSQL !== '1')('M02 con MySQL real', () => {
  const pool = getMysqlPool(), auth = new MySqlAuthRepository(pool), repo = new MySqlOfertasRepository(pool);
  const app = createApp({ checkConnection: async () => undefined }, auth, repo);
  const users: string[] = [], jobs: string[] = [], cookies: string[] = [];
  afterAll(async () => {
    for (const id of jobs) { await pool.execute('DELETE FROM job_requirements WHERE job_id=?', [id]); await pool.execute('DELETE FROM jobs WHERE id=?', [id]); }
    for (const id of users) {
      await pool.execute('DELETE FROM auth_sessions WHERE user_id=?', [id]);
      await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?', [id]);
      await pool.execute('DELETE FROM users WHERE id=?', [id]);
    }
    await pool.end();
  });
  it('persiste ofertas, verifica aislamiento, atomicidad, búsqueda, publicación y cierre', async () => {
    for (const kind of ['COMPANY', 'COMPANY', null, 'INDIVIDUAL'] as const) {
      const user = await auth.createUser({ name: 'Prueba sintética M02', email: 'm02-test-' + randomUUID() + '@example.test', phone: null, password_hash: 'fixture-no-login', role: kind ? 'RECRUITER' : 'CANDIDATE', kind });
      users.push(user.id);
      // Solo se activan fixtures creados por esta prueba; no es una ruta de activación.
      await pool.execute("UPDATE users SET account_state='ACTIVE',email_verified_at=UTC_TIMESTAMP(3) WHERE id=?", [user.id]);
      if (kind === 'INDIVIDUAL') await pool.execute('UPDATE recruiter_profiles SET phone_verified_at=UTC_TIMESTAMP(3) WHERE user_id=?', [user.id]);
      const token = newToken(); await auth.createSession(tokenHash(token), user.id, new Date(Date.now() + 600000)); cookies.push('qt_session=' + token);
    }
    const call = (method: 'get' | 'post' | 'patch', path: string, body?: unknown, actor = 0) => {
      const req = request(app)[method]('/api/v1/' + path).set('Cookie', cookies[actor]).set('X-Qori-Client', 'web');
      return method === 'get' ? req : req.send(body);
    };
    const body = { title: 'Oferta sintética ' + randomUUID(), description: 'Diseña interfaces accesibles.', area: 'Tecnología', location: 'Abancay · Híbrido', experience_required: 'Sin experiencia', education_required: 'Sistemas', requirements: [{ description: 'TypeScript' }, { description: 'Accesibilidad' }] };
    const created = await call('post', 'recruiter/jobs', body);
    if (created.status === 201) jobs.push(created.body.id);
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect((await call('get', 'recruiter/jobs/' + id)).body).toMatchObject(body);
    expect((await call('get', 'recruiter/jobs/' + id, undefined, 1)).status).toBe(404);
    expect((await call('patch', 'recruiter/jobs/' + id, { title: 'Intrusión' }, 1)).status).toBe(404);
    expect((await call('get', 'jobs/' + id, undefined, 2)).status).toBe(404);
    expect((await call('get', 'recruiter/jobs?q=' + encodeURIComponent(body.title) + '&page_size=1')).body.total).toBe(1);
    expect((await call('get', 'recruiter/jobs?q=' + encodeURIComponent("' OR 1=1 --"))).body.total).toBe(0);
    // Un fallo SQL después de actualizar la oferta y borrar los requisitos debe revertir todo.
    await expect(repo.changeOwned(id, users[0], current => ({ fields: { ...current, title: 'No debe persistir', requirements: [{ description: null as unknown as string }] } }))).rejects.toThrow();
    expect(await repo.find(id, { ownerId: users[0] })).toMatchObject(body);
    // Ambos editores leen bajo bloqueo; ninguna actualización pierde la de la otra transacción.
    await Promise.all([' A', ' B'].map(suffix => repo.changeOwned(id, users[0], current => ({ fields: { ...current, title: current.title + suffix } }))));
    const concurrent = await repo.find(id, { ownerId: users[0] });
    expect(concurrent!.title).toContain(' A'); expect(concurrent!.title).toContain(' B');
    expect((await call('post', 'recruiter/jobs/' + id + '/publish', {})).body.status).toBe('PUBLISHED');
    const published = await call('get', 'jobs/' + id, undefined, 2);
    expect(published.status).toBe(200); expect(published.body.owner_user_id).toBeUndefined();
    expect(published.body.requirements).toEqual(body.requirements);
    expect((await call('get', 'jobs?q=' + encodeURIComponent(body.title), undefined, 2)).body.total).toBe(1);
    expect((await call('post', 'recruiter/jobs/' + id + '/close', {})).body.status).toBe('CLOSED');
    expect((await call('get', 'jobs/' + id, undefined, 2)).status).toBe(404);
    expect((await call('get', 'jobs?q=' + encodeURIComponent(body.title), undefined, 2)).body.total).toBe(0);
    const individual = await call('post', 'recruiter/jobs', body, 3);
    if (individual.status === 201) jobs.push(individual.body.id);
    expect(individual.status).toBe(201);
    expect((await call('post', 'recruiter/jobs/' + individual.body.id + '/publish', {}, 3)).body.status).toBe('PUBLISHED');
  });
});
