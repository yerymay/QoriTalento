import { AppError } from '../../../shared/errors.js';
import type { User } from '../../auth/repositories/auth.repository.js';
import type { Job, JobFilter, JobInput, JobStatus, OfertasRepository } from '../repositories/ofertas.repository.js';

type Actor = Pick<User, 'id' | 'role' | 'kind'>;
const keys = ['title', 'description', 'area', 'location', 'experience_required', 'education_required', 'requirements'];
const invalid = (message: string): never => { throw new AppError(400, 'INVALID_INPUT', message); };
function object(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return invalid('Envía un formulario válido.');
  return input as Record<string, unknown>;
}
function text(value: unknown, label: string, max: number, min = 0): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) return invalid(`${label}: ingresa entre ${min} y ${max} caracteres.`);
  return value.trim();
}
export function jobId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,19}$/.test(value) || BigInt(value) > 18446744073709551615n) return invalid('El código de oferta no es válido.');
  return value;
}
function inputFields(input: unknown, partial = false): Partial<JobInput> {
  const body = object(input);
  if (Object.keys(body).some(key => !keys.includes(key))) return invalid('La oferta contiene campos no permitidos.');
  if (partial && !Object.keys(body).length) return invalid('Indica al menos un campo para actualizar.');
  const result: Partial<JobInput> = {};
  if (!partial || 'title' in body) result.title = text(body.title, 'Cargo', 180, 1);
  if (!partial || 'description' in body) result.description = text(body.description === undefined ? '' : body.description, 'Descripción', 10000);
  for (const [key, label, max] of [
    ['area', 'Área', 120], ['location', 'Ubicación y modalidad', 180],
    ['experience_required', 'Experiencia', 2000], ['education_required', 'Formación', 2000],
  ] as const) {
    if (!partial || key in body) result[key] = body[key] == null ? null : text(body[key], label, max) || null;
  }
  if (!partial || 'requirements' in body) {
    const requirements = body.requirements === undefined ? [] : body.requirements;
    if (!Array.isArray(requirements) || requirements.length > 50) return invalid('Añade como máximo 50 requisitos.');
    result.requirements = requirements.map(value => {
      const requirement = object(value);
      if (Object.keys(requirement).some(key => key !== 'description')) return invalid('Cada requisito solo admite una descripción.');
      return { description: text(requirement.description, 'Requisito', 1000, 1) };
    });
  }
  return result;
}
function complete(job: JobInput) {
  if (!job.description || !job.requirements.length) throw new AppError(409, 'JOB_INCOMPLETE', 'Completa la descripción y al menos un requisito antes de publicar.');
}
function notFound(): never { throw new AppError(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.'); }
function recruiter(actor: Actor) {
  if (actor.role !== 'RECRUITER') throw new AppError(403, 'FORBIDDEN', 'Solo un reclutador puede gestionar ofertas.');
}
function candidate(actor: Actor) {
  if (actor.role !== 'CANDIDATE') throw new AppError(403, 'FORBIDDEN', 'Consulta tus ofertas desde el panel de reclutamiento.');
}
function filter(input: unknown, owned: boolean): JobFilter {
  const body = object(input);
  if (Object.keys(body).some(key => !(owned ? ['q', 'status', 'page', 'page_size'] : ['q', 'page', 'page_size']).includes(key))) return invalid('El filtro contiene campos no permitidos.');
  const number = (value: unknown, fallback: number, max: number) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > max) return invalid('La página o su tamaño no son válidos.');
    return Number(value);
  };
  const status = body.status;
  if (status !== undefined && !['DRAFT', 'PUBLISHED', 'CLOSED'].includes(String(status))) return invalid('Selecciona un estado válido.');
  if (status !== undefined && typeof status !== 'string') return invalid('Selecciona un único estado.');
  return { q: text(body.q ?? '', 'Búsqueda', 180), page: number(body.page, 1, 10000), page_size: number(body.page_size, 20, 50), ...(status ? { status: status as JobStatus } : {}) };
}
const publicJob = ({ owner_user_id: _, ...job }: Job) => job;

export class OfertasService {
  constructor(private repo: OfertasRepository, private now = () => new Date()) {}
  async list(actor: Actor, query: unknown, owned: boolean) {
    owned ? recruiter(actor) : candidate(actor);
    const page = await this.repo.list(owned ? { ownerId: actor.id } : { publishedOnly: true }, filter(query, owned));
    return { ...page, items: owned ? page.items : page.items.map(publicJob) };
  }
  async detail(actor: Actor, id: unknown, owned: boolean) {
    owned ? recruiter(actor) : candidate(actor);
    const job = await this.repo.find(jobId(id), owned ? { ownerId: actor.id } : { publishedOnly: true });
    if (!job) return notFound();
    return owned ? job : publicJob(job);
  }
  async create(actor: Actor, input: unknown) {
    recruiter(actor);
    return this.repo.create(actor.id, inputFields(input) as JobInput);
  }
  async update(actor: Actor, id: unknown, input: unknown) {
    recruiter(actor);
    const fields = inputFields(input, true);
    const result = await this.repo.changeOwned(jobId(id), actor.id, current => {
      if (!['DRAFT', 'PUBLISHED', 'CLOSED'].includes(current.status)) throw new AppError(409, 'INVALID_JOB_STATE', 'Esta oferta no admite cambios en su estado actual.');
      const merged = { ...current, ...fields };
      if (current.status === 'PUBLISHED') complete(merged);
      return { fields: merged };
    });
    return result ?? notFound();
  }
  async transition(actor: Actor, id: unknown, action: 'publish' | 'close', input: unknown) {
    recruiter(actor);
    if (Object.keys(object(input)).length) return invalid('Esta acción no admite campos adicionales.');
    const result = await this.repo.changeOwned(jobId(id), actor.id, current => {
      if (action === 'publish') {
        if (current.status === 'PUBLISHED') return {};
        if (current.status !== 'DRAFT') throw new AppError(409, 'INVALID_JOB_STATE', 'Solo se pueden publicar ofertas en borrador. Una oferta cerrada no se puede reabrir.');
        complete(current);
        return { state: { status: 'PUBLISHED', published_at: this.now().toISOString(), closed_at: null } };
      }
      if (current.status === 'CLOSED') return {};
      if (current.status !== 'PUBLISHED') throw new AppError(409, 'INVALID_JOB_STATE', 'Solo se pueden cerrar ofertas publicadas.');
      return { state: { status: 'CLOSED', published_at: current.published_at, closed_at: this.now().toISOString() } };
    });
    return result ?? notFound();
  }
}
