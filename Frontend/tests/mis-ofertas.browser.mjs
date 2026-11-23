// Plantilla A con API sintética: no modifica ofertas reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let empty=false,fail=false,slow=false,expired=false,mutations=0,queries=[];
const job=(id,title,status='PUBLISHED')=>({id:String(id),title,status,description:status==='DRAFT'?'':'Construye experiencias digitales accesibles.',area:'Producto y tecnología',location:'Abancay',modality:'Híbrido',work_schedule:'Tiempo completo',requirements:status==='DRAFT'?[]:[{description:'Experiencia en interfaces web'}],responsibilities:[],benefits:[],experience_required:null,education_required:null,applicant_count:id===2?0:id*3,published_at:status==='DRAFT'?null:'2026-11-22T12:00:00Z',closed_at:null,created_at:'2026-11-22T12:00:00Z',updated_at:'2026-11-22T12:00:00Z'});
const jobs=[job(1,'Diseñador/a de producto'),job(2,'Analista de selección','DRAFT'),job(3,'Desarrollador/a frontend','CLOSED'),...Array.from({length:20},(_,i)=>job(i+4,'Especialista en tecnología '+(i+1)))];
await page.route('**/api/v1/**',async route=>{
 const url=new URL(route.request().url()),path=url.pathname,method=route.request().method();
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 const error=(status,message)=>send(status,{error:{code:status===401?'SESSION_EXPIRED':'TEST_ERROR',message,request_id:'fixture'}});
 if(path.endsWith('/me')||path.endsWith('/auth/session/refresh'))return expired?error(401,'Tu sesión terminó.'):send(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role:'RECRUITER',kind:'COMPANY',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(method!=='GET'){mutations++;return error(500,'No se esperan escrituras en esta prueba.');}
 if(path.endsWith('/recruiter/jobs')){
  const q=url.searchParams.get('q')??'',status=url.searchParams.get('status')??'',p=Number(url.searchParams.get('page')??1);
  queries.push(url.search);
  if(slow||q==='lenta')await new Promise(r=>setTimeout(r,q==='lenta'?950:650));
  if(fail)return error(503,'No se pudo cargar la lista.');
  const selected=empty?[]:jobs.filter(j=>(!q||j.title.toLowerCase().includes(q.toLowerCase()))&&(!status||j.status===status));
  return send(200,{items:selected.slice((p-1)*20,p*20),total:selected.length,page:p,page_size:20});
 }
 const match=path.match(/recruiter\/jobs\/(\d+)$/);
 return match?send(200,jobs.find(j=>j.id===match[1])):send(200,{items:[],total:0,page:1,page_size:20});
});
const rows=page.locator('[data-job-list] tr'),input=page.getByRole('searchbox',{name:'Buscar ofertas'});
const capture=async name=>{await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/mis-ofertas-'+name+'.png',fullPage:true,animations:'disabled'});const o=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!el.closest('table');}).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,overflow:getComputedStyle(el).overflowX})).slice(0,20)}));assert(o.scroll<=o.width,JSON.stringify(o));};
try{
 await page.goto(base+'/reclutador/ofertas');await expect(rows).toHaveCount(20);
 await expect(page.locator('main > header').getByRole('link',{name:'Crear oferta'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Buscar',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Acciones',exact:true})).toHaveCount(0);
 await expect(page.locator('[data-job-results].ui-panel')).toHaveCount(1);
 await expect(page.locator('[data-job-results] [data-job-status]').first()).toHaveText('Publicada');
 await expect(page.locator('[data-job-completeness]').nth(1)).toBeVisible();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  for(const dark of [false,true]){await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await capture(width+'-'+(dark?'oscuro':'claro'));}
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await rows.first().hover();await expect(rows.first().locator('[data-job-quick]')).toHaveCSS('opacity','1');
 const trigger=rows.first().locator('[data-actions-trigger]');
 await trigger.focus();await page.keyboard.press('ArrowDown');
 const menu=page.locator('#job-actions-1');
 await expect(menu).toBeVisible();await expect(menu.locator('[data-job-edit]')).toBeFocused();
 await page.keyboard.press('End');await expect(menu.locator('[data-job-delete-action]')).toBeFocused();
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 await expect(page).toHaveURL(/reclutador\/ofertas$/);
 await page.locator('[data-page-next]').click();await expect(rows).toHaveCount(3);
 await page.getByRole('button',{name:'Borradores',exact:true}).click();await expect(rows).toHaveCount(1);await expect(rows.first()).toContainText('Analista');
 await expect(page.locator('[data-page-label]')).toHaveText('Página 1 de 1');
 await page.getByRole('button',{name:'Todas',exact:true}).click();await expect(rows).toHaveCount(20);
 const before=queries.length;await input.pressSequentially('Diseñador',{delay:20});await expect(rows).toHaveCount(1);await expect(input).toBeFocused();assert.equal(queries.length,before+1,'Debounce agrupa el tecleo');
 await input.fill('lenta');await page.waitForTimeout(350);await input.fill('frontend');
 await expect(rows.first()).toContainText('frontend');await page.waitForTimeout(1000);await expect(rows.first()).toContainText('frontend');
 await input.fill('ninguna coincidencia');await expect(page.locator('[data-job-empty]')).toBeVisible();
 await expect(page.locator('[data-empty-create]')).toBeHidden();await expect(page.locator('[data-empty-reset]')).toBeVisible();
 await page.locator('[data-empty-reset]').click();await expect(rows).toHaveCount(20);
 // Clic en celda abre el editor; el menú no activa la fila.
 await rows.first().locator('[data-job-applicant-count]').click();await expect(page).toHaveURL(/editar-oferta\?id=1/);
 await page.goto(base+'/reclutador/ofertas');await expect(rows).toHaveCount(20);
 empty=true;await page.reload();await expect(page.locator('[data-job-empty]')).toBeVisible();
 await expect(page.locator('[data-create-header]')).toBeHidden();await expect(page.locator('[data-empty-create]')).toBeVisible();await capture('vacio');
 fail=true;await page.reload();await expect(page.locator('[data-job-list-error]')).toBeVisible();await capture('error');
 fail=false;empty=false;await page.locator('[data-job-list-retry]').click();await expect(rows).toHaveCount(20);
 slow=true;await page.reload();await expect(page.locator('[data-job-list-loading]')).toBeVisible();await capture('carga');await expect(rows).toHaveCount(20);slow=false;
 expired=true;await page.reload();await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-signin]')).toBeVisible();
 assert.equal(mutations,0);assert.deepEqual(errors,[]);
 console.log('Plantilla A OK: cinco estados, chips/debounce/concurrencia, paginación, fila/enlaces, menú/teclado, sesión, CTA, móvil y temas.');
}finally{await browser.close();}
