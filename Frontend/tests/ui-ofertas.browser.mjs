// Regresión de las primitivas compartidas en las pantallas de ofertas.
import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.argv[2]??'http://127.0.0.1:4322';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
let role='RECRUITER',empty=false,failed=false,expired=false;
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const job={id:'1',title:'Diseño de producto',status:'PUBLISHED',owner_user_id:'1',description:'Diseña interfaces accesibles.',area:'Producto',location:'Abancay',modality:'REMOTE',work_schedule:'FULL_TIME',experience_required:null,education_required:null,requirements:[{description:'Diseño accesible'}],responsibilities:[],benefits:[],published_at:'2026-11-22T12:00:00Z',created_at:'2026-11-22T12:00:00Z',updated_at:'2026-11-22T12:00:00Z',closed_at:null};
await page.route('**/api/v1/**',route=>{
 const path=new URL(route.request().url()).pathname;
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path.endsWith('/me')||path.endsWith('/auth/session/refresh'))return expired?send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'ui'}}):send(200,{user:{id:'1',name:'Ana Prueba',email:'ana@example.test',role,kind:role==='RECRUITER'?'COMPANY':null,account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(path.endsWith('/jobs'))return failed?send(503,{error:{code:'UNAVAILABLE',message:'No se pudo cargar la lista.',request_id:'ui'}}):send(200,{items:empty?[]:[job],total:empty?0:1,page:1,page_size:20});
 return send(404,{error:{code:'NOT_FOUND',message:'Ruta no usada en esta prueba.',request_id:'ui'}});
});
try{
 await page.goto(base+'/reclutador/ofertas');
 await expect(page.locator('[data-job-list] [data-job-status]')).toHaveText('Publicada');
 await expect(page.locator('[data-job-list] .ui-badge')).toHaveCount(1);
 await page.locator('[data-actions-trigger]').click();
 await expect(page.locator('[data-action-menu] a[data-job-edit]')).toBeVisible();
 await expect(page.locator('[data-action-menu] a[data-job-edit]')).toHaveAttribute('href','/reclutador/editar-oferta?id=1');
 await page.keyboard.press('Escape');
 empty=true;await page.reload();
 await expect(page.locator('[data-job-empty].ui-empty')).toBeVisible();
 await expect(page.locator('[data-empty-title]')).not.toHaveText('');
 await expect(page.locator('[data-job-empty] a')).toHaveAttribute('href','/reclutador/nueva-oferta');
 failed=true;await page.reload();await expect(page.locator('[data-job-list-error]')).toBeVisible();
 failed=false;empty=false;await page.locator('[data-job-list-retry]').click();
 await expect(page.locator('[data-job-list] tr')).toHaveCount(1);
 role='CANDIDATE';await page.goto(base+'/postulante/ofertas');
 await expect(page.locator('a[data-job-view]')).toHaveAttribute('href','/postulante/oferta?id=1');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto(base+'/configuracion#sonido');
 await expect(page.locator('[data-config-sound][role=switch]')).toBeVisible();
 const sound=page.locator('[data-config-sound]');const checked=await sound.isChecked();await sound.setChecked(!checked);await expect(sound).toBeChecked({checked:!checked});
 expired=true;await page.goto(base+'/reclutador/ofertas');
 await expect(page.locator('[data-private]')).toBeHidden();
 await expect(page.locator('[data-signin]')).toBeVisible();
 assert.deepEqual(errors,[]);
 console.log('Migración UI OK: ofertas de ambos roles, menús, etiquetas, vacío, error/reintento, enlaces dinámicos, ajustes y sesión.');
}finally{await browser.close();}
