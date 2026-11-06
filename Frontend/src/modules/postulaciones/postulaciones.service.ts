import { getJson, uploadFile } from '../compartido/services/api';
export interface Application { id: string; job_id: string; title: string; status: string | null; created_at: string; submitted_at: string | null; filename: string | null }
export const postulaciones = {
  list: () => getJson<{items: Application[]}>('applications'),
  send: (jobId: string, file: File, signal: AbortSignal, progress: (value: number | null) => void) => uploadFile<Application>(`jobs/${encodeURIComponent(jobId)}/applications`, 'POST', file, signal, progress),
  replace: (id: string, file: File, signal: AbortSignal, progress: (value: number | null) => void) => uploadFile<Application>(`applications/${encodeURIComponent(id)}/cv`, 'PUT', file, signal, progress),
};
