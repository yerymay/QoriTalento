import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../../shared/errors.js';
import type { Answer, Attempt, AttemptChange, AttemptContext, AvailableExam, Exam, ExamInput, ExamenesRepository } from '../repositories/examenes.repository.js';

const examColumns = `SELECT CAST(e.id AS CHAR) id, CAST(e.job_id AS CHAR) job_id, j.title job_title,
 e.title, e.time_limit_seconds, e.version_number, e.status FROM exams e JOIN jobs j ON j.id=e.job_id`;
const attemptColumns = `SELECT CAST(id AS CHAR) id, CAST(exam_id AS CHAR) exam_id, CAST(application_id AS CHAR) application_id,
 started_at_utc, deadline_at_utc, finished_at_utc, status FROM exam_attempts`;
const iso = (value: Date | string) => new Date(value).toISOString();
const sqlDate = (value: string) => new Date(value);
async function now(c: PoolConnection) {
  const [rows] = await c.query<RowDataPacket[]>('SELECT UTC_TIMESTAMP(3) now');
  return iso(rows[0]!.now);
}
async function insertedId(c: PoolConnection) {
  const [rows] = await c.query<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) id');
  return String(rows[0]!.id);
}
async function hydrate(c: PoolConnection, row: RowDataPacket): Promise<Exam> {
  const [questions] = await c.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id, question_text text FROM exam_questions WHERE exam_id=? ORDER BY sort_order,id', [row.id]);
  const [options] = await c.execute<RowDataPacket[]>(`SELECT CAST(o.id AS CHAR) id, CAST(o.question_id AS CHAR) question_id, o.option_text text, o.is_correct
    FROM exam_options o JOIN exam_questions q ON q.id=o.question_id WHERE q.exam_id=? ORDER BY o.sort_order,o.id`, [row.id]);
  return { id: row.id, job_id: row.job_id, job_title: row.job_title, title: row.title, time_limit_seconds: row.time_limit_seconds,
    version_number: row.version_number, status: row.status, questions: questions.map(q => ({
      id: q.id, text: q.text, options: options.filter(o => o.question_id === q.id).map(o => ({ id: o.id, text: o.text, is_correct: !!o.is_correct })),
    })) };
}
async function getExam(c: PoolConnection, id: string) {
  const [rows] = await c.execute<RowDataPacket[]>(examColumns + ' WHERE e.id=?', [id]);
  return hydrate(c, rows[0]!);
}
async function getAttempt(c: PoolConnection, row: RowDataPacket): Promise<Attempt> {
  const [answers] = await c.execute<RowDataPacket[]>(`SELECT CAST(question_id AS CHAR) question_id, CAST(option_id AS CHAR) option_id,
    client_revision, accepted_at_utc FROM exam_answers WHERE attempt_id=? ORDER BY question_id`, [row.id]);
  return { id: row.id, exam_id: row.exam_id, application_id: row.application_id, status: row.status,
    started_at_utc: iso(row.started_at_utc), deadline_at_utc: iso(row.deadline_at_utc),
    finished_at_utc: row.finished_at_utc ? iso(row.finished_at_utc) : null,
    answers: answers.map(a => ({ question_id: a.question_id, option_id: a.option_id, client_revision: a.client_revision, accepted_at_utc: iso(a.accepted_at_utc) })),
  };
}
async function replaceQuestions(c: PoolConnection, id: string, input: ExamInput) {
  await c.execute('DELETE o FROM exam_options o JOIN exam_questions q ON q.id=o.question_id WHERE q.exam_id=?', [id]);
  await c.execute('DELETE FROM exam_questions WHERE exam_id=?', [id]);
  for (const [index, q] of input.questions.entries()) {
    await c.execute('INSERT INTO exam_questions (exam_id,question_text,sort_order) VALUES (?,?,?)', [id, q.text, index]);
    const questionId = await insertedId(c);
    for (const [position, option] of q.options.entries()) await c.execute('INSERT INTO exam_options (question_id,option_text,is_correct,sort_order) VALUES (?,?,?,?)', [questionId, option.text, option.is_correct, position]);
  }
}
export class MySqlExamenesRepository implements ExamenesRepository {
  constructor(private pool: Pool) {}
  private async transaction<T>(work: (c: PoolConnection) => Promise<T>): Promise<T> {
    const c = await this.pool.getConnection();
    try { await c.beginTransaction(); const result = await work(c); await c.commit(); return result; }
    catch (error) { await c.rollback(); throw error; }
    finally { c.release(); }
  }
  async listOwned(ownerId: string, jobId?: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>(examColumns + ' WHERE j.owner_user_id=?' + (jobId ? ' AND j.id=?' : '') + ' ORDER BY e.created_at DESC,e.id DESC', jobId ? [ownerId, jobId] : [ownerId]);
    return rows.map(row => ({ id: row.id, job_id: row.job_id, job_title: row.job_title, title: row.title, time_limit_seconds: row.time_limit_seconds, version_number: row.version_number, status: row.status })) as Omit<Exam, 'questions'>[];
  }
  async findOwned(ownerId: string, examId: string) {
    return this.transaction(async c => {
      const [rows] = await c.execute<RowDataPacket[]>(examColumns + ' WHERE e.id=? AND j.owner_user_id=?', [examId, ownerId]);
      return rows[0] ? hydrate(c, rows[0]) : null;
    });
  }
  async create(ownerId: string, jobId: string, input: ExamInput) {
    return this.transaction(async c => {
      const [jobs] = await c.execute<RowDataPacket[]>('SELECT id,process_finished_at FROM jobs WHERE id=? AND owner_user_id=? FOR UPDATE', [jobId, ownerId]);
      if (!jobs[0]) return null;
      if (jobs[0].process_finished_at) throw new AppError(409, 'PROCESS_FINISHED', 'Este proceso de selección ha finalizado.');
      await c.execute("INSERT INTO exams (job_id,title,time_limit_seconds,status) VALUES (?,?,?,'DRAFT')", [jobId, input.title, input.time_limit_minutes * 60]);
      const id = await insertedId(c);
      await replaceQuestions(c, id, input);
      return getExam(c, id);
    });
  }
  async changeOwned(ownerId: string, examId: string, decide: (exam: Exam) => { input?: ExamInput; publish?: boolean }) {
    return this.transaction(async c => {
      const [rows] = await c.execute<RowDataPacket[]>(examColumns + ' WHERE e.id=? AND j.owner_user_id=? FOR UPDATE', [examId, ownerId]);
      if (!rows[0]) return null;
      const exam = await hydrate(c, rows[0]);
      const change = decide(exam);
      if (change.publish) {
        const [jobs] = await c.execute<RowDataPacket[]>('SELECT process_finished_at FROM jobs WHERE id=?', [exam.job_id]);
        if (jobs[0]!.process_finished_at) throw new AppError(409, 'PROCESS_FINISHED', 'Este proceso de selección ha finalizado.');
        await c.execute("UPDATE exams SET status='PUBLISHED' WHERE id=?", [examId]);
      }
      if (change.input) {
        await c.execute('UPDATE exams SET title=?,time_limit_seconds=?,version_number=version_number+1 WHERE id=?', [change.input.title, change.input.time_limit_minutes * 60, examId]);
        await replaceQuestions(c, examId, change.input);
      }
      return getExam(c, examId);
    });
  }
  async listAvailable(candidateId: string): Promise<AvailableExam[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(`SELECT CAST(e.id AS CHAR) id, CAST(a.id AS CHAR) application_id,
      CAST(j.id AS CHAR) job_id,j.title job_title,e.title,e.time_limit_seconds,
      (SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id=e.id) question_count,
      CAST(t.id AS CHAR) attempt_id,
      CASE WHEN t.status='IN_PROGRESS' AND t.deadline_at_utc<=UTC_TIMESTAMP(3) THEN 'EXPIRED'
        ELSE COALESCE(t.status,'AVAILABLE') END status,t.deadline_at_utc
      FROM applications a JOIN jobs j ON j.id=a.job_id JOIN exams e ON e.job_id=j.id
      LEFT JOIN exam_attempts t ON t.application_id=a.id AND t.exam_id=e.id
      WHERE a.candidate_user_id=? AND e.status='PUBLISHED'
      AND (j.process_finished_at IS NULL OR t.id IS NOT NULL) ORDER BY e.created_at DESC,a.id DESC`, [candidateId]);
    return rows.map(row => ({ id: row.id, application_id: row.application_id, job_id: row.job_id, job_title: row.job_title, title: row.title,
      time_limit_seconds: row.time_limit_seconds, question_count: Number(row.question_count), attempt_id: row.attempt_id,
      status: row.status, deadline_at_utc: row.deadline_at_utc ? iso(row.deadline_at_utc) : null }));
  }
  async start(candidateId: string, examId: string, applicationId: string, decide: (exam: Exam, existing: Attempt | null, now: string, processFinished: boolean) => void) {
    return this.transaction(async c => {
      // Este bloqueo serializa todos los inicios de la misma postulación, incluidos reintentos de red.
      const [applications] = await c.execute<RowDataPacket[]>(`SELECT CAST(a.job_id AS CHAR) job_id,j.process_finished_at FROM applications a
        JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND a.candidate_user_id=? FOR UPDATE`, [applicationId, candidateId]);
      if (!applications[0]) return null;
      const [exams] = await c.execute<RowDataPacket[]>(examColumns + ' WHERE e.id=? AND e.job_id=? FOR UPDATE', [examId, applications[0].job_id]);
      if (!exams[0]) return null;
      const exam = await hydrate(c, exams[0]);
      const [attempts] = await c.execute<RowDataPacket[]>(attemptColumns + ' WHERE exam_id=? AND application_id=? ORDER BY id LIMIT 1 FOR UPDATE', [examId, applicationId]);
      let attempt = attempts[0] ? await getAttempt(c, attempts[0]) : null;
      const clock = await now(c);
      decide(exam, attempt, clock, !!applications[0].process_finished_at);
      if (!attempt) {
        const deadline = new Date(Date.parse(clock) + exam.time_limit_seconds * 1000).toISOString();
        await c.execute("INSERT INTO exam_attempts (exam_id,application_id,started_at_utc,deadline_at_utc,status) VALUES (?,?,?,?,'IN_PROGRESS')", [examId, applicationId, sqlDate(clock), sqlDate(deadline)]);
        attempt = { id: await insertedId(c), exam_id: examId, application_id: applicationId, started_at_utc: clock, deadline_at_utc: deadline, finished_at_utc: null, status: 'IN_PROGRESS', answers: [] };
      }
      return { exam, attempt, server_now: clock };
    });
  }
  async changeAttempt(candidateId: string, attemptId: string, decide: (context: AttemptContext) => AttemptChange) {
    return this.transaction(async c => {
      const [scope] = await c.execute<RowDataPacket[]>(`SELECT CAST(a.id AS CHAR) application_id FROM exam_attempts t
        JOIN applications a ON a.id=t.application_id WHERE t.id=? AND a.candidate_user_id=?`, [attemptId, candidateId]);
      if (!scope[0]) return null;
      await c.execute('SELECT id FROM applications WHERE id=? FOR UPDATE', [scope[0].application_id]);
      const [rows] = await c.execute<RowDataPacket[]>(attemptColumns + ' WHERE id=? FOR UPDATE', [attemptId]);
      const attempt = await getAttempt(c, rows[0]!);
      const exam = await getExam(c, attempt.exam_id);
      const context = { exam, attempt, server_now: await now(c) };
      const change = decide(context);
      if (change.answer) {
        const a: Answer = change.answer;
        await c.execute(`INSERT INTO exam_answers (attempt_id,question_id,option_id,client_revision,accepted_at_utc) VALUES (?,?,?,?,?)
          ON DUPLICATE KEY UPDATE option_id=VALUES(option_id),client_revision=VALUES(client_revision),accepted_at_utc=VALUES(accepted_at_utc)`,
        [attemptId, a.question_id, a.option_id, a.client_revision, sqlDate(a.accepted_at_utc)]);
        attempt.answers = [...attempt.answers.filter(old => old.question_id !== a.question_id), a];
      }
      if (change.finish) {
        await c.execute('UPDATE exam_attempts SET status=?,finished_at_utc=? WHERE id=?', [change.finish.status, sqlDate(change.finish.at), attemptId]);
        attempt.status = change.finish.status; attempt.finished_at_utc = change.finish.at;
      }
      return { context, change };
    });
  }
  async expireDue() {
    await this.pool.execute("UPDATE exam_attempts SET status='EXPIRED',finished_at_utc=deadline_at_utc WHERE status='IN_PROGRESS' AND deadline_at_utc<=UTC_TIMESTAMP(3)");
  }
}
