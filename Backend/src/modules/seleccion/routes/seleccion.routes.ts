import { Router,type RequestHandler } from 'express';
import { AppError } from '../../../shared/errors.js';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import type { EvaluacionRepository } from '../../evaluacion/repositories/evaluacion.repository.js';
import type { SeleccionRepository } from '../repositories/seleccion.repository.js';
import { SeleccionService } from '../services/seleccion.service.js';
import { SeleccionController } from '../controllers/seleccion.controller.js';
export function createSeleccionRoutes(repo:SeleccionRepository,auth:AuthService,evaluations:EvaluacionRepository){
  const routes=Router(),controller=new SeleccionController(new SeleccionService(repo,evaluations));
  const guard:RequestHandler=(req,res,next)=>{
    res.setHeader('Cache-Control','no-store');
    if(req.get('Sec-Fetch-Site')==='cross-site'||(req.method!=='GET'&&(req.get('X-Qori-Client')!=='web'||!req.is('application/json'))))
      return next(new AppError(403,'INVALID_ORIGIN','Solicitud no permitida.'));
    next();
  };
  const role=requireRole(auth,'RECRUITER');
  routes.get('/recruiter/selection/jobs',guard,role,controller.jobs);
  routes.get('/recruiter/jobs/:jobId/results',guard,role,controller.list);
  routes.get('/recruiter/applications/:applicationId/selection',guard,role,controller.detail);
  routes.post('/recruiter/applications/:applicationId/selection',guard,role,controller.decide);
  return routes;
}
