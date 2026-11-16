import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlExamenesRepository } from '../src/modules/examenes/persistence/mysql-examenes.repository.js';
import { ExamenesService } from '../src/modules/examenes/services/examenes.service.js';
describe.skipIf(process.env.TEST_MYSQL!=='1')('M05 con MySQL real y datos sintéticos',()=>{
  const pool=getMysqlPool(),auth=new MySqlAuthRepository(pool),repo=new MySqlExamenesRepository(pool),service=new ExamenesService(repo);
  const users:string[]=[],jobs:string[]=[],applications:string[]=[],exams:string[]=[];
  const lastId=async()=>{const [rows]=await pool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id FROM jobs WHERE title=? ORDER BY id DESC LIMIT 1',[marker]);return rows[0]!.id as string;};
  const marker='M05-test-'+randomUUID();
  afterAll(async()=>{
    for(const id of exams){
      await pool.execute('DELETE a FROM exam_answers a JOIN exam_attempts t ON t.id=a.attempt_id WHERE t.exam_id=?',[id]);
      await pool.execute('DELETE FROM exam_attempts WHERE exam_id=?',[id]);
      await pool.execute('DELETE o FROM exam_options o JOIN exam_questions q ON q.id=o.question_id WHERE q.exam_id=?',[id]);
      await pool.execute('DELETE FROM exam_questions WHERE exam_id=?',[id]);await pool.execute('DELETE FROM exams WHERE id=?',[id]);
    }
    for(const id of applications)await pool.execute('DELETE FROM applications WHERE id=?',[id]);
    for(const id of jobs)await pool.execute('DELETE FROM jobs WHERE id=?',[id]);
    for(const id of users){await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);}
    await pool.end();
  });
  it('persiste, aísla, serializa inicios y respuestas, revierte fallos y conserva al vencer',async()=>{
    for(const role of ['RECRUITER','CANDIDATE','CANDIDATE','RECRUITER'] as const){
      const user=await auth.createUser({name:'Prueba sintética M05',email:randomUUID()+'@example.test',phone:null,role,kind:role==='RECRUITER'?'COMPANY':null,password_hash:'sin-login'});users.push(user.id);
    }
    const owner={id:users[0]!,role:'RECRUITER' as const},candidate={id:users[1]!,role:'CANDIDATE' as const};
    await pool.execute("INSERT INTO jobs (owner_user_id,title,description,status) VALUES (?,?,?,'PUBLISHED')",[owner.id,marker,'Vacante sintética']);
    const job=await lastId();jobs.push(job);
    await pool.execute("INSERT INTO applications (job_id,candidate_user_id,status) VALUES (?,?,'PENDING')",[job,candidate.id]);
    const [rows]=await pool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id FROM applications WHERE job_id=? AND candidate_user_id=?',[job,candidate.id]);applications.push(rows[0]!.id);
    const input={title:'TypeScript y SQL',time_limit_minutes:2,questions:[{text:'¿Qué evita una inyección SQL?',options:[{text:'Parámetros',is_correct:true},{text:'Concatenación',is_correct:false}]}]};
    const exam=await service.create(owner,job,input);exams.push(exam.id);
    await expect(service.detail({id:users[3]!,role:'RECRUITER'},exam.id)).rejects.toMatchObject({status:404});
    await expect(repo.changeOwned(owner.id,exam.id,()=>({input:{...input,title:'Debe revertirse',questions:[{...input.questions[0]!,text:null as unknown as string}]}}))).rejects.toBeTruthy();
    expect((await service.detail(owner,exam.id)).title).toBe(input.title);
    await service.publish(owner,exam.id,{});
    const starts=await Promise.all([service.start(candidate,exam.id,{application_id:applications[0]}),service.start(candidate,exam.id,{application_id:applications[0]})]);
    expect(starts[0]!.attempt.id).toBe(starts[1]!.attempt.id);
    const attempt=starts[0]!.attempt,question=starts[0]!.exam.questions[0]!;
    expect(JSON.stringify(starts)).not.toContain('is_correct');
    const [counts]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) n FROM exam_attempts WHERE exam_id=?',[exam.id]);expect(Number(counts[0]!.n)).toBe(1);
    await expect(service.read({id:users[2]!,role:'CANDIDATE'},attempt.id)).rejects.toMatchObject({status:404});
    const results=await Promise.allSettled(question.options.map(o=>service.answer(candidate,attempt.id,question.id,{option_id:o.id,client_revision:1})));
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    const read=await service.read(candidate,attempt.id);expect(read.attempt.answers).toHaveLength(1);
    const original=read.attempt.answers[0]!;
    await pool.execute('UPDATE exam_attempts SET deadline_at_utc=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE id=?',[attempt.id]);
    await expect(service.answer(candidate,attempt.id,question.id,{option_id:question.options[0]!.id,client_revision:2})).rejects.toMatchObject({code:'ATTEMPT_CLOSED'});
    const expired=await service.read(candidate,attempt.id);expect(expired.attempt.status).toBe('EXPIRED');expect(expired.attempt.answers[0]).toEqual(original);expect(expired.attempt.finished_at_utc).toBe(expired.attempt.deadline_at_utc);
    expect((await service.start(candidate,exam.id,{application_id:applications[0]})).attempt.id).toBe(attempt.id);
    await expect(service.update(owner,exam.id,input)).rejects.toMatchObject({code:'EXAM_IMMUTABLE'});
    expect((await service.available(candidate)).items[0]!.status).toBe('EXPIRED');
  },20000);
});
