export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export interface Requirement { description: string }
export interface JobInput {
  title: string;
  description: string;
  area: string | null;
  location: string | null;
  experience_required: string | null;
  education_required: string | null;
  requirements: Requirement[];
}
export interface Job extends JobInput {
  id: string;
  owner_user_id: string;
  status: string;
  published_at: string | null;
  closed_at: string | null;
  process_finished_at?: string | null;
  created_at: string;
  updated_at: string;
}
export interface JobFilter { q: string; status?: JobStatus; page: number; page_size: number }
export interface JobPage { items: Job[]; total: number; page: number; page_size: number }
export interface JobScope { ownerId?: string; publishedOnly?: boolean }
export interface JobChange {
  fields?: JobInput;
  state?: { status: JobStatus; published_at: string | null; closed_at: string | null };
}
export interface OfertasRepository {
  list(scope: JobScope, filter: JobFilter): Promise<JobPage>;
  find(id: string, scope: JobScope): Promise<Job | null>;
  create(ownerId: string, fields: JobInput): Promise<Job>;
  // Ejecuta decide sobre una lectura bloqueada y persiste todo de forma atómica.
  // No invoca decide si la oferta no pertenece al propietario.
  changeOwned(id: string, ownerId: string, decide: (current: Job) => JobChange): Promise<Job | null>;
}
