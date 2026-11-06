import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../../shared/errors.js';
import type { Application, CvFile, PostulacionesRepository } from '../repositories/postulaciones.repository.js';
const select = `SELECT CAST(a.id AS CHAR) id, CAST(a.job_id AS CHAR) job_id, j.title, a.status, a.created_at, a.submitted_at,
 (SELECT original_filename FROM cv_documents d WHERE d.application_id=a.id ORDER BY d.id DESC LIMIT 1) filename
 FROM applications a JOIN jobs j ON j.id=a.job_id`;
function map(row: RowDataPacket): Application {
  return { id: row.id, job_id: row.job_id, title: row.title, status: row.status, filename: row.filename,
    created_at: new Date(row.created_at).toISOString(), submitted_at: row.submitted_at ? new Date(row.submitted_at).toISOString() : null };
}
export class MySqlPostulacionesRepository implements PostulacionesRepository {
  constructor(private pool: Pool) {}
  private async transaction<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
    const c = await this.pool.getConnection();
    try { await c.beginTransaction(); const value = await fn(c); await c.commit(); return value; }
    catch (error) { await c.rollback(); throw error; } finally { c.release(); }
  }
  async finish(ownerId: string, jobId: string) {
    return this.transaction(async c => {
      const [jobs] = await c.execute<RowDataPacket[]>('SELECT status,process_finished_at FROM jobs WHERE id=? AND owner_user_id=? FOR UPDATE', [jobId, ownerId]);
      if (!jobs[0]) throw new AppError(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.');
      if (!['PUBLISHED', 'CLOSED'].includes(jobs[0].status)) throw new AppError(409, 'INVALID_JOB_STATE', 'Solo puedes finalizar un proceso de una oferta publicada o cerrada.');
      if (!jobs[0].process_finished_at) await c.execute("UPDATE jobs SET status='CLOSED',closed_at=COALESCE(closed_at,UTC_TIMESTAMP(3)),process_finished_at=UTC_TIMESTAMP(3) WHERE id=? AND owner_user_id=?", [jobId, ownerId]);
      const [rows] = await c.execute<RowDataPacket[]>('SELECT process_finished_at FROM jobs WHERE id=? AND owner_user_id=?', [jobId, ownerId]);
      return { finished_at: new Date(rows[0]!.process_finished_at).toISOString() };
    });
  }
  async list(candidateId: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>(select + ' WHERE a.candidate_user_id=? ORDER BY a.created_at DESC,a.id DESC', [candidateId]);
    return rows.map(map);
  }
  private async store(c: PoolConnection, applicationId: string, file: CvFile) {
    await c.execute('INSERT INTO cv_documents (application_id,storage_key,original_filename,sha256,mime_type,byte_size,scan_status) VALUES (?,?,?,?,?,?,NULL)',
      [applicationId, randomUUID(), file.filename, file.sha256, 'application/pdf', file.bytes.length]);
    await c.execute('INSERT INTO cv_private_data (cv_document_id,contents) VALUES (LAST_INSERT_ID(),?)', [file.bytes]);
  }
  private async find(c: PoolConnection, id: string, candidateId: string): Promise<Application> {
    const [rows] = await c.execute<RowDataPacket[]>(select + ' WHERE a.id=? AND a.candidate_user_id=?', [id, candidateId]);
    if (!rows[0]) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'No se encontró la postulación.');
    return map(rows[0]);
  }
  async create(candidateId: string, jobId: string, file: CvFile) {
    return this.transaction(async c => {
      const [jobs] = await c.execute<RowDataPacket[]>('SELECT status FROM jobs WHERE id=? FOR UPDATE', [jobId]);
      if (!jobs[0] || jobs[0].status !== 'PUBLISHED') throw new AppError(404, 'JOB_NOT_AVAILABLE', 'Esta oferta ya no está disponible.');
      const [existing] = await c.execute<RowDataPacket[]>("SELECT CAST(id AS CHAR) id, status FROM applications WHERE job_id=? AND candidate_user_id=? AND (status IS NULL OR status NOT IN ('ADVANCES','NOT_ADVANCES')) ORDER BY id DESC LIMIT 1", [jobId, candidateId]);
      if (existing[0]) {
        const labels: Record<string, string> = { PENDING: 'Pendiente de evaluación', IN_REVIEW: 'En revisión', SHORTLISTED: 'Preseleccionado' };
        const label = labels[String(existing[0].status)] ?? 'Estado pendiente';
        throw new AppError(409, 'ACTIVE_APPLICATION', `Ya tienes una postulación activa: ${label}. Consúltala en Mis postulaciones.`);
      }
      await c.execute("INSERT INTO applications (job_id,candidate_user_id,status,submitted_at) VALUES (?,?,'PENDING',UTC_TIMESTAMP(3))", [jobId, candidateId]);
      const [ids] = await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) id');
      const applicationId: string = ids[0]!.id; await this.store(c, applicationId, file);
      return this.find(c, applicationId, candidateId);
    });
  }
  async replace(candidateId: string, id: string, file: CvFile) {
    return this.transaction(async c => {
      const [rows] = await c.execute<RowDataPacket[]>('SELECT status FROM applications WHERE id=? AND candidate_user_id=? FOR UPDATE', [id, candidateId]);
      if (!rows[0]) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'No se encontró la postulación.');
      if (rows[0].status !== 'PENDING') throw new AppError(409, 'CV_REPLACEMENT_UNAVAILABLE', 'Solo puedes reemplazar el CV mientras la postulación esté pendiente de evaluación.');
      await this.store(c, id, file);
      return this.find(c, id, candidateId);
    });
  }
}
