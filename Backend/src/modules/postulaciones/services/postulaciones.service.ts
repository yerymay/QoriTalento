import { createHash } from 'node:crypto';
import { extractPdf } from '../../cv/services/extractor.js';
import { AppError } from '../../../shared/errors.js';
import type { CvFile, PostulacionesRepository } from '../repositories/postulaciones.repository.js';
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,19}$/.test(value)) throw new AppError(400, 'INVALID_ID', 'Identificador no válido.');
  return value;
}
export class PostulacionesService {
  constructor(private repo: PostulacionesRepository) {}
  list(userId: string) { return this.repo.list(userId); }
  finish(userId: string, jobId: unknown, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) throw new AppError(400, 'INVALID_INPUT', 'Esta acción no admite campos adicionales.');
    return this.repo.finish(userId, id(jobId));
  }
  private async validate(file: Express.Multer.File | undefined): Promise<CvFile & { extraction: Awaited<ReturnType<typeof extractPdf>> }> {
    if (!file || file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf') || !file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
      throw new AppError(400, 'INVALID_PDF', 'Selecciona un archivo PDF válido.');
    if (!file.size || file.size > 5_000_000) throw new AppError(400, 'INVALID_PDF_SIZE', 'El PDF debe tener un máximo de 5 MB.');
    const extraction = await extractPdf(file.buffer);
    return { bytes: file.buffer, filename: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255), sha256: createHash('sha256').update(file.buffer).digest('hex'), extraction };
  }
  async preview(file: Express.Multer.File | undefined) {
    const { extraction } = await this.validate(file);
    return { profile: extraction.profile, warnings: extraction.warnings };
  }
  async create(userId: string, jobId: unknown, file: Express.Multer.File | undefined) {
    const validId = id(jobId); return this.repo.create(userId, validId, await this.validate(file));
  }
  async replace(userId: string, applicationId: unknown, file: Express.Multer.File | undefined) {
    const validId = id(applicationId); return this.repo.replace(userId, validId, await this.validate(file));
  }
}
