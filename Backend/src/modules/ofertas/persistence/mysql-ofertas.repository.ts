import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { Job, JobChange, JobFilter, JobInput, JobScope, OfertasRepository } from '../repositories/ofertas.repository.js';

const columns = `SELECT CAST(id AS CHAR) AS id, CAST(owner_user_id AS CHAR) AS owner_user_id,
 title, description, area, location, experience_required, education_required, status,
 published_at, closed_at, created_at, updated_at FROM jobs`;
const iso = (value: Date | string | null): string | null => value === null ? null : new Date(value).toISOString();
function scopeWhere(scope: JobScope) {
  if (scope.ownerId) return { sql: 'owner_user_id=?', values: [scope.ownerId] };
  if (scope.publishedOnly) return { sql: "status='PUBLISHED'", values: [] as string[] };
  throw new Error('Se requiere un alcance de consulta.');
}
async function hydrate(connection: PoolConnection, rows: RowDataPacket[]): Promise<Job[]> {
  if (!rows.length) return [];
  const [requirements] = await connection.execute<RowDataPacket[]>(
    `SELECT CAST(job_id AS CHAR) AS job_id, description FROM job_requirements WHERE job_id IN (${rows.map(() => '?').join(',')}) ORDER BY job_id, sort_order, id`,
    rows.map(row => row.id),
  );
  return rows.map(row => ({
    id: row.id, owner_user_id: row.owner_user_id, title: row.title, description: row.description,
    area: row.area, location: row.location, experience_required: row.experience_required, education_required: row.education_required,
    status: row.status, published_at: iso(row.published_at), closed_at: iso(row.closed_at),
    created_at: iso(row.created_at)!, updated_at: iso(row.updated_at)!,
    requirements: requirements.filter(item => item.job_id === row.id).map(item => ({ description: item.description })),
  }));
}
async function replaceRequirements(connection: PoolConnection, id: string, fields: JobInput) {
  await connection.execute('DELETE FROM job_requirements WHERE job_id=?', [id]);
  for (const [index, requirement] of fields.requirements.entries()) {
    await connection.execute('INSERT INTO job_requirements (job_id,description,sort_order) VALUES (?,?,?)', [id, requirement.description, index]);
  }
}
export class MySqlOfertasRepository implements OfertasRepository {
  constructor(private pool: Pool) {}
  private async transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  }
  async list(scope: JobScope, filter: JobFilter) {
    return this.transaction(async connection => {
      const where = scopeWhere(scope);
      if (filter.status) { where.sql += ' AND status=?'; where.values.push(filter.status); }
      if (filter.q) {
        where.sql += ' AND (LOCATE(?,title)>0 OR LOCATE(?,description)>0 OR LOCATE(?,location)>0 OR CAST(id AS CHAR)=?)';
        where.values.push(filter.q, filter.q, filter.q, filter.q.replace(/^QT-/i, ''));
      }
      const [counts] = await connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM jobs WHERE ${where.sql}`, where.values);
      const [rows] = await connection.execute<RowDataPacket[]>(
        `${columns} WHERE ${where.sql} ORDER BY ${scope.publishedOnly ? 'published_at' : 'created_at'} DESC, id DESC LIMIT ? OFFSET ?`,
        [...where.values, filter.page_size, (filter.page - 1) * filter.page_size],
      );
      return { items: await hydrate(connection, rows), total: Number(counts[0]!.total), page: filter.page, page_size: filter.page_size };
    });
  }
  async find(id: string, scope: JobScope) {
    return this.transaction(async connection => {
      const where = scopeWhere(scope);
      const [rows] = await connection.execute<RowDataPacket[]>(`${columns} WHERE id=? AND ${where.sql}`, [id, ...where.values]);
      return (await hydrate(connection, rows))[0] ?? null;
    });
  }
  async create(ownerId: string, fields: JobInput) {
    return this.transaction(async connection => {
      await connection.execute(`INSERT INTO jobs (owner_user_id,title,description,area,location,experience_required,education_required,status) VALUES (?,?,?,?,?,?,?,'DRAFT')`,
        [ownerId, fields.title, fields.description, fields.area, fields.location, fields.experience_required, fields.education_required]);
      // CAST evita perder precisión de BIGINT en el identificador.
      const [inserted] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
      const id = inserted[0]!.id as string;
      await replaceRequirements(connection, id, fields);
      const [rows] = await connection.execute<RowDataPacket[]>(`${columns} WHERE id=?`, [id]);
      return (await hydrate(connection, rows))[0]!;
    });
  }
  async changeOwned(id: string, ownerId: string, decide: (current: Job) => JobChange) {
    return this.transaction(async connection => {
      const [rows] = await connection.execute<RowDataPacket[]>(`${columns} WHERE id=? AND owner_user_id=? FOR UPDATE`, [id, ownerId]);
      const current = (await hydrate(connection, rows))[0];
      if (!current) return null;
      const change = decide(current);
      if (change.fields) {
        const fields = change.fields;
        await connection.execute<ResultSetHeader>(`UPDATE jobs SET title=?,description=?,area=?,location=?,experience_required=?,education_required=? WHERE id=? AND owner_user_id=?`,
          [fields.title, fields.description, fields.area, fields.location, fields.experience_required, fields.education_required, id, ownerId]);
        await replaceRequirements(connection, id, fields);
      }
      if (change.state) {
        await connection.execute('UPDATE jobs SET status=?,published_at=?,closed_at=? WHERE id=? AND owner_user_id=?',
          [change.state.status, change.state.published_at ? new Date(change.state.published_at) : null, change.state.closed_at ? new Date(change.state.closed_at) : null, id, ownerId]);
      }
      const [updated] = await connection.execute<RowDataPacket[]>(`${columns} WHERE id=? AND owner_user_id=?`, [id, ownerId]);
      return (await hydrate(connection, updated))[0]!;
    });
  }
}
