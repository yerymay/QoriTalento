import type { Extraction } from '../../cv/repositories/cv.repository.js';
export interface Application {
  id: string; job_id: string; title: string; status: string | null;
  created_at: string; submitted_at: string | null; filename: string | null;
}
export interface CvFile { bytes: Buffer; filename: string; sha256: string; extraction?: Extraction }
export interface PostulacionesRepository {
  list(candidateId: string): Promise<Application[]>;
  finish(ownerId: string, jobId: string): Promise<{finished_at: string}>;
  create(candidateId: string, jobId: string, file: CvFile): Promise<Application>;
  replace(candidateId: string, id: string, file: CvFile): Promise<Application>;
}
