import type { Pool,PoolConnection,RowDataPacket } from 'mysql2/promise';
import type { SeleccionRepository,SelectionRecord,SelectionQuery,SelectionChange,SelectionEvent } from '../repositories/seleccion.repository.js';
const select=`SELECT CAST(a.id AS CHAR) id,CAST(j.id AS CHAR) job_id,j.title job_title,u.full_name name,u.email_normalized email,
  a.status,a.submitted_at,j.process_finished_at,
  d.decision,d.reason,CAST(d.actor_user_id AS CHAR) actor_id,actor.full_name actor_name,d.decided_at_utc
  FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_user_id
  LEFT JOIN recruitment_decisions d ON d.id=(SELECT MAX(d2.id) FROM recruitment_decisions d2 WHERE d2.application_id=a.id)
  LEFT JOIN users actor ON actor.id=d.actor_user_id`;
const iso=(v:Date|string|null)=>v?new Date(v).toISOString():null;
const map=(r:RowDataPacket):SelectionRecord=>({id:r.id,job_id:r.job_id,job_title:r.job_title,name:r.name,email:r.email,status:r.status,
  submitted_at:iso(r.submitted_at),process_finished:!!r.process_finished_at,
  decision:r.decision?{state:r.decision,reason:r.reason,actor_id:r.actor_id,actor_name:r.actor_name,at:iso(r.decided_at_utc)!}:null});
export class MySqlSeleccionRepository implements SeleccionRepository {
  constructor(private pool:Pool){}
  private async transaction<T>(work:(c:PoolConnection)=>Promise<T>){const c=await this.pool.getConnection();try{await c.beginTransaction();const value=await work(c);await c.commit();return value;}catch(e){await c.rollback();throw e;}finally{c.release();}}
  async jobs(owner:string){const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) id,title FROM jobs WHERE owner_user_id=? ORDER BY created_at DESC,id DESC',[owner]);return rows.map(r=>({id:String(r.id),title:String(r.title)}));}
  list(owner:string,id:string,q:SelectionQuery){return this.transaction(async c=>{
    const [jobs]=await c.execute<RowDataPacket[]>('SELECT id FROM jobs WHERE id=? AND owner_user_id=?',[id,owner]);if(!jobs.length)return null;
    // LOCATE trata %, _ y barras como texto literal.
    const where=' WHERE j.id=? AND j.owner_user_id=? AND (?=\'\' OR LOCATE(?,u.full_name)>0 OR LOCATE(?,u.email_normalized)>0)'+(q.status?' AND a.status=?':'');
    const args:string[]=[id,owner,q.search,q.search,q.search];if(q.status)args.push(q.status);
    const [count]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) total FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_user_id'+where,args);
    const order={name:'u.full_name',status:'a.status',date:'a.submitted_at'}[q.sort],direction=q.direction==='asc'?'ASC':'DESC';
    const [rows]=await c.execute<RowDataPacket[]>(select+where+` ORDER BY ${order} ${direction},a.id ${direction} LIMIT ${q.page_size} OFFSET ${(q.page-1)*q.page_size}`,args);
    return {items:rows.map(map),total:Number(count[0]!.total)};
  });}
  read(owner:string,id:string){return this.transaction(async c=>{
    const [rows]=await c.execute<RowDataPacket[]>(select+' WHERE a.id=? AND j.owner_user_id=?',[id,owner]);if(!rows[0])return null;
    const [events]=await c.execute<RowDataPacket[]>(`SELECT e.previous_state,e.next_state,u.full_name actor_name,e.created_at
      FROM application_status_events e LEFT JOIN users u ON u.id=e.actor_user_id WHERE e.application_id=? ORDER BY e.id`,[id]);
    const history:SelectionEvent[]=events.map(e=>({previous_state:e.previous_state,next_state:e.next_state,actor_name:e.actor_name,at:iso(e.created_at)!}));
    return {record:map(rows[0]),history};
  });}
  change(owner:string,id:string,decide:(r:SelectionRecord)=>SelectionChange){return this.transaction(async c=>{
    // Mismo bloqueo de oferta que la finalización del proceso y el registro de postulaciones.
    const [jobs]=await c.execute<RowDataPacket[]>('SELECT j.id FROM jobs j JOIN applications a ON a.job_id=j.id WHERE a.id=? AND j.owner_user_id=? FOR UPDATE',[id,owner]);
    if(!jobs.length)return null;
    const [rows]=await c.execute<RowDataPacket[]>(select+' WHERE a.id=? AND j.owner_user_id=? FOR UPDATE',[id,owner]);
    if(!rows[0])return null;const current=map(rows[0]),change=decide(current);
    await c.execute('UPDATE applications SET status=? WHERE id=?',[change.state,id]);
    await c.execute('INSERT INTO application_status_events (application_id,previous_state,next_state,actor_user_id,created_at) VALUES (?,?,?,?,UTC_TIMESTAMP(3))',[id,current.status,change.state,owner]);
    if(['ADVANCES','NOT_ADVANCES'].includes(change.state))await c.execute('INSERT INTO recruitment_decisions (application_id,actor_user_id,decision,reason,decided_at_utc) VALUES (?,?,?,?,UTC_TIMESTAMP(3))',[id,owner,change.state,change.reason]);
    const [updated]=await c.execute<RowDataPacket[]>(select+' WHERE a.id=? AND j.owner_user_id=?',[id,owner]);return map(updated[0]!);
  });}
}
