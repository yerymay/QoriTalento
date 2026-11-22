import { Router, type RequestHandler } from 'express';
import { AppError } from '../../../shared/errors.js';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import type { EvaluacionRepository, EvaluationAssistant } from '../repositories/evaluacion.repository.js';
import { EvaluacionService } from '../services/evaluacion.service.js';
import { EvaluacionController } from '../controllers/evaluacion.controller.js';
export function createEvaluacionRoutes(repo: EvaluacionRepository, auth: AuthService, assistant: EvaluationAssistant) {
  const routes = Router(), controller = new EvaluacionController(new EvaluacionService(repo, assistant));
  const guard: RequestHandler = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.get('Sec-Fetch-Site') === 'cross-site' || (req.method !== 'GET' &&
      (req.get('X-Qori-Client') !== 'web' || !req.is('application/json'))))
      return next(new AppError(403, 'INVALID_ORIGIN', 'Solicitud no permitida.'));
    next();
  };
  const base = '/recruiter/applications/:applicationId/evaluation';
  const recruiter = requireRole(auth, 'RECRUITER');
  // Middleware limitado a estas rutas: no interfiere en otros módulos.
  routes.get(base, guard, recruiter, controller.read);
  routes.post(base, guard, recruiter, controller.prepare);
  routes.post(base + '/assist', guard, recruiter, controller.assist);
  routes.put(base + '/review', guard, recruiter, controller.review);
  return routes;
}
