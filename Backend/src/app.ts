import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env.js';
import { createSystemRoutes } from './modules/system/routes/system.routes.js';
import type { SystemRepository } from './modules/system/repositories/system.repository.js';

export function createApp(repository: SystemRepository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader('X-Request-ID', res.locals.requestId);
    next();
  });

  const { routes, controller } = createSystemRoutes(repository);
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
  return app;
}
