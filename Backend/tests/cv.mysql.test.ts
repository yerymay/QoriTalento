import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
import { MySqlAuthRepository } from '../src/modules/auth/persistence/mysql-auth.repository.js';
import { MySqlOfertasRepository } from '../src/modules/ofertas/persistence/mysql-ofertas.repository.js';
import { MySqlPostulacionesRepository } from '../src/modules/postulaciones/persistence/mysql-postulaciones.repository.js';
import { PostulacionesService } from '../src/modules/postulaciones/services/postulaciones.service.js';
import { MySqlCvRepository } from '../src/modules/cv/persistence/mysql-cv.repository.js';
import { CvService } from '../src/modules/cv/services/cv.service.js';
import { samplePdf } from './cv-fixtures.js';

describe.skipIf(process.env.TEST_MYSQL !== '1')('M04 con MySQL real',()=>{
  const pool=getMysqlPool(),auth=new MySqlAuthRepository(pool),jobs=new MySqlOfertasRepository(pool),applications=new PostulacionesService(new MySqlPostulacionesRepository(pool)),repo=new MySqlCvRepository(pool),service=new CvService(repo);
  const users:string[]=[],jobIds:string[]=[],appIds:string[]=[];
  afterAll(async()=>{
    for(const id of appIds){
      await pool.execute('DELETE FROM recruiter_notes WHERE application_id=?',[id]);
      await pool.execute('DELETE FROM application_profile_snapshots WHERE application_id=?',[id]);
    }
    for(const id of users)await pool.execute('DELETE FROM candidate_profile_versions WHERE candidate_user_id=?',[id]);
    for(const id of appIds){
      await pool.execute('DELETE r FROM cv_extraction_runs r JOIN cv_documents d ON d.id=r.cv_document_id WHERE d.application_id=?',[id]);
      await pool.execute('DELETE p FROM cv_private_data p JOIN cv_documents d ON d.id=p.cv_document_id WHERE d.application_id=?',[id]);
      await pool.execute('DELETE FROM cv_documents WHERE application_id=?',[id]);
      await pool.execute('DELETE FROM applications WHERE id=?',[id]);
    }
    for(const id of jobIds){await pool.execute('DELETE FROM job_requirements WHERE job_id=?',[id]);await pool.execute('DELETE FROM jobs WHERE id=?',[id]);}
    for(const id of users){await pool.execute('DELETE FROM recruiter_profiles WHERE user_id=?',[id]);await pool.execute('DELETE FROM users WHERE id=?',[id]);}
    await pool.end();
  });
  it('extrae al cargar, confirma de forma atómica, aísla y conserva versiones',async()=>{
    for(const role of ['RECRUITER','CANDIDATE','CANDIDATE','RECRUITER'] as const){const u=await auth.createUser({name:'Prueba sintética M04',email:`m04-${randomUUID()}@example.test`,phone:null,password_hash:'sin-login',role,kind:role==='RECRUITER'?'COMPANY':null});users.push(u.id);}
    const candidate={id:users[1]!,role:'CANDIDATE' as const},owner={id:users[0]!,role:'RECRUITER' as const};
    const bytes=samplePdf(),file={buffer:bytes,size:bytes.length,mimetype:'application/pdf',originalname:'cv.pdf'} as Express.Multer.File;
    for(let n=0;n<2;n++){
      const job=await jobs.create(owner.id,{title:`Vacante sintética M04 ${n}`,description:'Prueba',area:null,location:null,experience_required:null,education_required:null,requirements:[{description:'Prueba'}]});jobIds.push(job.id);
      await jobs.changeOwned(job.id,owner.id,()=>({state:{status:'PUBLISHED',published_at:new Date().toISOString(),closed_at:null}}));
      const app=await applications.create(candidate.id,job.id,file);appIds.push(app.id);
    }
    const first=await service.review(candidate,appIds[0]!);
    expect(first.extraction?.profile.name).toBe('Ana Torres');expect(await service.profile(candidate)).toBeNull();
    const profile={...first.extraction!.profile,name:'Ana Corregida'};
    const payload={document_id:first.document!.id,base_profile_id:null,profile};
    const simultaneous=await Promise.all([service.confirm(candidate,appIds[0]!,payload),service.confirm(candidate,appIds[0]!,payload)]);
    expect(simultaneous[0].confirmed!.id).toBe(simultaneous[1].confirmed!.id);
    const [counts]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) n FROM candidate_profile_versions WHERE candidate_user_id=?',[candidate.id]);expect(Number(counts[0]!.n)).toBe(1);
    const [updated]=await pool.execute<RowDataPacket[]>('SELECT full_name,phone,email_normalized FROM users WHERE id=?',[candidate.id]);expect(updated[0]!.full_name).toBe('Ana Corregida');expect(updated[0]!.phone).toBe(profile.phone);expect(updated[0]!.email_normalized).not.toBe(profile.email);
    await expect(service.review({id:users[2]!,role:'CANDIDATE'},appIds[0]!)).rejects.toMatchObject({status:404});
    await expect(service.document({id:users[3]!,role:'RECRUITER'},appIds[0]!,first.document!.id)).rejects.toMatchObject({status:404});
    const reviewer=await service.review(owner,appIds[0]!);expect(reviewer.extraction).toBeNull();expect(reviewer.confirmed!.profile.name).toBe('Ana Corregida');
    await service.addNote(owner,appIds[0]!,{body:'Revisado con el documento.'});expect((await service.notes(owner,appIds[0]!))).toHaveLength(1);
    expect((await service.applications(owner,jobIds[0]!))).toHaveLength(1);
    await applications.replace(candidate.id,appIds[0]!,file);
    const replacement=await service.review(candidate,appIds[0]!);expect(replacement.confirmed!.source_cv_id).toBe(first.document!.id);expect(replacement.document!.id).not.toBe(first.document!.id);
    await expect(service.confirm(candidate,appIds[0]!,payload)).rejects.toMatchObject({code:'CV_CHANGED'});
    const second=await service.review(candidate,appIds[1]!);
    await service.confirm(candidate,appIds[1]!,{document_id:second.document!.id,base_profile_id:second.current_profile_id,profile:{...profile,name:'Perfil de otra oferta'}});
    expect((await service.review(owner,appIds[0]!)).confirmed!.profile.name).toBe('Ana Corregida');
    await expect(service.confirm(candidate,appIds[0]!,{document_id:replacement.document!.id,base_profile_id:replacement.current_profile_id,profile})).rejects.toMatchObject({code:'PROFILE_CHANGED'});
    const refreshed=await service.review(candidate,appIds[0]!);
    const final=await service.confirm(candidate,appIds[0]!,{document_id:refreshed.document!.id,base_profile_id:refreshed.current_profile_id,profile});
    expect(final.confirmed!.source_cv_id).toBe(refreshed.document!.id);expect((await repo.getDocument(owner,appIds[0]!,first.document!.id)).bytes).toEqual(bytes);
  });
});
