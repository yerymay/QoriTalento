import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { SystemRepository } from '../src/modules/system/repositories/system.repository.js';

const repoOk: SystemRepository = { checkConnection: async () => undefined };
const repoDown: SystemRepository = {
  checkConnection: async () => { throw new Error('Contraseña simulada que no se debe exponer'); },
};

describe('Sistema: capas API → servicio → contrato → persistencia', () => {
  it('responde health sin conectar la base de datos', async () => {
    const res = await request(createApp(repoDown)).get('/api/v1/system/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'qori-talento-api' });
  });
  it('responde la verificación de conexión por contrato (solo desarrollo)', async () => {
    const res = await request(createApp(repoOk)).get('/api/v1/system/db-check');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: true });
  });
  it('no divulga detalles al fallar la base de datos', async () => {
    const res = await request(createApp(repoDown)).get('/api/v1/system/db-check');
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toContain('Contraseña simulada');
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
  it('retorna 404 con error estructurado', async () => {
    const res = await request(createApp(repoOk)).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error.request_id).toBeTruthy();
  });
});
