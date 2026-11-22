import type { CvProfile } from '../../cv/repositories/cv.repository.js';
import type { Attempt, Exam } from '../../examenes/repositories/examenes.repository.js';

export type Rating = 'MEETS' | 'PARTIAL' | 'DOES_NOT_MEET' | 'INSUFFICIENT_EVIDENCE';
export interface Criterion { id: string; text: string }
export interface Source { ref: string; text: string }
export interface Assessment { rating: Rating; source_refs: string[]; explanation: string }
export interface CriterionReview extends Criterion {
  weight: number; suggestion: Assessment | null; review: Assessment | null;
}
export interface Evaluation {
  revision: number; fingerprint: string; profile_version_id: string;
  sources: Source[]; criteria: CriterionReview[]; profile_max: 60 | 100;
  model: string | null; prompt_version: string | null;
  reviewed_by: string | null; reviewed_at: string | null;
}
export interface EvaluationContext {
  application_id: string; job_id: string; job_title: string;
  confirmed: { id: string; profile: CvProfile } | null;
  requirements: Criterion[];
  exams: { exam: Exam; attempts: Attempt[] }[];
  evaluation: Evaluation | null;
}
export interface Grade {
  attempt_id: string; exam_id: string; title: string; status: string;
  correct: number; total: number; unanswered: number; percent: number;
}
export interface EvaluationChange { evaluation?: Evaluation; grades?: Grade[] }
export interface EvaluacionRepository {
  read(ownerId: string, applicationId: string): Promise<EvaluationContext | null>;
  // Relee fuentes bajo bloqueo. Nunca ejecutar Ollama dentro de esta transacción.
  change(ownerId: string, applicationId: string,
    decide: (context: EvaluationContext) => EvaluationChange): Promise<EvaluationContext | null>;
}
export interface EvaluationAssistant {
  readonly model: string;
  suggest(requirements: Criterion[], sources: Source[]): Promise<unknown>;
}
