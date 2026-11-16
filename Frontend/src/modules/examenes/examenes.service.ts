import { getJson, requestJson } from '../compartido/services/api';
export interface Draft {
  title: string; time_limit_minutes: number;
  questions: { text: string; options: { text: string; is_correct: boolean }[] }[];
}
export interface Exam {
  id: string; job_id: string; job_title: string; title: string; time_limit_seconds: number;
  version_number: number; status: 'DRAFT' | 'PUBLISHED';
  questions: { id: string; text: string; options: { id: string; text: string; is_correct?: boolean }[] }[];
}
export interface Available {
  id: string; application_id: string; job_id: string; job_title: string; title: string;
  time_limit_seconds: number; question_count: number; attempt_id: string | null;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'; deadline_at_utc: string | null;
}
export interface Answer { question_id: string; option_id: string; client_revision: number; accepted_at_utc: string }
export interface AttemptView {
  server_now: string;
  exam: Pick<Exam, 'id' | 'title' | 'job_title' | 'time_limit_seconds' | 'version_number' | 'questions'>;
  attempt: { id: string; exam_id: string; application_id: string; status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    started_at_utc: string; deadline_at_utc: string; finished_at_utc: string | null; answers: Answer[] };
}
export const exams = {
  owned: (job?: string) => getJson<{ items: Omit<Exam, 'questions'>[] }>('recruiter/exams' + (job ? '?job_id=' + encodeURIComponent(job) : '')),
  detail: (id: string) => getJson<Exam>('recruiter/exams/' + encodeURIComponent(id)),
  create: (job: string, input: Draft) => requestJson<Exam>('recruiter/jobs/' + encodeURIComponent(job) + '/exams', 'POST', input),
  update: (id: string, input: Draft) => requestJson<Exam>('recruiter/exams/' + encodeURIComponent(id), 'PUT', input),
  publish: (id: string) => requestJson<Exam>('recruiter/exams/' + encodeURIComponent(id) + '/publish', 'POST', {}),
  available: () => getJson<{ items: Available[] }>('candidate/exams'),
  start: (id: string, application: string) => requestJson<AttemptView>('candidate/exams/' + encodeURIComponent(id) + '/attempts', 'POST', { application_id: application }),
  read: (id: string) => getJson<AttemptView>('candidate/attempts/' + encodeURIComponent(id)),
  answer: (id: string, question: string, option: string, revision: number) => requestJson<AttemptView>('candidate/attempts/' + encodeURIComponent(id) + '/answers/' + encodeURIComponent(question), 'PUT', { option_id: option, client_revision: revision }),
  submit: (id: string) => requestJson<AttemptView>('candidate/attempts/' + encodeURIComponent(id) + '/submit', 'POST', {}),
};
