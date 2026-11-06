import { Router } from 'express';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import { AppError } from '../../../shared/errors.js';
import type { CvRepository } from '../repositories/cv.repository.js';
import { CvService } from '../services/cv.service.js';
import { CvController } from '../controllers/cv.controller.js';
export function createCvRoutes(repo: CvRepository, auth: AuthService) {
  const routes = Router(), controller = new CvController(new CvService(repo));
  routes.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.get('Sec-Fetch-Site') === 'cross-site' || (req.method !== 'GET' && (req.get('X-Qori-Client') !== 'web' || !req.is('application/json')))) return next(new AppError(403, 'INVALID_ORIGIN', 'Solicitud no permitida.'));
    next();
  });
  routes.get('/candidate/profile', requireRole(auth, 'CANDIDATE'), controller.profile);
  for (const [prefix, role] of [['candidate','CANDIDATE'], ['recruiter','RECRUITER']] as const) {
    routes.get(`/${prefix}/applications/:applicationId/cv-extraction`, requireRole(auth, role), controller.review);
    routes.get(`/${prefix}/applications/:applicationId/cv/:documentId`, requireRole(auth, role), controller.document);
  }
  routes.put('/candidate/applications/:applicationId/profile-confirmation', requireRole(auth, 'CANDIDATE'), controller.confirm);
  routes.get('/recruiter/jobs/:jobId/applications', requireRole(auth, 'RECRUITER'), controller.applications);
  routes.get('/recruiter/applications/:applicationId/notes', requireRole(auth, 'RECRUITER'), controller.notes);
  routes.post('/recruiter/applications/:applicationId/notes', requireRole(auth, 'RECRUITER'), controller.addNote);
  return routes;
}
