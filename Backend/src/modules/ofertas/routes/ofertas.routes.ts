import { Router } from 'express';
import type { AuthService } from '../../auth/services/auth.service.js';
import { requireRole } from '../../auth/routes/auth.routes.js';
import { OfertasController } from '../controllers/ofertas.controller.js';
import { OfertasService } from '../services/ofertas.service.js';
import type { OfertasRepository } from '../repositories/ofertas.repository.js';
import { AppError } from '../../../shared/errors.js';

export function createOfertasRoutes(repo: OfertasRepository, auth: AuthService) {
  const routes = Router();
  const controller = new OfertasController(new OfertasService(repo));
  routes.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.get('Sec-Fetch-Site') === 'cross-site' || (['POST', 'PATCH'].includes(req.method) && (req.get('X-Qori-Client') !== 'web' || !req.is('application/json')))) {
      return next(new AppError(403, 'INVALID_ORIGIN', 'Solicitud no permitida. Vuelve a abrir el formulario.'));
    }
    next();
  });
  routes.get('/jobs', requireRole(auth, 'CANDIDATE'), controller.available);
  routes.get('/jobs/:jobId', requireRole(auth, 'CANDIDATE'), controller.publicDetail);
  routes.get('/recruiter/jobs', requireRole(auth, 'RECRUITER'), controller.owned);
  routes.post('/recruiter/jobs', requireRole(auth, 'RECRUITER'), controller.create);
  routes.get('/recruiter/jobs/:jobId', requireRole(auth, 'RECRUITER'), controller.ownedDetail);
  routes.patch('/recruiter/jobs/:jobId', requireRole(auth, 'RECRUITER'), controller.update);
  routes.post('/recruiter/jobs/:jobId/publish', requireRole(auth, 'RECRUITER'), controller.publish);
  routes.post('/recruiter/jobs/:jobId/close', requireRole(auth, 'RECRUITER'), controller.close);
  return routes;
}
