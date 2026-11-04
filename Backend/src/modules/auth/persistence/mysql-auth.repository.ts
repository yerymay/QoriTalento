import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthRepository, NewUser, Profile, User } from '../repositories/auth.repository.js';
import { AppError } from '../../../shared/errors.js';
const select = `SELECT CAST(u.id AS CHAR) AS id, u.full_name AS name, u.email_normalized AS email,
 u.phone, u.role, u.account_state, u.password_hash, u.email_verified_at,
 r.recruiter_kind AS kind, r.phone_verified_at FROM users u LEFT JOIN recruiter_profiles r ON r.user_id=u.id`;
function map(row: RowDataPacket): User {
  return {id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role,
    account_state: row.account_state, password_hash: row.password_hash, kind: row.kind ?? null,
    email_verified: !!row.email_verified_at, phone_verified: !!row.phone_verified_at};
}
function translate(error: unknown): never {
  if ((error as {code?: string}).code === 'ER_DUP_ENTRY') throw new AppError(409, 'EMAIL_IN_USE', 'Ese correo ya está registrado. Usa otro o inicia sesión.');
  throw error;
}
export class MySqlAuthRepository implements AuthRepository {
  constructor(private pool: Pool) {}
  private async userById(connection: PoolConnection, id: string) {
    const [rows] = await connection.execute<RowDataPacket[]>(`${select} WHERE u.id=?`, [id]);
    if (!rows[0]) throw new AppError(401, 'UNAUTHENTICATED', 'La cuenta ya no está disponible.');
    return map(rows[0]);
  }
  async findByEmail(email: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>(`${select} WHERE u.email_normalized=?`, [email]);
    return rows[0] ? map(rows[0]) : null;
  }
  async createUser(user: NewUser) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO users (full_name,email_normalized,password_hash,role,phone) VALUES (?,?,?,?,?)',
        [user.name,user.email,user.password_hash,user.role,user.phone]);
      const id = String(result.insertId);
      if (user.role === 'RECRUITER') await connection.execute('INSERT INTO recruiter_profiles (user_id,recruiter_kind) VALUES (?,?)',[id,user.kind]);
      const created = await this.userById(connection,id);
      await connection.commit(); return created;
    } catch(error) { await connection.rollback(); return translate(error); }
    finally { connection.release(); }
  }
  async createSession(hash: string, id: string, expires: Date) {
    await this.pool.execute('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)',[hash,id,expires]);
  }
  async findSession(hash: string, now: Date) {
    const [rows] = await this.pool.execute<RowDataPacket[]>(`${select} INNER JOIN auth_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?`,[hash,now]);
    if (!rows[0]) return null;
    const [sessions] = await this.pool.execute<RowDataPacket[]>('SELECT expires_at FROM auth_sessions WHERE token_hash=? AND expires_at>?',[hash,now]);
    return sessions[0] ? { user: map(rows[0]), expires_at: new Date(sessions[0].expires_at) } : null;
  }
  async touchSession(hash: string, now: Date, expires: Date) {
    const [result] = await this.pool.execute<ResultSetHeader>('UPDATE auth_sessions SET expires_at=? WHERE token_hash=? AND expires_at>?',[expires,hash,now]);
    return result.affectedRows === 1;
  }
  async deleteSession(hash: string) { await this.pool.execute('DELETE FROM auth_sessions WHERE token_hash=?',[hash]); }
  async updateProfile(id: string, profile: Profile) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[id]);
      const previous = await this.userById(connection,id);
      const emailChanged = previous.email !== profile.email;
      const phoneChanged = previous.kind === 'INDIVIDUAL' && previous.phone !== profile.phone;
      await connection.execute(`UPDATE users SET full_name=?,email_normalized=?,phone=?,
        email_verified_at=IF(?,NULL,email_verified_at),account_state=IF(?,'PENDING_VERIFICATION',account_state) WHERE id=?`,
        [profile.name,profile.email,profile.phone,emailChanged,emailChanged || phoneChanged,id]);
      if (phoneChanged) await connection.execute('UPDATE recruiter_profiles SET phone_verified_at=NULL WHERE user_id=?',[id]);
      if (emailChanged || phoneChanged) await connection.execute('DELETE FROM auth_sessions WHERE user_id=?',[id]);
      const user = await this.userById(connection,id);
      await connection.commit(); return user;
    } catch(error) { await connection.rollback(); return translate(error); }
    finally { connection.release(); }
  }
}
