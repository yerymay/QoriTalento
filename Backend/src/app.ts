import { createPostulacionesRoutes } from './modules/postulaciones/routes/postulaciones.routes.js';
import type { PostulacionesRepository } from './modules/postulaciones/repositories/postulaciones.repository.js';
import { createOfertasRoutes } from './modules/ofertas/routes/ofertas.routes.js';
import type { OfertasRepository } from './modules/ofertas/repositories/ofertas.repository.js';
import { AuthService } from './modules/auth/services/auth.service.js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import { AppError } from './shared/errors.js';
import { createAuthRoutes } from './modules/auth/routes/auth.routes.js';
import type { AuthRepository } from './modules/auth/repositories/auth.repository.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env.js';
import { createSystemRoutes } from './modules/system/routes/system.routes.js';
import type { SystemRepository } from './modules/system/repositories/system.repository.js';

export function createApp(repository: SystemRepository, authRepository?: AuthRepository, ofertasRepository?: OfertasRepository, postulacionesRepository?: PostulacionesRepository) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader('X-Request-ID', res.locals.requestId);
    next();
  });

  app.use(express.json({ limit: '100kb' }));
  if (authRepository && postulacionesRepository) app.use('/api/v1', createPostulacionesRoutes(postulacionesRepository, new AuthService(authRepository, env.sessionIdleMinutes)));
  if (authRepository) app.use('/api/v1', createAuthRoutes(authRepository, { idleMinutes: env.sessionIdleMinutes, secure: env.nodeEnv === 'production' }));

  if (authRepository && ofertasRepository) app.use('/api/v1', createOfertasRoutes(ofertasRepository, new AuthService(authRepository, env.sessionIdleMinutes)));



  const { controller } = createSystemRoutes(repository);
  app.get('/health', controller.health);
  // Endpoint documentado también por OpenAPI. No implica DB disponible.
  app.get('/api/v1/system/health', controller.health);
  if (env.nodeEnv !== 'production') {
    app.get('/api/v1/system/db-check', controller.dbCheck);
  }

  const specification = YAML.parse(
    readFileSync(resolve(process.cwd(), 'openapi-implemented.yaml'), 'utf8'),
  );
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specification));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Ruta no encontrada', request_id: res.locals.requestId },
    });
  });
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    const malformed = error?.type === 'entity.parse.failed';
    const tooLarge = error?.type === 'entity.too.large' || error?.code === 'LIMIT_FILE_SIZE';
    const invalidUpload = typeof error?.code === 'string' && error.code.startsWith('LIMIT_') && !tooLarge;
    const status = error instanceof AppError ? error.status : malformed || invalidUpload ? 400 : tooLarge ? 413 : 503;
    res.status(status).json({ error: {
      code: error instanceof AppError ? error.code : malformed ? 'INVALID_JSON' : invalidUpload ? 'INVALID_UPLOAD' : tooLarge ? 'PAYLOAD_TOO_LARGE' : 'SERVICE_UNAVAILABLE',
      message: error instanceof AppError ? error.message : malformed ? 'El JSON no es válido.' : invalidUpload ? 'Selecciona un único archivo PDF.' : tooLarge ? 'El formulario es demasiado grande.' : 'No se pudo completar la operación. Intenta de nuevo.',
      request_id: res.locals.requestId,
    }});
  };
  app.use(handleError);
  return app;
}
