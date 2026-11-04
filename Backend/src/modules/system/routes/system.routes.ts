import { Router } from 'express';
import type { SystemRepository } from '../repositories/system.repository.js';
import { SystemService } from '../services/system.service.js';
import { SystemController } from '../controllers/system.controller.js';

export function createSystemRoutes(repository: SystemRepository) {
  const routes = Router();
  const service = new SystemService(repository);
  const controller = new SystemController(service);
  routes.get('/health', controller.health);
  // Route only mounted in development from app.ts
  routes.get('/db-check', controller.dbCheck);
  return { routes, controller };
}
