import type { Role } from '../../auth/repositories/auth.repository.js';

export interface CvProfile {
  name: string; email: string; phone: string; location: string; summary: string;
  education: string[]; experience: string[]; skills: string[]; languages: string[];
}
export type ProfileField = keyof CvProfile;
export interface Evidence { page: number; text: string }
export interface Extraction {
  version: string; profile: CvProfile; evidence: Partial<Record<ProfileField, Evidence[]>>;
  warnings: string[]; text: string;
}
export interface Actor { id: string; role: Role }
export interface ConfirmedProfile { id: string; source_cv_id: string; confirmed_at: string; profile: CvProfile }
export interface CvContext {
  application_id: string; candidate_id: string; title: string; status: string | null;
  document: { id: string; filename: string; bytes: Buffer } | null;
  extraction: Extraction | null; confirmed: ConfirmedProfile | null;
  current_profile_id: string | null;
}
export interface CvNote { id: string; body: string; created_at: string }
export type CvChange = { kind: 'extract'; extraction: Extraction }
  | { kind: 'confirm'; profile: CvProfile } | { kind: 'note'; body: string } | { kind: 'none' };
export interface CvRepository {
  getContext(actor: Actor, applicationId: string): Promise<CvContext>;
  change(actor: Actor, applicationId: string, decide: (context: CvContext) => CvChange): Promise<void>;
  getProfile(candidateId: string): Promise<ConfirmedProfile | null>;
  getDocument(actor: Actor, applicationId: string, documentId: string): Promise<{ bytes: Buffer; filename: string }>;
  listNotes(actor: Actor, applicationId: string): Promise<CvNote[]>;
  listApplications(ownerId: string, jobId: string): Promise<Array<{ id: string; name: string; title: string; confirmed: boolean }>>;
}
