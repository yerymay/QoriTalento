// Micrófonos por campo con reconocimiento simulado, sin grabar ni enviar audio.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.addInitScript(()=>{
 class Recognition{
  static current;start(){Recognition.current=this;this.onstart?.();}abort(){}
 }
 window.SpeechRecognition=Recognition;
 window.testSpeak=text=>{const r=Recognition.current;r.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text,confidence:1}],{isFinal:true})]});};
 window.testVoiceError=()=>Recognition.current.onerror?.({error:'not-allowed'});
});
let fail=false,expired=false,saved,writes=0;
await page.route('**/api/v1/**',async route=>{
 const path=new URL(route.request().url()).pathname,method=route.request().method();
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path.endsWith('/me')||path.endsWith('/auth/session/refresh'))return expired?send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'fixture'}}):send(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role:'RECRUITER',kind:'INDIVIDUAL',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if((path.endsWith('/recruiter/jobs')&&method==='POST')||(path.endsWith('/recruiter/jobs/1')&&method==='PATCH')){
  writes++;await new Promise(r=>setTimeout(r,600));
  if(fail)return send(503,{error:{code:'TEST_ERROR',message:'No se pudo guardar. Tus datos siguen en el formulario.',request_id:'fixture'}});
  saved={...route.request().postDataJSON(),id:'1',status:'DRAFT',published_at:null,closed_at:null,process_finished_at:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  return send(200,saved);
 }
 if(path.endsWith('/recruiter/jobs/1'))return send(200,saved);
 return send(200,{items:[],total:0,page:1,page_size:20});
});
const mic=field=>page.locator('[data-field-voice="'+field+'"]');
const speak=text=>page.evaluate(text=>window.testSpeak(text),text);
const capture=async name=>{await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/oferta-editor-'+name+'.png',fullPage:true,animations:'disabled'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));};
try{
 await page.goto(base+'/reclutador/nueva-oferta');await expect(page.locator('[data-job-editor]')).toBeVisible();
 await expect(page.locator('[data-individual-note]')).toHaveCount(0);await expect(page.getByRole('link',{name:'Volver a mis ofertas',exact:true})).toHaveCount(0);
 await expect(page.getByRole('navigation',{name:'Ruta de navegación'}).getByRole('link',{name:'Mis ofertas',exact:true})).toHaveAttribute('href','/reclutador/ofertas');
 await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','0');
 await expect(mic('title')).toBeVisible();
 const inputRect=await page.locator('#title').boundingBox(),micRect=await mic('title').boundingBox();assert(micRect.x>=inputRect.x&&micRect.x+micRect.width<=inputRect.x+inputRect.width);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  for(const dark of [false,true]){await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await capture(width+'-'+(dark?'oscuro':'claro'));}
  const bar=await page.locator('[data-job-actions]').boundingBox();assert(Math.abs(bar.y+bar.height-(width===1440?1000:844))<2,'Barra fija al fondo');
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await mic('title').click();await expect(mic('title')).toHaveAttribute('aria-pressed','true');
 await speak('Analista de calidad');await expect(page.locator('#title')).toHaveValue('Analista de calidad');
 await mic('title').click();await expect(mic('title')).toHaveAttribute('aria-pressed','false');
 await page.locator('[data-voz-deshacer]').click();await expect(page.locator('#title')).toHaveValue('');await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','0');
 await page.locator('#title').fill('Cargo original');await mic('title').click();await page.locator('#title').fill('Cargo escrito');
 await speak('cargo Cargo dictado');await expect(page.locator('[data-voz-dialogo]')).toBeVisible();
 await page.locator('[data-voz-dialogo]').getByRole('button',{name:/Teclado:/}).click();await expect(page.locator('#title')).toHaveValue('Cargo escrito');
 await mic('title').click();
 await mic('area').click();await speak('Tecnología');await expect(page.locator('#area')).toHaveValue('Tecnología');await mic('area').click();
 await page.locator('[data-wizard-next]').click();await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','1');
 await page.locator('[data-wizard-next]').click();await expect(page.locator('[data-wizard-indicator="1"]')).toHaveAttribute('data-state','pending');
 await page.locator('[data-wizard-prev]').click();
 await mic('description').click();await speak('Escribir Diseña interfaces accesibles');await expect(page.locator('#description')).toHaveValue('Diseña interfaces accesibles');await mic('description').click();
 await mic('requirements').click();await speak('Experiencia en interfaces accesibles');await expect(page.locator('#requirements')).toHaveValue('Experiencia en interfaces accesibles');await expect(page.locator('#experience_required')).toHaveValue('');await mic('requirements').click();
 await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','2');
 await capture('descripcion');
 await page.locator('[data-wizard-next]').click();
 await mic('work_schedule').click();await speak('Tiempo completo');await expect(page.locator('#work_schedule')).toHaveValue('Tiempo completo');await mic('work_schedule').click();
 await page.locator('[data-wizard-next]').click();await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','3');
 await expect(page.locator('[data-wizard-review]')).toContainText('Tiempo completo');
 fail=true;await page.locator('[data-save-job]').click();await expect(page.locator('[data-dirty-message]')).toHaveText('Guardando…');
 await expect(page.locator('[data-job-feedback]')).toContainText('Tus datos siguen');await expect(page.locator('#description')).toHaveValue('Diseña interfaces accesibles');
 fail=false;await page.locator('[data-save-job]').click();await expect(page.locator('[data-dirty-message]')).toHaveText('Guardado');
 await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','4');await expect(page.locator('[data-job-feedback]')).toBeHidden();await expect(page.locator('.ui-toast')).toHaveCount(0);
 await page.locator('[data-wizard-prev]').click();await page.locator('[data-wizard-prev]').click();
 await page.locator('#requirements').fill('');await expect(page.locator('[data-offer-progress]')).toHaveAttribute('value','2');
 await mic('requirements').click();await page.evaluate(()=>window.testVoiceError());
 await expect(page.locator('[data-voz-estado]')).toContainText('No hay permiso');await page.locator('#requirements').fill('Puedo continuar con teclado');
 await expect(page.locator('#requirements')).toHaveValue('Puedo continuar con teclado');
 expired=true;await page.reload();await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-job-actions]')).toBeHidden();
 assert.equal(writes,2);assert.deepEqual(errors,[]);
 console.log('Oferta UI OK: micrófonos en campos, dictado/deshacer/conflicto/error, breadcrumb, barra fija, progreso real, guardado inline, reintento, sesión, móvil y temas.');
}finally{await browser.close();}
