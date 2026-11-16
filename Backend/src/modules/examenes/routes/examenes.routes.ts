import { Router } from 'express';
import { AppError } from '../../../shared/errors.js';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import type { ExamenesRepository } from '../repositories/examenes.repository.js';
import { ExamenesService } from '../services/examenes.service.js';
import { ExamenesController } from '../controllers/examenes.controller.js';
export function createExamenesRoutes(repo: ExamenesRepository, auth: AuthService) {
  const routes = Router(), controller = new ExamenesController(new ExamenesService(repo));
  routes.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.get('Sec-Fetch-Site') === 'cross-site' || (req.method !== 'GET' && (req.get('X-Qori-Client') !== 'web' || !req.is('application/json')))) return next(new AppError(403, 'INVALID_ORIGIN', 'Solicitud no permitida.'));
    next();
  });
  const recruiter = requireRole(auth, 'RECRUITER'), candidate = requireRole(auth, 'CANDIDATE');
  routes.get('/recruiter/exams', recruiter, controller.list);
  routes.post('/recruiter/jobs/:jobId/exams', recruiter, controller.create);
  routes.get('/recruiter/exams/:examId', recruiter, controller.detail);
  routes.put('/recruiter/exams/:examId', recruiter, controller.update);
  routes.post('/recruiter/exams/:examId/publish', recruiter, controller.publish);
  routes.get('/candidate/exams', candidate, controller.available);
  routes.post('/candidate/exams/:examId/attempts', candidate, controller.start);
  routes.get('/candidate/attempts/:attemptId', candidate, controller.read);
  routes.put('/candidate/attempts/:attemptId/answers/:questionId', candidate, controller.answer);
  routes.post('/candidate/attempts/:attemptId/submit', candidate, controller.submit);
  return routes;
}
