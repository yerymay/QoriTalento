import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlOfertasRepository } from '../src/modules/ofertas/persistence/mysql-ofertas.repository.js';

describe.skipIf(process.env.TEST_MYSQL !== '1')('Conteo y eliminación de ofertas con MySQL', () => {
  const pool = getMysqlPool(), auth = new MySqlAuthRepository(pool), jobs = new MySqlOfertasRepository(pool);
  const users: string[] = [];
  let jobId: string | undefined;
  afterAll(async () => {
    if (jobId) {
      await pool.execute('DELETE FROM applications WHERE job_id=?', [jobId]);
      await pool.execute('DELETE FROM exams WHERE job_id=?', [jobId]);
      await pool.execute('DELETE FROM job_moderation_reviews WHERE job_id=?', [jobId]);
      await pool.execute('DELETE FROM job_requirements WHERE job_id=?', [jobId]);
      await pool.execute('DELETE FROM jobs WHERE id=?', [jobId]);
    }
    for (const id of users) {
      await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?', [id]);
      await pool.execute('DELETE FROM users WHERE id=?', [id]);
    }
    await pool.end();
  });
  it('cuenta personas distintas y protege registros asociados antes de eliminar', async () => {
    for (const role of ['RECRUITER','CANDIDATE'] as const) {
      const user = await auth.createUser({name:'Prueba sintética', email:`oferta-${randomUUID()}@example.test`, phone:null, password_hash:'fixture', role, kind:role==='RECRUITER'?'COMPANY':null});
      users.push(user.id);
    }
    const job = await jobs.create(users[0], {title:'Oferta sintética',description:'',area:null,location:null,experience_required:null,education_required:null,requirements:[{description:'Requisito'}]});
    jobId=job.id;
    await pool.execute("INSERT INTO applications (job_id,candidate_user_id,status) VALUES (?,?,'PENDING'),(?,?,'NOT_ADVANCES')",[jobId,users[1],jobId,users[1]]);
    const page = await jobs.list({ownerId:users[0]}, {q:'',page:1,page_size:20});
    expect(page.items.find(item => item.id===jobId)?.applicant_count).toBe(1);
    expect(await jobs.deleteOwned(jobId, users[1])).toBe(false);
    await expect(jobs.deleteOwned(jobId,users[0])).rejects.toMatchObject({code:'JOB_HAS_RECORDS'});
    expect((await jobs.find(jobId,{ownerId:users[0]}))?.requirements).toHaveLength(1);
    await pool.execute('DELETE FROM applications WHERE job_id=?',[jobId]);
    await pool.execute("INSERT INTO exams (job_id,title,time_limit_seconds,status) VALUES (?,'Prueba',60,'DRAFT')",[jobId]);
    await expect(jobs.deleteOwned(jobId,users[0])).rejects.toMatchObject({code:'JOB_HAS_RECORDS'});
    await pool.execute('DELETE FROM exams WHERE job_id=?',[jobId]);
    await pool.execute("INSERT INTO job_moderation_reviews (job_id,review_status) VALUES (?,'PENDING')",[jobId]);
    await expect(jobs.deleteOwned(jobId,users[0])).rejects.toMatchObject({code:'JOB_HAS_RECORDS'});
    await pool.execute('DELETE FROM job_moderation_reviews WHERE job_id=?',[jobId]);
    expect(await jobs.deleteOwned(jobId,users[0])).toBe(true);
    expect(await jobs.find(jobId,{ownerId:users[0]})).toBeNull();
  });
});
