import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlOfertasRepository } from '../src/modules/ofertas/persistence/mysql-ofertas.repository.js';
import { MySqlPostulacionesRepository } from '../src/modules/postulaciones/persistence/mysql-postulaciones.repository.js';

describe.skipIf(process.env.TEST_MYSQL !== '1')('M03 con MySQL real', () => {
  const pool = getMysqlPool(), auth = new MySqlAuthRepository(pool), jobs = new MySqlOfertasRepository(pool), repo = new MySqlPostulacionesRepository(pool);
  const users:string[] = [], jobIds:string[] = [], appIds:string[] = [];
  afterAll(async () => {
    for (const id of appIds) {
      await pool.execute('DELETE d FROM cv_private_data d JOIN cv_documents c ON c.id=d.cv_document_id WHERE c.application_id=?', [id]);
      await pool.execute('DELETE FROM cv_documents WHERE application_id=?', [id]);
      await pool.execute('DELETE FROM applications WHERE id=?', [id]);
    }
    for (const id of jobIds) { await pool.execute('DELETE FROM job_requirements WHERE job_id=?', [id]); await pool.execute('DELETE FROM jobs WHERE id=?', [id]); }
    for (const id of users) { await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]); await pool.execute('DELETE FROM users WHERE id=?',[id]); }
    await pool.end();
  });
  it('persiste y aísla CV, rechaza duplicados concurrentes y respeta cierre', async () => {
    for (const role of ['RECRUITER','CANDIDATE','CANDIDATE'] as const) {
      const user=await auth.createUser({name:'Prueba sintética M03',email:'m03-'+randomUUID()+'@example.test',phone:null,password_hash:'sin-login',role,kind:role==='RECRUITER'?'COMPANY':null});
      users.push(user.id);
    }
    const job=await jobs.create(users[0]!,{title:'Vacante sintética M03',description:'Prueba',area:null,location:null,experience_required:null,education_required:null,requirements:[{description:'Prueba'}]});
    jobIds.push(job.id);
    await jobs.changeOwned(job.id, users[0]!, () => ({state:{status:'PUBLISHED',published_at:new Date().toISOString(),closed_at:null}}));
    const file={bytes:Buffer.from('%PDF-test'),filename:'cv.pdf',sha256:'a'.repeat(64)};
    const results=await Promise.allSettled([repo.create(users[1]!,job.id,file),repo.create(users[1]!,job.id,file)]);
    const created=results.find(x=>x.status==='fulfilled'); if (!created || created.status!=='fulfilled') throw new Error('No se creó la postulación sintética');
    appIds.push(created.value.id);
    expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);
    expect(results.filter(x=>x.status==='rejected')).toHaveLength(1);
    expect((await repo.list(users[1]!)).map(x=>x.id)).toContain(created.value.id);
    expect((await repo.list(users[2]!)).map(x=>x.id)).not.toContain(created.value.id);
    await expect(repo.replace(users[2]!,created.value.id,file)).rejects.toMatchObject({status:404});
    await repo.replace(users[1]!,created.value.id,{...file,filename:'nuevo.pdf'});
    const [data]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS n FROM cv_private_data d JOIN cv_documents c ON c.id=d.cv_document_id WHERE c.application_id=?',[created.value.id]);
    expect(Number(data[0]!.n)).toBe(2);
    await jobs.changeOwned(job.id, users[0]!, () => ({state:{status:'CLOSED',published_at:new Date().toISOString(),closed_at:new Date().toISOString()}}));
    await expect(repo.create(users[2]!,job.id,file)).rejects.toMatchObject({status:404});
    await expect(repo.finish(users[2]!,job.id)).rejects.toMatchObject({status:404});
    const finished=await repo.finish(users[0]!,job.id);
    expect(new Date(finished.finished_at).getTime()).toBeGreaterThan(0);
    expect((await repo.finish(users[0]!,job.id)).finished_at).toBe(finished.finished_at);
  });
});
