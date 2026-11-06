import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../../shared/errors.js';
import type { Actor, ConfirmedProfile, CvChange, CvContext, CvRepository, Extraction } from '../repositories/cv.repository.js';

const parsed = <T>(value: unknown): T => (typeof value === 'string' ? JSON.parse(value) : value) as T;
const confirmed = (row: RowDataPacket | undefined): ConfirmedProfile | null => row ? {
  id: String(row.id), source_cv_id: String(row.source_cv_id), profile: parsed(row.data_json), confirmed_at: new Date(row.confirmed_at).toISOString(),
} : null;
export class MySqlCvRepository implements CvRepository {
  constructor(private pool: Pool) {}
  private async context(db: Pool | PoolConnection, actor: Actor, id: string, lock = false): Promise<CvContext> {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT CAST(a.candidate_user_id AS CHAR) candidate_id, a.status, j.title
      FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND ${actor.role === 'CANDIDATE' ? 'a.candidate_user_id' : 'j.owner_user_id'}=?${lock ? ' FOR UPDATE' : ''}`, [id, actor.id]);
    if (!rows[0]) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'No se encontró la postulación.');
    const [docs] = await db.execute<RowDataPacket[]>('SELECT CAST(d.id AS CHAR) id,d.original_filename,p.contents FROM cv_documents d JOIN cv_private_data p ON p.cv_document_id=d.id WHERE d.application_id=? ORDER BY d.id DESC LIMIT 1', [id]);
    const doc = docs[0];
    const [runs] = doc ? await db.execute<RowDataPacket[]>("SELECT detected_json FROM cv_extraction_runs WHERE cv_document_id=? AND status='COMPLETED' ORDER BY id DESC LIMIT 1", [doc.id]) : [[]];
    const [versions] = await db.execute<RowDataPacket[]>('SELECT CAST(v.id AS CHAR) id,CAST(v.source_cv_id AS CHAR) source_cv_id,v.data_json,v.confirmed_at FROM candidate_profile_versions v JOIN application_profile_snapshots s ON s.profile_version_id=v.id WHERE s.application_id=? AND v.confirmed_at IS NOT NULL ORDER BY v.id DESC LIMIT 1', [id]);
    const [current] = await db.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id FROM candidate_profile_versions WHERE candidate_user_id=? AND confirmed_at IS NOT NULL ORDER BY id DESC LIMIT 1', [rows[0].candidate_id]);
    return { application_id: id, candidate_id: rows[0].candidate_id, title: rows[0].title, status: rows[0].status,
      document: doc ? { id: doc.id, filename: doc.original_filename ?? 'cv.pdf', bytes: doc.contents } : null,
      extraction: runs[0] ? parsed<Extraction>(runs[0].detected_json) : null, confirmed: confirmed(versions[0]), current_profile_id: current[0]?.id ?? null };
  }
  getContext(actor: Actor, id: string) { return this.context(this.pool, actor, id); }
  async change(actor: Actor, id: string, decide: (context: CvContext) => CvChange) {
    const c = await this.pool.getConnection();
    try {
      await c.beginTransaction();
      // Serializa confirmaciones de distintas postulaciones del mismo usuario.
      await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [actor.id]);
      const context = await this.context(c, actor, id, true), change = decide(context);
      if (change.kind === 'extract') {
        await c.execute("INSERT INTO cv_extraction_runs (cv_document_id,status,extractor_version,detected_json,finished_at) VALUES (?,'COMPLETED',?,?,UTC_TIMESTAMP(3))", [context.document!.id, change.extraction.version, JSON.stringify(change.extraction)]);
      } else if (change.kind === 'confirm') {
        await c.execute('INSERT INTO candidate_profile_versions (candidate_user_id,source_cv_id,data_json,confirmed_at) VALUES (?,?,?,UTC_TIMESTAMP(3))', [actor.id, context.document!.id, JSON.stringify(change.profile)]);
        await c.execute('INSERT INTO application_profile_snapshots (application_id,profile_version_id) VALUES (?,LAST_INSERT_ID())', [id]);
        // El correo del CV es de contacto; no cambia credenciales ni sesiones.
        await c.execute('UPDATE users SET full_name=?,phone=? WHERE id=?', [change.profile.name, change.profile.phone || null, actor.id]);
      } else if (change.kind === 'note') {
        await c.execute('INSERT INTO recruiter_notes (application_id,author_user_id,note_body) VALUES (?,?,?)', [id, actor.id, change.body]);
      }
      await c.commit();
    } catch (error) { await c.rollback(); throw error; } finally { c.release(); }
  }
  async getProfile(candidateId: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id,CAST(source_cv_id AS CHAR) source_cv_id,data_json,confirmed_at FROM candidate_profile_versions WHERE candidate_user_id=? AND confirmed_at IS NOT NULL ORDER BY id DESC LIMIT 1', [candidateId]);
    return confirmed(rows[0]);
  }
  async getDocument(actor: Actor, id: string, docId: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>(`SELECT p.contents,d.original_filename FROM cv_documents d JOIN cv_private_data p ON p.cv_document_id=d.id JOIN applications a ON a.id=d.application_id JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND d.id=? AND ${actor.role === 'CANDIDATE' ? 'a.candidate_user_id' : 'j.owner_user_id'}=?`, [id, docId, actor.id]);
    if (!rows[0]) throw new AppError(404, 'CV_NOT_FOUND', 'El documento no está disponible.');
    return { bytes: rows[0].contents as Buffer, filename: String(rows[0].original_filename ?? 'cv.pdf') };
  }
  async listNotes(actor: Actor, id: string) {
    await this.context(this.pool, actor, id);
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id,note_body,created_at FROM recruiter_notes WHERE application_id=? AND author_user_id=? ORDER BY id DESC', [id, actor.id]);
    return rows.map(row => ({ id: row.id as string, body: row.note_body as string, created_at: new Date(row.created_at).toISOString() }));
  }
  async listApplications(ownerId: string, jobId: string) {
    const [jobs] = await this.pool.execute<RowDataPacket[]>('SELECT id FROM jobs WHERE id=? AND owner_user_id=?', [jobId, ownerId]);
    if (!jobs[0]) throw new AppError(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.');
    const [rows] = await this.pool.execute<RowDataPacket[]>(`SELECT CAST(a.id AS CHAR) id,u.full_name name,j.title,
      EXISTS(SELECT 1 FROM application_profile_snapshots s WHERE s.application_id=a.id) confirmed
      FROM applications a JOIN users u ON u.id=a.candidate_user_id JOIN jobs j ON j.id=a.job_id WHERE j.id=? AND j.owner_user_id=? ORDER BY a.id DESC`, [jobId, ownerId]);
    return rows.map(row => ({ id: row.id as string, name: row.name as string, title: row.title as string, confirmed: !!row.confirmed }));
  }
}
