import { Router, type RequestHandler } from 'express';
import { AuthController, sessionToken } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import type { AuthRepository, Role } from '../repositories/auth.repository.js';
import { AppError, asyncHandler } from '../../../shared/errors.js';
export function requireRole(service: AuthService, role: Role): RequestHandler {
  return asyncHandler(async (req,res,next) => { res.locals.session = await service.authenticate(sessionToken(req),role); next(); });
}
export function createAuthRoutes(repo: AuthRepository, options: {idleMinutes: number; secure: boolean}) {
  const routes = Router(), service = new AuthService(repo, options.idleMinutes), controller = new AuthController(service,options.secure);
  const attempts = new Map<string, {count:number; until:number}>();
  const limit: RequestHandler = (req,_res,next) => {
    const now = Date.now(), key = req.ip ?? 'unknown';
    for (const [ip, entry] of attempts) if (entry.until <= now) attempts.delete(ip);
    const entry = attempts.get(key) ?? {count:0,until:now+60000};
    if (attempts.size >= 10000 && !attempts.has(key)) return next(new AppError(429,'TOO_MANY_REQUESTS','Espera un minuto y vuelve a intentar.'));
    entry.count++; attempts.set(key,entry);
    next(entry.count > 20 ? new AppError(429,'TOO_MANY_REQUESTS','Demasiados intentos. Espera un minuto.') : undefined);
  };
  routes.use((_req,res,next) => { res.setHeader('Cache-Control','no-store'); next(); });
  // Cabecera personalizada + JSON impiden formularios y solicitudes simples de otro origen.
  routes.use((req,_res,next) => {
    if (['POST','PATCH'].includes(req.method) && (req.get('X-Qori-Client') !== 'web' || !req.is('application/json'))) return next(new AppError(403,'INVALID_ORIGIN','Solicitud no permitida. Vuelve a abrir el formulario.'));
    if (req.get('Sec-Fetch-Site') === 'cross-site') return next(new AppError(403,'INVALID_ORIGIN','Solicitud no permitida.'));
    next();
  });
  routes.post('/auth/candidates/register',limit,controller.registerCandidate);
  routes.post('/auth/recruiters/register',limit,controller.registerRecruiter);
  routes.post('/auth/login',limit,controller.login);
  routes.post('/auth/logout',controller.logout);
  routes.post('/auth/session/refresh',controller.refresh);
  routes.get('/me',controller.me);
  routes.patch('/me',controller.update);
  return routes;
}
