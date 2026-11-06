import { getJson, requestJson } from '../compartido/services/api';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export interface JobInput {
  title: string; description: string; area: string | null; location: string | null;
  experience_required: string | null; education_required: string | null;
  requirements: { description: string }[];
}
export interface Job extends JobInput {
  id: string; status: JobStatus; published_at: string | null; closed_at: string | null;
  process_finished_at?: string | null; created_at: string; updated_at: string;
}
export interface JobPage { items: Job[]; total: number; page: number; page_size: number }
export const ofertas = {
  list: (owned: boolean, query: URLSearchParams) => getJson<JobPage>(`${owned ? 'recruiter/' : ''}jobs?${query}`),
  detail: (owned: boolean, id: string) => getJson<Job>(`${owned ? 'recruiter/' : ''}jobs/${encodeURIComponent(id)}`),
  create: (body: JobInput) => requestJson<Job>('recruiter/jobs', 'POST', body),
  update: (id: string, body: JobInput) => requestJson<Job>(`recruiter/jobs/${encodeURIComponent(id)}`, 'PATCH', body),
  finish: (id: string) => requestJson<{finished_at: string}>('recruiter/jobs/' + encodeURIComponent(id) + '/finish', 'POST', {}),
  transition: (id: string, action: 'publish' | 'close') => requestJson<Job>(`recruiter/jobs/${encodeURIComponent(id)}/${action}`, 'POST', {}),
};
