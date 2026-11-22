import { asyncHandler } from '../../../shared/errors.js';
import type { EvaluacionService } from '../services/evaluacion.service.js';
export class EvaluacionController {
  constructor(private service: EvaluacionService) {}
  read = asyncHandler(async (req, res) => { res.json(await this.service.read(res.locals.session.user, req.params.applicationId)); });
  prepare = asyncHandler(async (req, res) => { res.json(await this.service.prepare(res.locals.session.user, req.params.applicationId, req.body)); });
  assist = asyncHandler(async (req, res) => { res.json(await this.service.assist(res.locals.session.user, req.params.applicationId, req.body)); });
  review = asyncHandler(async (req, res) => { res.json(await this.service.review(res.locals.session.user, req.params.applicationId, req.body)); });
}
