// Editor de preguntas con API sintética; no escribe datos reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
let empty=false,fail=false,publishes=0,writes=[];
const question=(text,missing=false)=>({text,options:[{text:missing?'':'TypeScript',is_correct:!missing},{text:missing?'':'SQL',is_correct:false},{text:missing?'':'HTML',is_correct:false},{text:missing?'':'CSS',is_correct:false}]});
let exam={id:'1',job_id:'1',job_title:'Desarrollador/a de aplicaciones web',title:'Fundamentos web',time_limit_seconds:1800,status:'DRAFT',version_number:1,questions:[question('Pregunta uno: identifica un lenguaje tipado.'),question('Pregunta dos: revisa las alternativas.',true),question('Pregunta tres: compara las tecnologías.')]};
await page.route('**/api/v1/**',async route=>{
 const path=new URL(route.request().url()).pathname.replace('/api/v1/',''),method=route.request().method();
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path==='me'||path==='auth/session/refresh')return send(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role:'RECRUITER',kind:'COMPANY',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(path==='recruiter/exams')return send(200,{items:empty?[]:[exam]});
 if(path==='recruiter/jobs')return send(200,{items:[{id:'1',title:exam.job_title,process_finished_at:null}],total:1,page:1,page_size:50});
 if(path==='recruiter/exams/1'&&method==='PUT'){
  const data=route.request().postDataJSON();writes.push(data);
  if(fail)return send(503,{error:{code:'TEST_ERROR',message:'No se pudo guardar. Conservamos tus cambios.',request_id:'fixture'}});
  exam={...exam,...data,time_limit_seconds:data.time_limit_minutes*60};return send(200,exam);
 }
 if(path==='recruiter/exams/1/publish'){publishes++;exam.status='PUBLISHED';return send(200,exam);}
 if(path==='recruiter/exams/1')return send(200,exam);
 return send(404,{error:{code:'NOT_FOUND',message:path,request_id:'fixture'}});
});
const capture=async name=>{await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/preguntas-'+name+'.png',fullPage:true,animations:'disabled'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sin desbordamiento');};
try{
 empty=true;await page.goto(base+'/reclutador/examenes');await expect(page.locator('[data-ex-empty]')).toBeVisible();
 assert.equal(await page.locator('[data-ex-empty]').evaluate(el=>!!el.closest('.ui-panel')),false);await capture('vacio');empty=false;
 await page.goto(base+'/reclutador/examen?id=1');await page.locator('[data-step="1"]').click();
 await expect(page.getByRole('button',{name:'Subir',exact:true})).toHaveCount(0);await expect(page.locator('[data-move]')).toHaveCount(0);
 await expect(page.locator('.ex-editor-chip')).toHaveCount(3);
 await page.getByRole('button',{name:'Reordenar pregunta 1',exact:true}).focus();await page.keyboard.press('Alt+End');
 await expect(page.getByRole('button',{name:'Reordenar pregunta 3',exact:true})).toBeFocused();
 await expect(page.getByLabel('Enunciado',{exact:true})).toHaveValue(/Pregunta uno/);
 await page.locator('[data-save]').click();assert.deepEqual(writes.at(-1).questions.map(q=>q.text.split(':')[0]),['Pregunta dos','Pregunta tres','Pregunta uno']);
 await expect(page.locator('.ui-toast')).toHaveCount(0);
 await page.locator('[data-drag-question="2"]').dragTo(page.locator('[data-sort-target="0"]'));
 await page.locator('[data-save]').click();assert.deepEqual(writes.at(-1).questions.map(q=>q.text.split(':')[0]),['Pregunta uno','Pregunta dos','Pregunta tres']);
 await expect(page.getByLabel('Enunciado',{exact:true})).toHaveValue(/Pregunta uno/);
 await page.locator('[data-question="1"]').click();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  for(const dark of [false,true]){await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await capture(width+'-'+(dark?'oscuro':'claro'));}
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await page.locator('[data-step="2"]').click();await expect(page.locator('[data-publish]')).toBeDisabled();
 await expect(page.locator('#ex-publish-reason')).toBeVisible();await expect(page.locator('[data-tone=warning]')).toContainText('Completa la prueba');
 await capture('revision-pendiente');await page.getByRole('link',{name:'Ir a la pregunta 2',exact:true}).click();
 await expect(page.getByLabel('Enunciado',{exact:true})).toBeFocused();await expect(page.getByLabel('Enunciado',{exact:true})).toHaveValue(/Pregunta dos/);
 const menuTrigger=page.getByRole('button',{name:'Opciones de la pregunta 2',exact:true});
 await menuTrigger.focus();await page.keyboard.press('ArrowDown');await expect(page.locator('[data-remove-question]')).toBeFocused();
 await page.keyboard.press('Escape');await expect(menuTrigger).toBeFocused();
 await page.getByRole('button',{name:'Opciones de la alternativa D',exact:true}).click();
 await page.getByRole('menuitem',{name:'Eliminar alternativa',exact:true}).last().click();await expect(page.locator('[data-option]')).toHaveCount(3);
 for(const [letter,text] of [['A','Respuesta correcta'],['B','Otra respuesta'],['C','Una tercera opción']])await page.getByLabel('Alternativa '+letter,{exact:true}).fill(text);
 await page.getByRole('radio',{name:'Alternativa A correcta',exact:true}).check();await expect(page.locator('.ex-correct-label').first()).toContainText('Correcta');
 fail=true;await page.locator('[data-save]').click();await expect(page.locator('[data-ex-notice]')).toContainText('Conservamos');
 await expect(page.getByLabel('Alternativa A',{exact:true})).toHaveValue('Respuesta correcta');
 fail=false;await page.locator('[data-save]').click();await expect(page.locator('[data-draft-status]')).toHaveText('Borrador guardado');
 await expect(page.locator('.ui-toast')).toHaveCount(0);
 await page.locator('[data-step="2"]').click();await expect(page.locator('[data-publish]')).toBeEnabled();
 await page.locator('[data-publish]').click();await page.locator('[data-ex-confirm-action]').click();
 await expect(page.locator('.ui-toast[data-tone=success]')).toHaveCount(1);assert.equal(publishes,1);
 await expect(page.locator('[data-drag-question]')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 console.log('Editor OK: vacío sin panel, orden por arrastre/teclado persistido, selección conservada, menús, alternativas, advertencias/enlaces, bloqueo/motivo, reintento y toast solo al publicar.');
}finally{await browser.close();}
