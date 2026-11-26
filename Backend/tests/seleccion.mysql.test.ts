import { afterAll,describe,expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlSeleccionRepository } from '../src/modules/seleccion/persistence/mysql-seleccion.repository.js';
import { MySqlEvaluacionRepository } from '../src/modules/evaluacion/persistence/mysql-evaluacion.repository.js';
import { SeleccionService } from '../src/modules/seleccion/services/seleccion.service.js';
describe.skipIf(process.env.TEST_MYSQL!=='1')('M07 persistencia MySQL',()=>{
  const pool=getMysqlPool(),repo=new MySqlSeleccionRepository(pool),service=new SeleccionService(repo,new MySqlEvaluacionRepository(pool)),auth=new MySqlAuthRepository(pool);
  const users:string[]=[],jobs:string[]=[],apps:string[]=[];
  const insert=async(sql:string,args:string[])=>{const [r]=await pool.execute<ResultSetHeader>(sql,args);return String(r.insertId);};
  afterAll(async()=>{
    for(const id of apps){await pool.execute('DELETE FROM recruitment_decisions WHERE application_id=?',[id]);await pool.execute('DELETE FROM application_status_events WHERE application_id=?',[id]);await pool.execute('DELETE FROM applications WHERE id=?',[id]);}
    for(const id of jobs)await pool.execute('DELETE FROM jobs WHERE id=?',[id]);
    for(const id of users){await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);}
    await pool.end();
  });
  it('aísla propietarios, filtra literalmente y guarda estado/decisión/historial atómicos',async()=>{
    for(const role of ['RECRUITER','RECRUITER','CANDIDATE'] as const){const u=await auth.createUser({name:role==='CANDIDATE'?'Persona M07 %_':'Reclutador M07',email:randomUUID()+'@example.test',phone:null,role,kind:role==='RECRUITER'?'COMPANY':null,password_hash:'sin-login'});users.push(u.id);}
    const actor={id:users[0]!,role:'RECRUITER' as const};
    const job=await insert("INSERT INTO jobs(owner_user_id,title,description,status) VALUES (?,?,?,'PUBLISHED')",[actor.id,'Oferta M07 '+randomUUID(),'Prueba sintética']);jobs.push(job);
    const id=await insert("INSERT INTO applications(job_id,candidate_user_id,status,submitted_at) VALUES (?,?,'PENDING',UTC_TIMESTAMP(3))",[job,users[2]!]);apps.push(id);
    expect((await service.list(actor,job,{search:'%_'})).total).toBe(1);expect((await service.list(actor,job,{search:"' OR 1=1"})).total).toBe(0);
    await expect(service.detail({id:users[1]!,role:'RECRUITER'},id)).rejects.toMatchObject({status:404});
    await expect(repo.change(actor.id,id,()=>{throw new Error('Revertir');})).rejects.toThrow('Revertir');expect((await repo.read(actor.id,id))!.history).toHaveLength(0);
    await service.decide(actor,id,{state:'IN_REVIEW',expected_status:'PENDING',confirmed:true});
    const results=await Promise.allSettled(['ADVANCES','NOT_ADVANCES'].map(state=>service.decide(actor,id,{state,expected_status:'IN_REVIEW',confirmed:true,reason:'Revisión humana'})));
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    const detail=await service.detail(actor,id);expect(detail.allowed_actions).toEqual([]);expect(detail.history).toHaveLength(2);expect(detail.record.decision!.actor_id).toBe(actor.id);expect(detail.record.decision!.state).toBe(detail.record.status);
    const [rows]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) total FROM recruitment_decisions WHERE application_id=?',[id]);expect(Number(rows[0]!.total)).toBe(1);
    await expect(service.decide(actor,id,{state:'IN_REVIEW',expected_status:detail.record.status,confirmed:true})).rejects.toMatchObject({status:409});
  },20000);
});
