import { asyncHandler } from '../../../shared/errors.js';
import type { OfertasService } from '../services/ofertas.service.js';

export class OfertasController {
  constructor(private service: OfertasService) {}
  available = asyncHandler(async (req, res) => { res.json(await this.service.list(res.locals.session.user, req.query, false)); });
  publicDetail = asyncHandler(async (req, res) => { res.json(await this.service.detail(res.locals.session.user, req.params.jobId, false)); });
  owned = asyncHandler(async (req, res) => { res.json(await this.service.list(res.locals.session.user, req.query, true)); });
  ownedDetail = asyncHandler(async (req, res) => { res.json(await this.service.detail(res.locals.session.user, req.params.jobId, true)); });
  create = asyncHandler(async (req, res) => {
    const job = await this.service.create(res.locals.session.user, req.body);
    res.status(201).location(`/api/v1/recruiter/jobs/${job.id}`).json(job);
  });
  update = asyncHandler(async (req, res) => { res.json(await this.service.update(res.locals.session.user, req.params.jobId, req.body)); });
  publish = asyncHandler(async (req, res) => { res.json(await this.service.transition(res.locals.session.user, req.params.jobId, 'publish', req.body)); });
  close = asyncHandler(async (req, res) => { res.json(await this.service.transition(res.locals.session.user, req.params.jobId, 'close', req.body)); });
}
