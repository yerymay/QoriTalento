import type { Pool,PoolConnection,RowDataPacket } from 'mysql2/promise';
import type { SeguimientoRepository,TrackingRecord,TrackingEvent,TrackingQuery } from '../repositories/seguimiento.repository.js';
const select=`SELECT CAST(a.id AS CHAR) id,CAST(j.id AS CHAR) job_id,j.title,a.status,j.status job_status,
  COALESCE(a.submitted_at,a.created_at) registered_at,j.process_finished_at,
  (SELECT d.original_filename FROM cv_documents d WHERE d.application_id=a.id ORDER BY d.id DESC LIMIT 1) filename,
  e.next_state last_event_state,e.created_at last_event_at
  FROM applications a JOIN jobs j ON j.id=a.job_id
  LEFT JOIN application_status_events e ON e.id=(SELECT MAX(e2.id) FROM application_status_events e2 WHERE e2.application_id=a.id)`;
const iso=(v:Date|string|null)=>v?new Date(v).toISOString():null;
const map=(r:RowDataPacket):TrackingRecord=>({id:r.id,job_id:r.job_id,title:r.title,status:r.status,job_status:r.job_status,
  registered_at:iso(r.registered_at)!,process_finished_at:iso(r.process_finished_at),filename:r.filename??null,
  last_event_state:r.last_event_state??null,last_event_at:iso(r.last_event_at)});
export class MySqlSeguimientoRepository implements SeguimientoRepository {
  constructor(private pool:Pool){}
  private async snapshot<T>(read:(c:PoolConnection)=>Promise<T>){const c=await this.pool.getConnection();try{
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await c.beginTransaction();
    const result=await read(c);await c.commit();return result;
  }catch(e){await c.rollback();throw e;}finally{c.release();}}
  list(candidateId:string,q:TrackingQuery){return this.snapshot(async c=>{
    const where=" WHERE a.candidate_user_id=? AND (?='' OR LOCATE(?,j.title)>0)"+(q.status?' AND a.status=?':'');
    const args:string[]=[candidateId,q.search,q.search];if(q.status)args.push(q.status);
    const [count]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) total FROM applications a JOIN jobs j ON j.id=a.job_id'+where,args);
    const [rows]=await c.execute<RowDataPacket[]>(select+where+` ORDER BY a.created_at DESC,a.id DESC LIMIT ${q.page_size} OFFSET ${(q.page-1)*q.page_size}`,args);
    return {items:rows.map(map),total:Number(count[0]!.total)};
  });}
  read(candidateId:string,id:string){return this.snapshot(async c=>{
    const [rows]=await c.execute<RowDataPacket[]>(select+' WHERE a.id=? AND a.candidate_user_id=?',[id,candidateId]);
    if(!rows[0])return null;
    const [events]=await c.execute<RowDataPacket[]>('SELECT previous_state,next_state,created_at FROM application_status_events WHERE application_id=? ORDER BY id',[id]);
    const history:TrackingEvent[]=events.map(e=>({previous_state:e.previous_state,next_state:e.next_state,at:iso(e.created_at)!}));
    return {application:map(rows[0]),events:history};
  });}
}
