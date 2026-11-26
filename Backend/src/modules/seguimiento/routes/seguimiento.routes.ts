import { Router,type RequestHandler } from 'express';
import { AppError } from '../../../shared/errors.js';
import { requireRole } from '../../auth/routes/auth.routes.js';
import type { AuthService } from '../../auth/services/auth.service.js';
import type { SeguimientoRepository } from '../repositories/seguimiento.repository.js';
import { SeguimientoService } from '../services/seguimiento.service.js';
import { SeguimientoController } from '../controllers/seguimiento.controller.js';
export function createSeguimientoRoutes(repo:SeguimientoRepository,auth:AuthService){
  const routes=Router(),controller=new SeguimientoController(new SeguimientoService(repo));
  const guard:RequestHandler=(req,res,next)=>{res.setHeader('Cache-Control','no-store');if(req.get('Sec-Fetch-Site')==='cross-site')return next(new AppError(403,'INVALID_ORIGIN','Solicitud no permitida.'));next();};
  const candidate=requireRole(auth,'CANDIDATE');
  routes.get('/candidate/applications/tracking',guard,candidate,controller.list);
  routes.get('/candidate/applications/:applicationId/tracking',guard,candidate,controller.read);
  return routes;
}
