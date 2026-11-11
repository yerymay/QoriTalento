import { asyncHandler } from '../../../shared/errors.js';
import type { PostulacionesService } from '../services/postulaciones.service.js';
export class PostulacionesController {
  constructor(private service: PostulacionesService) {}
  preview = asyncHandler(async (req, res) => { res.json(await this.service.preview(req.file)); });
  finish = asyncHandler(async (req, res) => { res.json(await this.service.finish(res.locals.session.user.id, req.params.jobId, req.body)); });
  list = asyncHandler(async (_req, res) => { res.json({ items: await this.service.list(res.locals.session.user.id) }); });
  create = asyncHandler(async (req, res) => { const value = await this.service.create(res.locals.session.user.id, req.params.jobId, req.file); res.status(201).json(value); });
  replace = asyncHandler(async (req, res) => { res.json(await this.service.replace(res.locals.session.user.id, req.params.applicationId, req.file)); });
}
