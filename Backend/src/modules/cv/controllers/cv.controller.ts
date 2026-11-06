import { asyncHandler } from '../../../shared/errors.js';
import type { CvService } from '../services/cv.service.js';
export class CvController {
  constructor(private service: CvService) {}
  review = asyncHandler(async (req, res) => { res.json(await this.service.review(res.locals.session.user, req.params.applicationId)); });
  confirm = asyncHandler(async (req, res) => { res.json(await this.service.confirm(res.locals.session.user, req.params.applicationId, req.body)); });
  profile = asyncHandler(async (_req, res) => { res.json({ profile: await this.service.profile(res.locals.session.user) }); });
  document = asyncHandler(async (req, res) => {
    const file = await this.service.document(res.locals.session.user, req.params.applicationId, req.params.documentId);
    res.setHeader('Content-Type', 'application/pdf'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
    res.setHeader('Content-Security-Policy', "sandbox; frame-ancestors 'self'"); res.send(file.bytes);
  });
  notes = asyncHandler(async (req, res) => { res.json({ items: await this.service.notes(res.locals.session.user, req.params.applicationId) }); });
  addNote = asyncHandler(async (req, res) => { res.status(201).json({ items: await this.service.addNote(res.locals.session.user, req.params.applicationId, req.body) }); });
  applications = asyncHandler(async (req, res) => { res.json({ items: await this.service.applications(res.locals.session.user, req.params.jobId) }); });
}
