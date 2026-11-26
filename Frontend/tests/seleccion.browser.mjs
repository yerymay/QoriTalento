// Datos sintéticos; las pruebas no modifican expedientes reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:3009',output=new URL('../../.impeccable/review/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let fail=false,failSave=false,expired=false,conflict=false,empty=false,delay=false,writes=0;
const labels=['Valeria Quispe','Lucía Mendoza','Diego Flores','Camila Torres','Andrés Huamán'];
const records=labels.map((name,i)=>({id:String(i+1),job_id:'10',job_title:'Diseñador/a de Producto',name,email:['valeria','lucia','diego','camila','andres'][i]+'@example.test',
 status:['IN_REVIEW','ADVANCES','SHORTLISTED','PENDING','NOT_ADVANCES'][i],submitted_at:'2026-11-25T12:00:00Z',process_finished:false,
 decision:i===1||i===4?{state:i===1?'ADVANCES':'NOT_ADVANCES',reason:'Evidencia revisada por el equipo.',actor_name:'María Paredes',actor_id:'1',at:'2026-11-25T14:00:00Z'}:null,
 results:{grades:[{title:'Prueba de diseño',percent:[92,96,86,72,64][i]}],exam_count:1,profile_points:[54,51,45,null,30][i],profile_max:60,total:i===3?null:[90.8,89.4,79.4,0,55.6][i],reviewed:i!==3,pending:i===3?['Hay requisitos sin revisión o sin evidencia suficiente.']:[],stale:false}}));
const actions=r=>r.decision?[]:r.status==='PENDING'?['IN_REVIEW','ADVANCES','NOT_ADVANCES']:r.status==='IN_REVIEW'?['SHORTLISTED','ADVANCES','NOT_ADVANCES']:['ADVANCES','NOT_ADVANCES'];
const detail=r=>({record:r,allowed_actions:actions(r),profile:{name:r.name,email:r.email,phone:'',location:'',summary:'Diseñadora de producto con experiencia en investigación y prototipado.',education:['Diseño y comunicación visual'],experience:['Tres años en equipos de producto'],skills:['Figma','Investigación con usuarios'],languages:['Español']},
evaluation:{application_id:r.id,job_id:'10',job_title:r.job_title,candidate_name:r.name,confirmed:true,requirement_count:2,evaluation:r.results.reviewed?{reviewed_at:'2026-11-25T14:00:00Z',criteria:[{review:{rating:'MEETS'}}]}:null,stale:false,profile_max:60,profile_points:r.results.profile_points??0,exam_points:36.8,total:r.results.total,pending:r.results.pending,exam_count:1,grades:r.results.grades},history:r.decision?[{next_state:r.status,previous_state:'IN_REVIEW',actor_name:'María Paredes',at:r.decision.at}]:[]});
await page.route('**/api/v1/**',async route=>{
 const u=new URL(route.request().url()),path=u.pathname.replace('/api/v1/',''),method=route.request().method();
 const respond=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 const error=(status,message)=>respond(status,{error:{code:'FIXTURE',message,request_id:'fixture'}});
 if(expired)return error(401,'Tu sesión terminó.');
 if(path==='me'||path==='auth/session/refresh')return respond(200,{user:{id:'1',name:'María Paredes',email:'maria@example.test',role:'RECRUITER',kind:'COMPANY',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(path==='recruiter/selection/jobs')return respond(200,{items:[{id:'10',title:'Diseñador/a de Producto'}]});
 if(path==='recruiter/jobs/10/results'){
  if(fail)return error(503,'No se pudo conectar. Intenta de nuevo.');if(delay)await new Promise(r=>setTimeout(r,500));
  const search=(u.searchParams.get('search')??'').toLowerCase(),state=u.searchParams.get('status');
  const items=empty?[]:records.filter(r=>(r.name.toLowerCase().includes(search)||r.email.includes(search))&&(!state||r.status===state)).map(r=>({...r,allowed_actions:actions(r)}));
  return respond(200,{items,total:items.length,page:1,page_size:20});
 }
 const m=path.match(/^recruiter\/applications\/(\d+)\/selection$/);
 if(m){const r=records.find(r=>r.id===m[1]);if(!r)return error(404,'No disponible.');
  if(method==='POST'){writes++;if(failSave)return error(503,'No se pudo guardar.');if(conflict)return error(409,'El estado cambió. Vuelve a revisar la ficha.');
   const data=route.request().postDataJSON();assert.equal(data.expected_status,r.status);assert.equal(data.confirmed,true);r.status=data.state;
   if(['ADVANCES','NOT_ADVANCES'].includes(r.status))r.decision={state:r.status,reason:data.reason??null,actor_name:'María Paredes',actor_id:'1',at:'2026-11-25T15:00:00Z'};
   return respond(200,{record:r,allowed_actions:actions(r)});
  }return respond(200,detail(r));
 }return error(404,'Ruta no simulada: '+path);
});
const go=async()=>{await page.goto(base+'/reclutador/resultados',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-private]')).toBeVisible();await expect(page.locator('[data-results-loading]')).toBeHidden();};
const checkContrast=async()=>{
 const samples=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data);};
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  return [...document.querySelectorAll('[data-selection] .selection-muted,[data-selection] .selection-badge,[data-selection] .selection-metric,[data-selection] .q-input')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>{
   const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);ctx.clearRect(0,0,1,1);ctx.fillStyle='white';ctx.fillRect(0,0,1,1);
   for(const p of chain){ctx.fillStyle=getComputedStyle(p).backgroundColor;ctx.fillRect(0,0,1,1);}
   const bg=Array.from(ctx.getImageData(0,0,1,1).data),fg=rgb(getComputedStyle(e).color),a=lum(bg),b=lum(fg);
   return {text:(e.textContent??'').trim().slice(0,40),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
 });assert(samples.length>0);assert.deepEqual(samples.filter(s=>s.ratio<4.5),[],'Contraste AA en textos de resultados');return Math.min(...samples.map(s=>s.ratio));
};
let minContrast=Infinity;
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'astro-dev-toolbar{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important}'});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento '+name);await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:true});};
try{
 await go();await expect(page.locator('[data-results-rows] tr')).toHaveCount(5);
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===1440?1000:844});for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');localStorage.setItem('qori-theme',t);},theme);minContrast=Math.min(minContrast,await checkContrast());await shot('m07-'+width+'-'+theme);}}
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await page.locator('select[data-state]').selectOption('IN_REVIEW');await expect(page.locator('[data-results-rows] tr')).toHaveCount(1);await page.getByRole('button',{name:'Ver ficha de Valeria Quispe'}).focus();await page.keyboard.press('Enter');await expect(page.locator('[data-detail-content]')).toContainText('Perfil confirmado');await shot('m07-detail-desktop');
 await page.locator('[data-open-decision]').click();await expect(page.locator('[data-decision-dialog]')).toBeVisible();await page.locator('[data-decision-state]').selectOption('ADVANCES');await page.locator('[data-decision-reason]').fill('Evidencia revisada.');
 await page.locator('[data-decision-cancel]').click();assert.equal(writes,0);
 await page.locator('[data-open-decision]').click();await page.locator('[data-decision-state]').selectOption('ADVANCES');await page.locator('[data-decision-reason]').fill('Evidencia revisada.');
 failSave=true;await page.locator('[data-decision-save]').click();await expect(page.locator('[data-save-error]')).toBeVisible();await expect(page.locator('[data-decision-reason]')).toHaveValue('Evidencia revisada.');
 failSave=false;await page.locator('[data-decision-save]').click();await expect(page.locator('[data-decision-dialog]')).toBeHidden();await expect(page.locator('[data-open-decision]')).toBeDisabled();await expect(page.locator('#selection-detail-title')).toBeFocused();await expect(page.locator('[data-detail-content]')).toContainText('no admite reversión');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.classList.add('dark'));await shot('m07-detail-mobile-dark');
 await page.locator('[data-detail-close]').click();await expect(page.locator('[data-search]')).toBeFocused();await page.locator('select[data-state]').selectOption('');await page.locator('[data-search]').fill('Camila');await expect(page.locator('[data-results-rows] tr')).toHaveCount(1);await expect(page.locator('[data-results-rows]')).toContainText('Pendiente');
 await page.locator('[data-search]').fill('Sin coincidencia');await expect(page.locator('[data-results-empty]')).toBeVisible();await page.locator('[data-clear-filters]').click();await expect(page.locator('[data-results-rows] tr')).toHaveCount(5);
 await page.locator('select[data-state]').selectOption('SHORTLISTED');await expect(page.locator('[data-results-rows] tr')).toHaveCount(1);await expect(page.locator('[data-results-rows]')).toContainText('Diego Flores');
 conflict=true;await page.getByRole('button',{name:'Ver ficha de Diego Flores'}).click();await page.locator('[data-open-decision]').click();await page.locator('[data-decision-save]').click();await expect(page.locator('[data-detail-error]')).toContainText('El estado cambió');await expect(page.locator('#selection-detail-title')).toBeFocused();conflict=false;await page.locator('[data-detail-close]').click();
 fail=true;await page.locator('select[data-state]').selectOption('');await expect(page.locator('[data-list-error]')).toBeVisible();fail=false;await page.locator('[data-list-retry]').click();await expect(page.locator('[data-results-rows] tr')).toHaveCount(5);
 empty=true;await go();await expect(page.locator('[data-empty-title]')).toHaveText('Aún no hay postulantes');empty=false;
 delay=true;await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('[data-results-loading]')).toBeVisible();await expect(page.locator('[data-results-loading]')).toBeHidden();delay=false;
 await page.getByRole('button',{name:'Ver ficha de Camila Torres'}).click();await expect(page.locator('[data-detail-content]')).toContainText('Por revisar');await expect(page.locator('[data-detail-content]')).not.toContainText('0 / 60');await page.locator('[data-open-decision]').click();expired=true;await page.locator('[data-decision-save]').click();await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-detail-content]')).toBeEmpty();await expect(page.locator('[data-results-rows]')).toBeEmpty();await expect(page.locator('[data-decision-dialog]')).toBeHidden();
 assert.deepEqual(errors,[]);const result={result:'ok',screenshots:6,minContrast,checks:'claro/oscuro, 1440/390, teclado, ficha, filtros, parcial, vacío, carga, error/reintento, cancelar, guardar, fallo sin pérdida, conflicto, foco después de guardar/conflicto/cierre, perfil sin revisar, contraste AA de resultados, decisión irreversible, expiración y limpieza'};
 await writeFile(new URL('m07-browser-result.json',output),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
