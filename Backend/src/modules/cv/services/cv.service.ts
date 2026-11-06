import { AppError } from '../../../shared/errors.js';
import type { Actor, CvContext, CvProfile, CvRepository } from '../repositories/cv.repository.js';
import { extractPdf } from './extractor.js';

const invalid = () => new AppError(400, 'INVALID_INPUT', 'Revisa los campos del perfil y sus límites.');
export function cvId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,19}$/.test(value)) throw new AppError(400, 'INVALID_ID', 'Identificador no válido.');
  return value;
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) throw invalid();
  return value as Record<string, unknown>;
}
export function validateProfile(value: unknown): CvProfile {
  const fields = ['name','email','phone','location','summary','education','experience','skills','languages'];
  const data = object(value, fields), result: Record<string, string | string[]> = {};
  for (const key of fields) {
    const max = key === 'summary' || ['education','experience'].includes(key) ? 4000 : key === 'email' ? 254 : key === 'phone' ? 32 : 200;
    const text = (v: unknown) => { if (typeof v !== 'string' || v.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw invalid(); return v.trim(); };
    if (['education','experience','skills','languages'].includes(key)) {
      const values = data[key]; if (!Array.isArray(values) || values.length > (['education','experience'].includes(key) ? 30 : 80)) throw invalid();
      result[key] = values.map(text).filter(Boolean);
    } else result[key] = text(data[key]);
  }
  const p = result as unknown as CvProfile;
  if (p.name.length < 2 || p.name.length > 160 || (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) || (p.phone && (!/^[+\d\s().-]+$/.test(p.phone) || p.phone.replace(/\D/g, '').length < 7))) throw invalid();
  if (Buffer.byteLength(JSON.stringify(p)) > 60_000) throw invalid();
  return p;
}
export class CvService {
  constructor(private repo: CvRepository) {}
  private role(actor: Actor, role: Actor['role']) { if (actor.role !== role) throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta operación.'); }
  private view(c: CvContext, actor: Actor) {
    return { application_id: c.application_id, title: c.title, status: c.status,
      document: c.document ? { id: c.document.id, filename: c.document.filename } : null,
      extraction: actor.role === 'CANDIDATE' ? c.extraction : null,
      confirmed: c.confirmed, current_profile_id: actor.role === 'CANDIDATE' ? c.current_profile_id : null,
      can_confirm: actor.role === 'CANDIDATE' && c.status === 'PENDING' && !!c.extraction && c.confirmed?.source_cv_id !== c.document?.id };
  }
  async review(actor: Actor, value: unknown) {
    const id = cvId(value); let c = await this.repo.getContext(actor, id);
    if (actor.role === 'CANDIDATE' && c.document && !c.extraction) {
      const documentId = c.document.id, extraction = await extractPdf(c.document.bytes);
      await this.repo.change(actor, id, latest => {
        if (latest.document?.id !== documentId) throw new AppError(409, 'CV_CHANGED', 'El CV cambió. Vuelve a cargar la revisión.');
        return latest.extraction ? { kind: 'none' } : { kind: 'extract', extraction };
      });
      c = await this.repo.getContext(actor, id);
    }
    return this.view(c, actor);
  }
  async confirm(actor: Actor, value: unknown, body: unknown) {
    this.role(actor, 'CANDIDATE'); const id = cvId(value), data = object(body, ['document_id', 'base_profile_id', 'profile']);
    const docId = cvId(data.document_id), baseId = data.base_profile_id === null ? null : cvId(data.base_profile_id), profile = validateProfile(data.profile);
    await this.repo.change(actor, id, c => {
      if (c.document?.id !== docId) throw new AppError(409, 'CV_CHANGED', 'El CV cambió. Vuelve a cargar la revisión antes de confirmar.');
      if (c.confirmed?.source_cv_id === docId) {
        if (JSON.stringify(c.confirmed.profile) === JSON.stringify(profile)) return { kind: 'none' };
        throw new AppError(409, 'PROFILE_ALREADY_CONFIRMED', 'Este CV ya fue confirmado. Puedes reemplazarlo mientras la postulación esté pendiente.');
      }
      if (c.status !== 'PENDING') throw new AppError(409, 'CONFIRMATION_UNAVAILABLE', 'La postulación ya está en evaluación. No se puede cambiar su perfil.');
      if (!c.extraction) throw new AppError(409, 'EXTRACTION_REQUIRED', 'Abre la revisión del CV antes de confirmar.');
      if (c.current_profile_id !== baseId) throw new AppError(409, 'PROFILE_CHANGED', 'Confirmaste otro perfil en otra pestaña. Recarga y revisa tus datos antes de continuar.');
      return { kind: 'confirm', profile };
    });
    return this.review(actor, id);
  }
  profile(actor: Actor) { this.role(actor, 'CANDIDATE'); return this.repo.getProfile(actor.id); }
  document(actor: Actor, applicationId: unknown, documentId: unknown) { return this.repo.getDocument(actor, cvId(applicationId), cvId(documentId)); }
  notes(actor: Actor, applicationId: unknown) { this.role(actor, 'RECRUITER'); return this.repo.listNotes(actor, cvId(applicationId)); }
  async addNote(actor: Actor, applicationId: unknown, body: unknown) {
    this.role(actor, 'RECRUITER'); const id = cvId(applicationId), data = object(body, ['body']);
    if (typeof data.body !== 'string' || !data.body.trim() || data.body.length > 4000) throw invalid();
    const text = data.body.trim(); await this.repo.change(actor, id, () => ({ kind: 'note', body: text }));
    return this.notes(actor, id);
  }
  applications(actor: Actor, jobId: unknown) { this.role(actor, 'RECRUITER'); return this.repo.listApplications(actor.id, cvId(jobId)); }
}
