// UI M05 con API sintética; no modifica cuentas ni exámenes reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:4321',output=new URL('../../.impeccable/review/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
let role='RECRUITER',fail=false,failSave=false,empty=false,expiredSession=false,exam,attempt,starts=0,submits=0,answerCalls=0;
const now=()=>new Date().toISOString();
const hydrate=input=>({...input,id:'1',job_id:'1',job_title:'Desarrollador/a de aplicaciones web',time_limit_seconds:input.time_limit_minutes*60,version_number:1,status:'DRAFT',questions:input.questions.map((q,i)=>({...q,id:String(i+1),options:q.options.map((o,j)=>({...o,id:String(i*10+j+1)}))}))});
const view=()=>{
  if(attempt?.status==='IN_PROGRESS'&&Date.parse(attempt.deadline_at_utc)<=Date.now()){attempt.status='EXPIRED';attempt.finished_at_utc=attempt.deadline_at_utc;}
  return {server_now:now(),attempt,exam:{...exam,questions:exam.questions.map(q=>({...q,options:q.options.map(({is_correct,...o})=>o)}))}};
};
await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api/v1/',''),method=route.request().method();
  const respond=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  const error=(status,code,message)=>respond(status,{error:{code,message,request_id:'fixture'}});
  if(path==='me'||path==='auth/session/refresh')return expiredSession?error(401,'UNAUTHENTICATED','Tu sesión terminó.'):respond(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role,kind:role==='RECRUITER'?'COMPANY':null,account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
  if(path==='auth/logout')return route.fulfill({status:204});
  if(path==='recruiter/jobs')return respond(200,{items:[{id:'1',title:'Desarrollador/a de aplicaciones web',process_finished_at:null}],total:1,page:1,page_size:50});
  if(path==='recruiter/exams')return fail?error(503,'SERVICE_UNAVAILABLE','No se pudieron cargar las pruebas.'):respond(200,{items:empty||!exam?[]:[exam]});
  if(path==='recruiter/jobs/1/exams'||path==='recruiter/exams/1'&&method==='PUT'){
    if(failSave)return error(503,'SERVICE_UNAVAILABLE','No se pudo guardar. Conservamos tus cambios.');
    exam=hydrate(route.request().postDataJSON());return respond(path.includes('/jobs/')?201:200,exam);
  }
  if(path==='recruiter/exams/1')return respond(200,exam);
  if(path==='recruiter/exams/1/publish'){exam.status='PUBLISHED';return respond(200,exam);}
  if(path==='candidate/exams')return respond(200,{items:empty?[]:[{...exam,application_id:'1',question_count:exam.questions.length,attempt_id:attempt?.id??null,status:attempt?.status??'AVAILABLE',deadline_at_utc:attempt?.deadline_at_utc??null}]});
  if(path==='candidate/exams/1/attempts'){starts++;attempt??={id:'1',exam_id:'1',application_id:'1',status:'IN_PROGRESS',started_at_utc:now(),deadline_at_utc:new Date(Date.now()+1800000).toISOString(),finished_at_utc:null,answers:[]};return respond(200,view());}
  if(path==='candidate/attempts/1')return respond(200,view());
  if(path.startsWith('candidate/attempts/1/answers/')){
    answerCalls++;if(failSave)return error(503,'SERVICE_UNAVAILABLE','Sin conexión con el guardado. Reintenta.');
    const q=path.split('/').at(-1),body=route.request().postDataJSON();view();
    if(attempt.status!=='IN_PROGRESS')return error(409,'ATTEMPT_CLOSED','El tiempo terminó.');
    attempt.answers=[...attempt.answers.filter(a=>a.question_id!==q),{question_id:q,...body,accepted_at_utc:now()}];return respond(200,view());
  }
  if(path==='candidate/attempts/1/submit'){submits++;view();if(attempt.status==='IN_PROGRESS'){attempt.status='SUBMITTED';attempt.finished_at_utc=now();}return respond(200,view());}
  return error(404,'NOT_FOUND','Ruta no disponible: '+path);
});
const go=async path=>{await page.goto(base+path,{waitUntil:'domcontentloaded'});await expect(page.locator('[data-private]')).toBeVisible();await expect(page.locator('[data-ex-loading]')).toBeHidden();};
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'astro-dev-toolbar{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important}'});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento '+name);await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:true});};
try{
 await go('/reclutador/examenes');await expect(page.getByText('Una prueba para descubrir habilidades')).toBeVisible();await shot('m05-empty');
 await page.getByRole('link',{name:'Crear prueba',exact:true}).click();await page.getByLabel('Oferta asociada').selectOption('1');await page.getByLabel('Nombre de la prueba').fill('Fundamentos de desarrollo web');await page.getByLabel('Tiempo para resolverla').fill('30');
 await shot('m05-config-desktop');await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Crear primera pregunta'}).click();
 await page.getByLabel('Enunciado',{exact:true}).fill('Observa este fragmento:\nconst total = precios.reduce((suma, precio) => suma + precio, 0);\n\n¿Qué valor produce si precios es un arreglo vacío?');
 for(const [letter,value] of [['A','0'],['B','undefined'],['C','Lanza un error'],['D','Devuelve un arreglo vacío']])await page.getByLabel('Alternativa '+letter,{exact:true}).fill(value);
 await page.getByRole('radio',{name:'Alternativa A correcta'}).check();await shot('m05-editor-desktop');
 failSave=true;await page.getByRole('button',{name:'Guardar borrador'}).click();await expect(page.locator('[data-ex-notice]')).toContainText('Conservamos');await expect(page.getByLabel('Enunciado', {exact:true})).toHaveValue(/precios.reduce/);
 failSave=false;await page.getByRole('button',{name:'Guardar borrador'}).click();await expect(page.locator('[data-draft-status]')).toHaveText('Borrador guardado');
 await page.getByRole('button',{name:'Añadir pregunta',exact:true}).click();await page.getByLabel('Enunciado',{exact:true}).fill('¿Qué técnica evita concatenar entradas de usuario en una consulta SQL?');
 for(const [letter,value] of [['A','Consultas parametrizadas'],['B','Concatenación de cadenas'],['C','Interpolación directa'],['D','Quitar espacios']])await page.getByLabel('Alternativa '+letter,{exact:true}).fill(value);
 await page.getByRole('radio',{name:'Alternativa A correcta'}).check();
 await page.setViewportSize({width:390,height:844});await shot('m05-editor-mobile');await page.evaluate(()=>document.documentElement.classList.add('dark'));await shot('m05-editor-mobile-dark');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Publicar prueba',exact:true}).click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(exam.status,'DRAFT');
 await page.getByRole('button',{name:'Publicar prueba',exact:true}).click();await page.locator('[data-ex-confirm-action]').click();await expect(page.getByText('Publicada · contenido protegido')).toBeVisible();assert.equal(exam.status,'PUBLISHED');
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.classList.remove('dark'));await shot('m05-published');
 role='CANDIDATE';await go('/postulante/examenes');await page.getByRole('link',{name:'Ver instrucciones'}).click();await expect(page.getByText('Antes de comenzar')).toBeVisible();assert.equal(starts,0);await shot('m05-instructions');
 await page.getByRole('button',{name:'Comenzar prueba',exact:true}).click();await page.locator('[data-ex-confirm-action]').click();await expect(page.locator('[data-question-heading]')).toContainText('precios.reduce');assert.equal(starts,1);
 failSave=true;await page.getByRole('radio').first().check();await expect(page.locator('[data-save-status]')).toContainText('Pendiente');await expect(page.locator('[data-progress-label]')).toHaveText('0 de 2 guardadas');await shot('m05-pending');
 await page.reload();await expect(page.locator('[data-ex-loading]')).toBeHidden();await expect(page.getByRole('radio').first()).toBeChecked();
 failSave=false;await page.locator('[data-retry-answer]').click();await expect(page.locator('[data-save-status]')).toHaveText('Guardada en el servidor');await shot('m05-attempt-desktop');
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();await page.getByRole('radio').first().check();await expect(page.locator('[data-progress-label]')).toHaveText('2 de 2 guardadas');
 await page.setViewportSize({width:390,height:844});await shot('m05-attempt-mobile');await page.evaluate(()=>document.documentElement.classList.add('dark'));await shot('m05-attempt-mobile-dark');
 await page.getByRole('button',{name:'Revisar y enviar',exact:true}).first().click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(submits,0);
 await page.getByRole('button',{name:'Revisar y enviar',exact:true}).first().click();await page.locator('[data-ex-confirm-action]').click();await expect(page.locator('[data-receipt]')).toHaveText('Tu prueba fue enviada');assert.equal(submits,1);await shot('m05-receipt');
 attempt.status='IN_PROGRESS';attempt.finished_at_utc=null;attempt.deadline_at_utc=new Date(Date.now()+1600).toISOString();await go('/postulante/examen?attempt=1');await expect(page.locator('[data-receipt]')).toContainText('El tiempo terminó',{timeout:10000});assert.equal(submits,1);
 role='RECRUITER';fail=true;await go('/reclutador/examenes');await expect(page.locator('[data-ex-retry]')).toBeVisible();await shot('m05-error');fail=false;await page.locator('[data-ex-retry]').click();await expect(page.getByRole('link',{name:'Ver prueba'})).toBeVisible();
 expiredSession=true;await page.reload();await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-signin]')).toBeVisible();
 assert.deepEqual(errors,[]);console.log('M05 UI aprobada: editor, preguntas, error sin pérdida, publicación, instrucciones, guardado/reintento/recarga, avance, envío, expiración, sesión, móvil y oscuro. Solicitudes de respuesta: '+answerCalls);
}finally{await browser.close();}
