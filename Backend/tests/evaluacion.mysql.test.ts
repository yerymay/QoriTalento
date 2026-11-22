import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlEvaluacionRepository } from '../src/modules/evaluacion/persistence/mysql-evaluacion.repository.js';
import { MySqlExamenesRepository } from '../src/modules/examenes/persistence/mysql-examenes.repository.js';
import { ExamenesService } from '../src/modules/examenes/services/examenes.service.js';
import { EvaluacionService } from '../src/modules/evaluacion/services/evaluacion.service.js';
import { fixture, FakeAssistant } from './evaluacion.fake.js';

describe.skipIf(process.env.TEST_MYSQL!=='1')('M06 con MySQL y datos sintéticos',()=>{
  const pool=getMysqlPool(),auth=new MySqlAuthRepository(pool),repo=new MySqlEvaluacionRepository(pool);
  const assistant=new FakeAssistant(),service=new EvaluacionService(repo,assistant);
  const exams=new ExamenesService(new MySqlExamenesRepository(pool));
  const users:string[]=[],jobs:string[]=[],applications:string[]=[],examIds:string[]=[];
  const insert=async(sql:string,args:(string|null)[])=>{const [r]=await pool.execute<ResultSetHeader>(sql,args);return String(r.insertId);};
  afterAll(async()=>{
    for(const id of applications){
      await pool.execute('DELETE FROM m06_evaluation_revisions WHERE application_id=?',[id]);
      await pool.execute('DELETE g FROM exam_grades g JOIN exam_attempts t ON t.id=g.attempt_id WHERE t.application_id=?',[id]);
      await pool.execute('DELETE a FROM exam_answers a JOIN exam_attempts t ON t.id=a.attempt_id WHERE t.application_id=?',[id]);
      await pool.execute('DELETE FROM exam_attempts WHERE application_id=?',[id]);
      await pool.execute('DELETE FROM application_profile_snapshots WHERE application_id=?',[id]);
      await pool.execute('DELETE FROM applications WHERE id=?',[id]);
    }
    for(const id of examIds){
      await pool.execute('DELETE o FROM exam_options o JOIN exam_questions q ON q.id=o.question_id WHERE q.exam_id=?',[id]);
      await pool.execute('DELETE FROM exam_questions WHERE exam_id=?',[id]);await pool.execute('DELETE FROM exams WHERE id=?',[id]);
    }
    for(const id of jobs){await pool.execute('DELETE FROM job_requirements WHERE job_id=?',[id]);await pool.execute('DELETE FROM jobs WHERE id=?',[id]);}
    for(const id of users){
      await pool.execute('DELETE FROM candidate_profile_versions WHERE candidate_user_id=?',[id]);
      await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);
    }
    await pool.end();
  });
  it('califica M05, conserva versiones de M04, aísla propietarios y serializa revisiones',async()=>{
    for(const role of ['RECRUITER','CANDIDATE','RECRUITER'] as const){
      const user=await auth.createUser({name:'Fixture M06',email:randomUUID()+'@example.test',phone:null,role,kind:role==='RECRUITER'?'COMPANY':null,password_hash:'sin-login'});users.push(user.id);
    }
    const owner={id:users[0]!,role:'RECRUITER' as const},candidate={id:users[1]!,role:'CANDIDATE' as const};
    const job=await insert("INSERT INTO jobs (owner_user_id,title,description,status,experience_required) VALUES (?,?,?,'PUBLISHED',?)",[owner.id,'M06-'+randomUUID(),'Vacante sintética','Desarrollo web']);jobs.push(job);
    const req=await insert('INSERT INTO job_requirements (job_id,description) VALUES (?,?)',[job,'TypeScript']);
    const app=await insert("INSERT INTO applications (job_id,candidate_user_id,status) VALUES (?,?,'PENDING')",[job,candidate.id]);applications.push(app);
    await expect(service.prepare(owner,app,{})).rejects.toMatchObject({code:'PROFILE_UNCONFIRMED'});
    const profile=fixture().confirmed!.profile;
    const version=await insert('INSERT INTO candidate_profile_versions (candidate_user_id,data_json,confirmed_at) VALUES (?,?,UTC_TIMESTAMP(3))',[candidate.id,JSON.stringify(profile)]);
    await pool.execute('INSERT INTO application_profile_snapshots (application_id,profile_version_id) VALUES (?,?)',[app,version]);
    const exam=await exams.create(owner,job,{title:'Objetivo',time_limit_minutes:2,questions:[{text:'Dato',options:[{text:'Correcta',is_correct:true},{text:'Incorrecta',is_correct:false}]}]});examIds.push(exam.id);
    await exams.publish(owner,exam.id,{});const attempt=await exams.start(candidate,exam.id,{application_id:app});
    await exams.answer(candidate,attempt.attempt.id,attempt.exam.questions[0]!.id,{option_id:attempt.exam.questions[0]!.options[0]!.id,client_revision:1});
    await exams.submit(candidate,attempt.attempt.id,{});
    const prepared=await Promise.all([service.prepare(owner,app,{}),service.prepare(owner,app,{})]);
    expect(prepared[0]!.evaluation!.revision).toBe(1);expect(prepared[1]!.evaluation!.revision).toBe(1);
    expect(prepared[0]!.grades[0]).toMatchObject({correct:1,total:1});expect(prepared[0]!.exam_points).toBe(40);
    const [grades]=await pool.execute<RowDataPacket[]>('SELECT score FROM exam_grades WHERE attempt_id=?',[attempt.attempt.id]);expect(grades).toHaveLength(1);expect(Number(grades[0]!.score)).toBe(100);
    await expect(service.read({id:users[2]!,role:'RECRUITER'},app)).rejects.toMatchObject({status:404});
    const body={revision:1,criteria:prepared[0]!.evaluation!.criteria.map(c=>({id:c.id,weight:c.weight,review:{rating:'MEETS',source_refs:[c.id==='requirement:'+req?'skills:0':'experience:0'],explanation:'Evidencia revisada.'}}))};
    const results=await Promise.allSettled([service.review(owner,app,body),service.review(owner,app,body)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    expect((await service.read(owner,app)).total).toBe(100);
    const [history]=await pool.execute<RowDataPacket[]>('SELECT revision,actor_user_id FROM m06_evaluation_revisions WHERE application_id=? ORDER BY revision',[app]);
    expect(history.map(r=>r.revision)).toEqual([1,2]);expect(String(history[1]!.actor_user_id)).toBe(owner.id);
    await expect(repo.change(owner.id,app,()=>{throw new Error('Revertir');})).rejects.toThrow('Revertir');
    expect((await service.read(owner,app)).evaluation!.revision).toBe(2);
    const next=await insert('INSERT INTO candidate_profile_versions (candidate_user_id,data_json,confirmed_at) VALUES (?,?,UTC_TIMESTAMP(3))',[candidate.id,JSON.stringify({...profile,skills:['SQL']})]);
    // Un perfil confirmado en otra postulación no sustituye la instantánea de esta.
    expect((await service.read(owner,app)).stale).toBe(false);
    await pool.execute('INSERT INTO application_profile_snapshots (application_id,profile_version_id) VALUES (?,?)',[app,next]);
    const stale=await service.read(owner,app);expect(stale.stale).toBe(true);expect(stale.total).toBeNull();
    expect(stale.evaluation!.profile_version_id).toBe(version);
    await expect(service.assist(owner,app,{revision:2})).rejects.toMatchObject({code:'EVALUATION_STALE'});
  },20000);
});
