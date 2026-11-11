import { Router } from 'express';
import multer from 'multer';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import { AppError } from '../../../shared/errors.js';
import type { PostulacionesRepository } from '../repositories/postulaciones.repository.js';
import { PostulacionesService } from '../services/postulaciones.service.js';
import { PostulacionesController } from '../controllers/postulaciones.controller.js';
export function createPostulacionesRoutes(repo: PostulacionesRepository, auth: AuthService) {
  const routes = Router(), controller = new PostulacionesController(new PostulacionesService(repo));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000, files: 1, fields: 0, parts: 1 } }).single('cv');
  routes.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  routes.use((req, _res, next) => {
    if (req.get('Sec-Fetch-Site') === 'cross-site' || (req.method !== 'GET' && req.get('X-Qori-Client') !== 'web')) return next(new AppError(403, 'INVALID_ORIGIN', 'Solicitud no permitida.'));
    next();
  });
  routes.post('/recruiter/jobs/:jobId/finish', requireRole(auth, 'RECRUITER'), controller.finish);
  routes.post('/candidate/cv-preview', requireRole(auth, 'CANDIDATE'), upload, controller.preview);
  routes.get('/applications', requireRole(auth, 'CANDIDATE'), controller.list);
  routes.post('/jobs/:jobId/applications', requireRole(auth, 'CANDIDATE'), upload, controller.create);
  routes.put('/applications/:applicationId/cv', requireRole(auth, 'CANDIDATE'), upload, controller.replace);
  return routes;
}
