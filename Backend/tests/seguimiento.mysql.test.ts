import { afterAll,describe,expect,it } from 'vitest';
import request from 'supertest';
import { randomUUID,randomBytes } from 'node:crypto';
import type { ResultSetHeader } from 'mysql2/promise';
import { createApp } from '../src/app.js';
import { tokenHash } from '../src/modules/auth/services/password.js';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlSeguimientoRepository } from '../src/modules/seguimiento/persistence/mysql-seguimiento.repository.js';
import { MySqlSeleccionRepository } from '../src/modules/seleccion/persistence/mysql-seleccion.repository.js';
import { MySqlEvaluacionRepository } from '../src/modules/evaluacion/persistence/mysql-evaluacion.repository.js';
describe.skipIf(process.env.TEST_MYSQL!=='1')('M08: API M07→M08 con MariaDB',()=>{
 const pool=getMysqlPool(),auth=new MySqlAuthRepository(pool),users:string[]=[],jobs:string[]=[],applications:string[]=[],tokens:string[]=[];
 const app=createApp({checkConnection:async()=>{}},auth,undefined,undefined,undefined,undefined,new MySqlEvaluacionRepository(pool),undefined,new MySqlSeleccionRepository(pool),new MySqlSeguimientoRepository(pool));
 const insert=async(sql:string,args:string[])=>{const [r]=await pool.execute<ResultSetHeader>(sql,args);return String(r.insertId);};
 afterAll(async()=>{
  for(const token of tokens)await auth.deleteSession(tokenHash(token));
  for(const id of applications){await pool.execute('DELETE FROM recruitment_decisions WHERE application_id=?',[id]);await pool.execute('DELETE FROM application_status_events WHERE application_id=?',[id]);await pool.execute('DELETE FROM applications WHERE id=?',[id]);}
  for(const id of jobs)await pool.execute('DELETE FROM jobs WHERE id=?',[id]);
  for(const id of users){await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);}
  await pool.end();
 });
 it('refleja decisiones reales, pagina, aísla y oculta información privada',async()=>{
  for(const role of ['RECRUITER','CANDIDATE','CANDIDATE'] as const){
   const user=await auth.createUser({name:'Persona de prueba M08',email:randomUUID()+'@example.test',phone:null,role,kind:role==='RECRUITER'?'COMPANY':null,password_hash:'sin-login'});users.push(user.id);
   const token=randomBytes(32).toString('hex');tokens.push(token);await auth.createSession(tokenHash(token),user.id,new Date(Date.now()+60000));
  }
  const job=await insert("INSERT INTO jobs(owner_user_id,title,description,status) VALUES (?,?,?,'PUBLISHED')",[users[0]!,'Oferta M08 %_ '+randomUUID(),'Prueba sintética']);jobs.push(job);
  for(let i=0;i<22;i++)applications.push(await insert("INSERT INTO applications(job_id,candidate_user_id,status,submitted_at) VALUES (?,?,'PENDING',UTC_TIMESTAMP(3))",[job,users[1]!]));
  const id=applications[0]!,base='/api/v1/candidate/applications/',get=(path:string,actor=1)=>request(app).get(path).set('Cookie','qt_session='+tokens[actor]);
  let list=await get(base+'tracking');expect(list.body.total).toBe(22);expect(list.body.items).toHaveLength(20);
  const second=await get(base+'tracking?page=2');expect(second.body.items).toHaveLength(2);expect(new Set([...list.body.items,...second.body.items].map((a:{id:string})=>a.id)).size).toBe(22);
  expect((await get(base+'tracking?search=%25_')).body.total).toBe(22);expect((await get(base+'tracking?search=%27%20OR%201%3D1')).body.total).toBe(0);
  expect((await get(base+id+'/tracking',2)).status).toBe(404);expect((await get(base+'tracking',2)).body.items).toEqual([]);
  const decision=(state:string,expected_status:string)=>request(app).post('/api/v1/recruiter/applications/'+id+'/selection').set('Cookie','qt_session='+tokens[0]).set('X-Qori-Client','web').send({state,expected_status,confirmed:true,...(state==='ADVANCES'?{reason:'NOTA_INTERNA_M08'}:{})});
  expect((await decision('IN_REVIEW','PENDING')).status).toBe(200);
  let detail=await get(base+id+'/tracking');expect(detail.body.application.status).toBe('IN_REVIEW');expect(detail.body.history_complete).toBe(true);
  expect((await decision('ADVANCES','IN_REVIEW')).status).toBe(200);
  detail=await get(base+id+'/tracking');expect(detail.body.application).toMatchObject({status:'ADVANCES',final:true,can_replace_cv:false});
  expect(detail.body.history.map((e:{status:string})=>e.status)).toEqual(['IN_REVIEW','ADVANCES']);expect(detail.body.history_complete).toBe(true);
  expect(JSON.stringify(detail.body)).not.toContain('NOTA_INTERNA_M08');expect(JSON.stringify(detail.body)).not.toContain('actor');
  list=await get(base+'tracking?status=ADVANCES');expect(list.body.total).toBe(1);expect(list.body.items[0].id).toBe(id);
  await pool.execute("UPDATE jobs SET status='CLOSED',process_finished_at=UTC_TIMESTAMP(3) WHERE id=?",[job]);
  const pending=await get(base+applications[1]+'/tracking');expect(pending.body.application.status).toBe('PENDING');expect(pending.body.application.final).toBe(false);expect(pending.body.application.process_finished_at).not.toBeNull();
 },20000);
});
