import { asyncHandler } from '../../../shared/errors.js';
import type { ExamenesService } from '../services/examenes.service.js';
export class ExamenesController {
  constructor(private service: ExamenesService) {}
  list = asyncHandler(async (req, res) => { res.json(await this.service.listOwned(res.locals.session.user, req.query.job_id)); });
  detail = asyncHandler(async (req, res) => { res.json(await this.service.detail(res.locals.session.user, req.params.examId)); });
  create = asyncHandler(async (req, res) => { res.status(201).json(await this.service.create(res.locals.session.user, req.params.jobId, req.body)); });
  update = asyncHandler(async (req, res) => { res.json(await this.service.update(res.locals.session.user, req.params.examId, req.body)); });
  publish = asyncHandler(async (req, res) => { res.json(await this.service.publish(res.locals.session.user, req.params.examId, req.body)); });
  available = asyncHandler(async (_req, res) => { res.json(await this.service.available(res.locals.session.user)); });
  start = asyncHandler(async (req, res) => { res.json(await this.service.start(res.locals.session.user, req.params.examId, req.body)); });
  read = asyncHandler(async (req, res) => { res.json(await this.service.read(res.locals.session.user, req.params.attemptId)); });
  answer = asyncHandler(async (req, res) => { res.json(await this.service.answer(res.locals.session.user, req.params.attemptId, req.params.questionId, req.body)); });
  submit = asyncHandler(async (req, res) => { res.json(await this.service.submit(res.locals.session.user, req.params.attemptId, req.body)); });
}
