import { createHash } from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
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
  private async validate(file: Express.Multer.File | undefined): Promise<CvFile> {
    if (!file || file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf') || !file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
      throw new AppError(400, 'INVALID_PDF', 'Selecciona un archivo PDF válido.');
    if (!file.size || file.size > 5_000_000) throw new AppError(400, 'INVALID_PDF_SIZE', 'El PDF debe tener un máximo de 5 MB.');
    let text = '';
    const task = getDocument({ data: new Uint8Array(file.buffer), isEvalSupported: false, stopAtErrors: true, useSystemFonts: false });
    try {
      const document = await task.promise;
      for (let n = 1; n <= document.numPages && !text.trim(); n++) {
        const page = await document.getPage(n);
        const content = await page.getTextContent();
        text += content.items.map(item => 'str' in item ? item.str : '').join(' ');
        page.cleanup();
      }
      if (!text.trim()) throw new Error('PDF sin texto');
    } catch {
      throw new AppError(400, 'INVALID_PDF', 'El PDF debe abrirse correctamente, no estar protegido y contener texto seleccionable.');
    } finally { await task.destroy(); }
    return { bytes: file.buffer, filename: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255), sha256: createHash('sha256').update(file.buffer).digest('hex') };
  }
  async create(userId: string, jobId: unknown, file: Express.Multer.File | undefined) {
    const validId = id(jobId); return this.repo.create(userId, validId, await this.validate(file));
  }
  async replace(userId: string, applicationId: unknown, file: Express.Multer.File | undefined) {
    const validId = id(applicationId); return this.repo.replace(userId, validId, await this.validate(file));
  }
}
