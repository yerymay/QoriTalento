import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { CvProfile } from '../../cv/repositories/cv.repository.js';
import type { Attempt, Exam } from '../../examenes/repositories/examenes.repository.js';
import type { Evaluation, EvaluationChange, EvaluationContext, EvaluacionRepository } from '../repositories/evaluacion.repository.js';
const parsed = <T>(value: unknown): T => (typeof value === 'string' ? JSON.parse(value) : value) as T;
const iso = (value: Date | string) => new Date(value).toISOString();

export class MySqlEvaluacionRepository implements EvaluacionRepository {
  constructor(private pool: Pool) {}
  private async context(c: PoolConnection, owner: string, id: string, lock: boolean): Promise<EvaluationContext | null> {
    const [rows] = await c.execute<RowDataPacket[]>(`SELECT CAST(j.id AS CHAR) job_id,j.title,j.experience_required,j.education_required
      FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.owner_user_id=?${lock ? ' FOR UPDATE' : ''}`, [id, owner]);
    const job = rows[0]; if (!job) return null;
    const [profiles] = await c.execute<RowDataPacket[]>(`SELECT CAST(v.id AS CHAR) id,v.data_json FROM candidate_profile_versions v
      JOIN application_profile_snapshots s ON s.profile_version_id=v.id JOIN applications a ON a.id=s.application_id
      WHERE s.application_id=? AND v.candidate_user_id=a.candidate_user_id AND v.confirmed_at IS NOT NULL ORDER BY v.id DESC LIMIT 1`, [id]);
    const [requirements] = await c.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id,description FROM job_requirements WHERE job_id=? ORDER BY sort_order,id', [job.job_id]);
    const [examRows] = await c.execute<RowDataPacket[]>(`SELECT CAST(id AS CHAR) id,title,time_limit_seconds,version_number,status FROM exams
      WHERE job_id=? AND status='PUBLISHED' ORDER BY id${lock ? ' FOR UPDATE' : ''}`, [job.job_id]);
    const exams: EvaluationContext['exams'] = [];
    for (const e of examRows) {
      const [questions] = await c.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id,question_text text FROM exam_questions WHERE exam_id=? ORDER BY sort_order,id', [e.id]);
      const [options] = await c.execute<RowDataPacket[]>(`SELECT CAST(o.id AS CHAR) id,CAST(o.question_id AS CHAR) question_id,o.option_text text,o.is_correct
        FROM exam_options o JOIN exam_questions q ON q.id=o.question_id WHERE q.exam_id=? ORDER BY o.sort_order,o.id`, [e.id]);
      const exam: Exam = { id: e.id, job_id: job.job_id, job_title: job.title, title: e.title, time_limit_seconds: e.time_limit_seconds,
        version_number: e.version_number, status: e.status,
        questions: questions.map(q => ({ id: q.id, text: q.text, options: options.filter(o => o.question_id === q.id).map(o => ({ id: o.id, text: o.text, is_correct: !!o.is_correct })) })) };
      const [attemptRows] = await c.execute<RowDataPacket[]>(`SELECT CAST(id AS CHAR) id,status,started_at_utc,deadline_at_utc,finished_at_utc
        FROM exam_attempts WHERE exam_id=? AND application_id=? ORDER BY id${lock ? ' FOR UPDATE' : ''}`, [e.id, id]);
      const attempts: Attempt[] = [];
      for (const t of attemptRows) {
        const [answers] = await c.execute<RowDataPacket[]>(`SELECT CAST(question_id AS CHAR) question_id,CAST(option_id AS CHAR) option_id,
          client_revision,accepted_at_utc FROM exam_answers WHERE attempt_id=? ORDER BY question_id`, [t.id]);
        attempts.push({ id: t.id, exam_id: e.id, application_id: id, status: t.status,
          started_at_utc: iso(t.started_at_utc), deadline_at_utc: iso(t.deadline_at_utc),
          finished_at_utc: t.finished_at_utc ? iso(t.finished_at_utc) : null,
          answers: answers.map(a => ({ question_id: a.question_id, option_id: a.option_id, client_revision: a.client_revision, accepted_at_utc: iso(a.accepted_at_utc) })) });
      }
      exams.push({ exam, attempts });
    }
    const [evaluations] = await c.execute<RowDataPacket[]>('SELECT document_json FROM m06_evaluation_revisions WHERE application_id=? ORDER BY revision DESC LIMIT 1', [id]);
    return { application_id: id, job_id: job.job_id, job_title: job.title,
      confirmed: profiles[0] ? { id: profiles[0].id, profile: parsed<CvProfile>(profiles[0].data_json) } : null,
      requirements: [
        ...requirements.map(r => ({ id: 'requirement:' + r.id, text: String(r.description) })),
        ...(job.experience_required?.trim() ? [{ id: 'experience_required', text: String(job.experience_required) }] : []),
        ...(job.education_required?.trim() ? [{ id: 'education_required', text: String(job.education_required) }] : []),
      ], exams, evaluation: evaluations[0] ? parsed<Evaluation>(evaluations[0].document_json) : null };
  }
  private async transaction<T>(work: (c: PoolConnection) => Promise<T>) {
    const c = await this.pool.getConnection();
    try { await c.beginTransaction(); const result = await work(c); await c.commit(); return result; }
    catch (error) { await c.rollback(); throw error; }
    finally { c.release(); }
  }
  read(owner: string, id: string) { return this.transaction(c => this.context(c, owner, id, false)); }
  change(owner: string, id: string, decide: (context: EvaluationContext) => EvaluationChange) {
    return this.transaction(async c => {
      const context = await this.context(c, owner, id, true); if (!context) return null;
      const change = decide(context);
      for (const grade of change.grades ?? []) {
        await c.execute(`INSERT INTO exam_grades (attempt_id,score,grading_version)
          SELECT ?,?,'m06-equal-questions-v1' WHERE NOT EXISTS
          (SELECT 1 FROM exam_grades WHERE attempt_id=? AND grading_version='m06-equal-questions-v1')`,
        [grade.attempt_id, grade.percent, grade.attempt_id]);
      }
      if (change.evaluation) {
        await c.execute('INSERT INTO m06_evaluation_revisions (application_id,revision,document_json,actor_user_id) VALUES (?,?,?,?)',
          [id, change.evaluation.revision, JSON.stringify(change.evaluation), owner]);
        context.evaluation = change.evaluation;
      }
      return context;
    });
  }
}
