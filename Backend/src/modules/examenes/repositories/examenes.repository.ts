export interface ExamInput {
  title: string;
  time_limit_minutes: number;
  questions: { text: string; options: { text: string; is_correct: boolean }[] }[];
}
export interface Exam {
  id: string; job_id: string; job_title: string; title: string;
  time_limit_seconds: number; version_number: number; status: 'DRAFT' | 'PUBLISHED';
  questions: { id: string; text: string; options: { id: string; text: string; is_correct: boolean }[] }[];
}
export interface Answer { question_id: string; option_id: string; client_revision: number; accepted_at_utc: string }
export interface Attempt {
  id: string; exam_id: string; application_id: string;
  started_at_utc: string; deadline_at_utc: string; finished_at_utc: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'; answers: Answer[];
}
export interface AttemptContext { exam: Exam; attempt: Attempt; server_now: string }
export interface AttemptChange {
  answer?: Answer;
  finish?: { status: 'SUBMITTED' | 'EXPIRED'; at: string };
  rejection?: { code: string; message: string };
}
export interface AvailableExam {
  id: string; application_id: string; job_id: string; job_title: string; title: string;
  time_limit_seconds: number; question_count: number; attempt_id: string | null;
  status: 'AVAILABLE' | Attempt['status']; deadline_at_utc: string | null;
}
export interface ExamenesRepository {
  listOwned(ownerId: string, jobId?: string): Promise<Omit<Exam, 'questions'>[]>;
  findOwned(ownerId: string, examId: string): Promise<Exam | null>;
  create(ownerId: string, jobId: string, input: ExamInput): Promise<Exam | null>;
  changeOwned(ownerId: string, examId: string, decide: (exam: Exam) => { input?: ExamInput; publish?: boolean }): Promise<Exam | null>;
  listAvailable(candidateId: string): Promise<AvailableExam[]>;
  // Bloqueo de postulación/examen y reloj del servidor dentro de la transacción.
  start(candidateId: string, examId: string, applicationId: string,
    decide: (exam: Exam, existing: Attempt | null, now: string, processFinished: boolean) => void): Promise<AttemptContext | null>;
  // Decide se ejecuta bajo bloqueo de intento; aplica y confirma cambios incluso si hay rejection.
  changeAttempt(candidateId: string, attemptId: string, decide: (context: AttemptContext) => AttemptChange):
    Promise<{ context: AttemptContext; change: AttemptChange } | null>;
  expireDue(): Promise<void>;
}
