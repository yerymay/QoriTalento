import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/shared/errors.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import type { AuthRepository, User } from '../src/modules/auth/repositories/auth.repository.js';
import type { Job, JobChange, JobFilter, JobInput, JobScope, OfertasRepository } from '../src/modules/ofertas/repositories/ofertas.repository.js';

class MemoryOfertas implements OfertasRepository {
  jobs: Job[] = [];
  async list(scope: JobScope, filter: JobFilter) {
    const found = this.jobs.filter(job => (!scope.ownerId || job.owner_user_id === scope.ownerId)
      && (!scope.publishedOnly || job.status === 'PUBLISHED') && (!filter.status || job.status === filter.status)
      && (!filter.q || [job.title, job.description, job.location ?? '', job.id].some(value => value.toLowerCase().includes(filter.q.toLowerCase())))).reverse();
    return { items: structuredClone(found.slice((filter.page - 1) * filter.page_size, filter.page * filter.page_size).map(job => scope.ownerId ? {...job, applicant_count: job.applicant_count ?? 0} : job)), total: found.length, page: filter.page, page_size: filter.page_size };
  }
  async deleteOwned(id: string, ownerId: string) {
    const index = this.jobs.findIndex(job => job.id === id && job.owner_user_id === ownerId);
    if (index < 0) return false;
    if ((this.jobs[index].applicant_count ?? 0) > 0) throw new AppError(409, 'JOB_HAS_RECORDS', 'La oferta tiene registros asociados.');
    this.jobs.splice(index, 1);
    return true;
  }
  async find(id: string, scope: JobScope) {
    return structuredClone(this.jobs.find(job => job.id === id && (!scope.ownerId || job.owner_user_id === scope.ownerId) && (!scope.publishedOnly || job.status === 'PUBLISHED')) ?? null);
  }
  async create(ownerId: string, fields: JobInput) {
    const job: Job = { ...structuredClone(fields), id: String(this.jobs.length + 1), owner_user_id: ownerId, status: 'DRAFT', published_at: null, closed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.jobs.push(job);
    return structuredClone(job);
  }
  async changeOwned(id: string, ownerId: string, decide: (job: Job) => JobChange) {
    const job = this.jobs.find(item => item.id === id && item.owner_user_id === ownerId);
    if (!job) return null;
    const change = decide(structuredClone(job));
    Object.assign(job, change.fields, change.state);
    return structuredClone(job);
  }
}
const input = { title: 'Desarrollador/a Frontend', description: 'Construye interfaces accesibles.', area: 'Tecnología', location: 'Abancay · Híbrido', experience_required: 'Un año', education_required: 'Sistemas o afines', requirements: [{ description: 'TypeScript' }, { description: 'Accesibilidad web' }] };
const base = '/api/v1/recruiter/jobs';
const users: User[] = [];
let repo: MemoryOfertas, app: ReturnType<typeof createApp>;
const cookie = (index = 0) => `qt_session=${String(index + 1).repeat(64)}`;
const call = (method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: unknown, actor = 0) => {
  const req = request(app)[method](path).set('Cookie', cookie(actor)).set('X-Qori-Client', 'web');
  return method === 'get' ? req : req.send(body);
};
beforeEach(() => {
  users.splice(0, users.length, ...['COMPANY', 'COMPANY', null, 'INDIVIDUAL'].map((kind, index) => ({
    id: String(index + 1), name: 'Cuenta de prueba', email: `m02-${index}@example.test`, phone: null,
    role: kind ? 'RECRUITER' : 'CANDIDATE', kind, account_state: 'ACTIVE', email_verified: true, phone_verified: true, password_hash: '',
  } as User)));
  const unsupported = async (): Promise<never> => { throw new Error('No usado por esta prueba'); };
  const auth: AuthRepository = {
    findByEmail: unsupported, createUser: unsupported, createSession: unsupported,
    touchSession: unsupported, deleteSession: unsupported, updateProfile: unsupported,
    findSession: async hash => {
      const user = users.find((_, index) => tokenHash(String(index + 1).repeat(64)) === hash);
      return user ? { user, expires_at: new Date(Date.now() + 60000) } : null;
    },
  };
  repo = new MemoryOfertas();
  app = createApp({ checkConnection: async () => undefined }, auth, repo);
});
describe('M02: ofertas con sesión, propiedad y transiciones explícitas', () => {
  it('crea un borrador único y persiste datos y requisitos ordenados', async () => {
    const res = await call('post', base, input);
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(base + '/1');
    expect(res.body).toMatchObject({ ...input, id: '1', owner_user_id: '1', status: 'DRAFT', published_at: null });
    expect((await call('post', base, { title: 'Otro borrador' })).body.id).toBe('2');
    expect((await call('get', base + '/1')).body).toEqual(res.body);
  });
  it('edita campos y sustituye requisitos sin modificar los campos omitidos', async () => {
    await call('post', base, input);
    const updated = await call('patch', base + '/1', { title: 'Nuevo cargo', requirements: [{ description: 'SQL' }], location: null });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Nuevo cargo', description: input.description, requirements: [{ description: 'SQL' }], location: null, status: 'DRAFT' });
  });
  it('publica, lista para postulantes, consulta detalle y cierra con fechas del servidor', async () => {
    await call('post', base, input);
    expect((await call('get', '/api/v1/jobs', undefined, 2)).body.total).toBe(0);
    const published = await call('post', base + '/1/publish', {});
    expect(published.status).toBe(200);
    expect(published.body.status).toBe('PUBLISHED');
    expect(published.body.published_at).toBeTruthy();
    const list = await call('get', '/api/v1/jobs', undefined, 2);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].owner_user_id).toBeUndefined();
    const detail = await call('get', '/api/v1/jobs/1', undefined, 2);
    expect(detail.body.requirements).toEqual(input.requirements);
    expect(detail.body.owner_user_id).toBeUndefined();
    expect((await call('post', base + '/1/publish', {})).body.published_at).toBe(published.body.published_at);
    const closed = await call('post', base + '/1/close', {});
    expect(closed.body.status).toBe('CLOSED');
    expect(closed.body.closed_at).toBeTruthy();
    expect((await call('post', base + '/1/close', {})).body.closed_at).toBe(closed.body.closed_at);
    expect((await call('get', '/api/v1/jobs', undefined, 2)).body.total).toBe(0);
    expect((await call('get', '/api/v1/jobs/1', undefined, 2)).status).toBe(404);
    expect((await call('patch', base + '/1', { title: 'Cargo archivado' })).status).toBe(200);
  });
  it.each(['get', 'patch', 'publish', 'close'])('impide acceso ajeno: %s', async action => {
    await call('post', base, input);
    const res = action === 'get' ? await call('get', base + '/1', undefined, 1)
      : action === 'patch' ? await call('patch', base + '/1', { title: 'Intrusión' }, 1)
      : await call('post', base + '/1/' + action, {}, 1);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('JOB_NOT_FOUND');
    expect(repo.jobs[0].title).toBe(input.title);
    expect((await call('get', base, undefined, 1)).body.items).toEqual([]);
  });
  it('permite que un reclutador particular publique una oferta completa', async () => {
    const created = await call('post', base, input, 3);
    expect(created.status).toBe(201);
    expect((await call('patch', base + '/1', { title: 'Borrador particular' }, 3)).status).toBe(200);
    const res = await call('post', base + '/1/publish', {}, 3);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PUBLISHED');
    expect(res.body.published_at).toBeTruthy();
  });
  it('admite borradores parciales, valida publicación y no vacía una oferta publicada', async () => {
    await call('post', base, { title: 'Borrador' });
    expect((await call('post', base + '/1/publish', {})).body.error.code).toBe('JOB_INCOMPLETE');
    await call('patch', base + '/1', input);
    await call('post', base + '/1/publish', {});
    expect((await call('patch', base + '/1', { requirements: [] })).status).toBe(409);
    expect((await call('patch', base + '/1', { description: '' })).status).toBe(409);
    expect(repo.jobs[0].requirements).toEqual(input.requirements);
  });
  it('rechaza cierres de borradores, reapertura y estados desconocidos', async () => {
    await call('post', base, input);
    expect((await call('post', base + '/1/close', {})).status).toBe(409);
    await call('post', base + '/1/publish', {});
    await call('post', base + '/1/close', {});
    expect((await call('post', base + '/1/publish', {})).status).toBe(409);
    repo.jobs[0].status = 'PENDING_MODERATION';
    expect((await call('patch', base + '/1', { title: 'Otro cargo' })).status).toBe(409);
  });
  it.each([
    {}, { title: ' ' }, { ...input, title: 'x'.repeat(181) }, { ...input, description: 22 },
    { ...input, owner_user_id: '2' }, { ...input, user_id: '2' }, { ...input, status: 'PUBLISHED' },
    { ...input, requirements: [{ description: 'SQL', importance: 'HIGH' }] },
    { ...input, requirements: [{ description: '' }] }, { ...input, requirements: null }, { ...input, description: null }, { ...input, requirements: new Array(51).fill({ description: 'SQL' }) },
  ])('rechaza formularios inválidos o asignación de privilegios: %j', async body => {
    expect((await call('post', base, body)).status).toBe(400);
    expect(repo.jobs).toHaveLength(0);
  });
  it('valida ids, filtros, cuerpo vacío de acciones y PATCH vacío', async () => {
    await call('post', base, input);
    for (const id of ['0', '-1', '1e1', '18446744073709551616', 'sql']) expect((await call('get', base + '/' + id)).status).toBe(400);
    for (const query of ['page=0', 'page_size=999', 'owner_user_id=2', 'status=OTHER', 'q=a&q=b']) expect((await call('get', base + '?' + query)).status).toBe(400);
    expect((await call('patch', base + '/1', {})).status).toBe(400);
    expect((await call('post', base + '/1/publish', { status: 'CLOSED' })).status).toBe(400);
    expect((await call('get', '/api/v1/jobs?status=DRAFT', undefined, 2)).status).toBe(400);
  });
  it('devuelve el conteo solo en las ofertas propias', async () => {
    await call('post', base, input);
    repo.jobs[0].applicant_count = 3;
    expect((await call('get', base)).body.items[0].applicant_count).toBe(3);
    await call('post', base + '/1/publish', {});
    expect((await call('get', '/api/v1/jobs', undefined, 2)).body.items[0].applicant_count).toBeUndefined();
  });
  it('elimina únicamente la oferta propia sin registros asociados y protege el origen', async () => {
    await call('post', base, input);
    expect((await call('delete', base + '/1', {}, 1)).status).toBe(404);
    expect((await call('delete', base + '/1', {}, 2)).status).toBe(403);
    expect((await request(app).delete(base + '/1').set('Cookie', cookie()).send({})).status).toBe(403);
    expect((await call('delete', base + '/1', {owner_user_id:'2'})).status).toBe(400);
    repo.jobs[0].applicant_count = 1;
    expect((await call('delete', base + '/1', {})).status).toBe(409);
    expect(repo.jobs).toHaveLength(1);
    repo.jobs[0].applicant_count = 0;
    expect((await call('delete', base + '/1', {})).status).toBe(204);
    expect((await call('get', base + '/1')).status).toBe(404);
  });
  it('pagina, busca y filtra solo las ofertas propias', async () => {
    await call('post', base, input);
    await call('post', base, { ...input, title: 'Analista SQL' });
    await call('post', base, input, 1);
    const page = await call('get', base + '?page_size=1&page=2');
    expect(page.body.total).toBe(2);
    expect(page.body.items).toHaveLength(1);
    expect((await call('get', base + '?q=Analista')).body.items[0].title).toBe('Analista SQL');
    expect((await call('get', base + '?status=PUBLISHED')).body.total).toBe(0);
  });
  it('exige sesión y rol para cada endpoint', async () => {
    const routes = [['get', base], ['get', base + '/1'], ['post', base], ['patch', base + '/1'], ['post', base + '/1/publish'], ['post', base + '/1/close'], ['get', '/api/v1/jobs'], ['get', '/api/v1/jobs/1']] as const;
    for (const [method, path] of routes) {
      const anonymous = request(app)[method](path).set('X-Qori-Client', 'web');
      const res = await (method === 'get' ? anonymous : anonymous.send({}));
      expect(res.status).toBe(401);
      expect((await call(method, path, method === 'get' ? undefined : {}, path.includes('/recruiter/') ? 2 : 0)).status).toBe(403);
    }
    users[0].account_state = 'DISABLED';
    expect((await call('get', base)).status).toBe(403);
  });
  it('rechaza CSRF y oculta fallos de persistencia con request_id', async () => {
    expect((await request(app).post(base).set('Cookie', cookie()).send(input)).status).toBe(403);
    expect((await request(app).post(base).set('Cookie', cookie()).set('X-Qori-Client', 'web').set('Sec-Fetch-Site', 'cross-site').send(input)).status).toBe(403);
    repo.list = async () => { throw new Error('mysql SECRET_PASSWORD'); };
    const res = await call('get', base);
    expect(res.status).toBe(503);
    expect(res.body.error.request_id).toBe(res.headers['x-request-id']);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(JSON.stringify(res.body)).not.toContain('SECRET_PASSWORD');
  });
});
