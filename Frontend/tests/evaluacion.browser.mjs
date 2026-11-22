// M06 con API sintética: no modifica usuarios, perfiles o resultados reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:4321',output=new URL('../../.impeccable/review/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
let prepared=false,assisted=false,saved=false,fail=false,failSave=false,expired=false,expireOnSave=false,stale=false,confirmed=true,delay=false;
const sources=[{ref:'skills:0',text:'Desarrollo de aplicaciones con TypeScript y pruebas automatizadas.'},{ref:'languages:0',text:'Inglés básico.'}];
const criteria=[{id:'1',text:'Desarrollo con TypeScript',weight:30,suggestion:null,review:null},{id:'2',text:'Inglés avanzado para documentación técnica',weight:30,suggestion:null,review:null}];
let revision=1;
const view=()=>({application_id:'1',job_id:'10',job_title:'Desarrollador/a de aplicaciones web',candidate_name:'Valeria Quispe',confirmed,requirement_count:2,profile_max:60,
  evaluation:prepared?{revision,profile_version_id:'5',sources,criteria,profile_max:60,model:assisted?'qwen2.5:7b-instruct':null,reviewed_by:saved?'1':null,reviewed_at:saved?new Date().toISOString():null}:null,
  stale,exam_count:1,grades:[{attempt_id:'20',title:'Fundamentos web',correct:3,total:4,unanswered:1,percent:75}],
  profile_points:saved?45:0,exam_points:30,total:saved&&!stale?75:null,
  pending:stale?['Las fuentes cambiaron. Se conserva la revisión anterior; la reevaluación está pendiente de B-07.']:saved?[]:['Hay requisitos sin revisión o sin evidencia suficiente.']});
await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api/v1/',''),method=route.request().method();
  const respond=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  const error=(status,message)=>respond(status,{error:{code:'FIXTURE',message,request_id:'fixture'}});
  if(path==='me'||path==='auth/session/refresh')return expired?error(401,'Tu sesión terminó.'):respond(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role:'RECRUITER',kind:'COMPANY',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
  if(path==='auth/logout')return route.fulfill({status:204});
  if(path==='recruiter/jobs/10/applications')return respond(200,{items:[{id:'1',name:'Candidato de prueba',title:'Desarrollador/a de aplicaciones web',confirmed:true}]});
  if(path.startsWith('recruiter/applications/1/evaluation')){
    if(expired)return error(401,'Tu sesión terminó.');
    if(fail)return error(503,'No se pudo cargar. Intenta de nuevo.');
    if(path.endsWith('/assist')){assisted=true;revision++;criteria.forEach((c,i)=>c.suggestion={rating:i?'PARTIAL':'MEETS',source_refs:[i?'languages:0':'skills:0'],explanation:i?'El nivel básico aporta evidencia parcial para el requisito.':'La habilidad TypeScript está declarada en el perfil confirmado.'});return respond(200,view());}
    if(path.endsWith('/review')){
      if(expireOnSave){expired=true;return error(401,'Tu sesión terminó.');}
      if(failSave)return error(503,'No se pudo guardar. Conservamos tus cambios.');
      const input=route.request().postDataJSON();assert.equal(input.revision,revision);
      input.criteria.forEach((c,i)=>Object.assign(criteria[i],{review:c.review,weight:c.weight}));revision++;saved=true;return respond(200,view());
    }
    if(method==='POST')prepared=true;
    if(delay)await new Promise(resolve=>setTimeout(resolve,400));
    return respond(200,view());
  }
  return error(404,'No disponible: '+path);
});
const go=async()=>{await page.goto(base+'/reclutador/evaluacion?application=1',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-private]')).toBeVisible();await expect(page.locator('[data-evaluation-loading]')).toBeHidden();};
const shot=async name=>{
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'astro-dev-toolbar{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important}'});
  await page.evaluate(()=>scrollTo(0,0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento '+name);
  await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:true});
};
try{
  await go();await expect(page.getByRole('button',{name:'Preparar evaluación'})).toBeEnabled();await shot('m06-empty');
  await page.getByRole('button',{name:'Preparar evaluación'}).click();
  await expect(page.locator('[data-evaluation-form]')).toBeVisible();
  await page.getByRole('button',{name:'Solicitar sugerencias de Ollama'}).click();
  await expect(page.locator('[data-use]')).toHaveCount(2);await shot('m06-suggestions-desktop');
  for(const button of await page.locator('[data-use]').all())await button.click();
  await page.locator('[data-human-confirm]').check();
  failSave=true;await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();
  await expect(page.locator('[data-evaluation-message]')).toContainText('Conservamos');
  await expect(page.locator('[data-rating]').first()).toHaveValue('MEETS');
  await expect(page.locator('[data-explanation]').first()).toHaveValue('La habilidad TypeScript está declarada en el perfil confirmado.');
  failSave=false;await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();
  await expect(page.locator('[data-evaluation-total]')).toHaveText('75 / 100');await shot('m06-reviewed-desktop');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.classList.add('dark'));await shot('m06-reviewed-mobile-dark');
  failSave=true;await page.locator('[data-rating]').first().selectOption('PARTIAL');await page.locator('[data-human-confirm]').check();
  await page.getByRole('button',{name:'Guardar revisión',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-evaluation-message]')).toContainText('Conservamos');await expect(page.locator('[data-evaluation-message]')).toBeFocused();await expect(page.locator('[data-evaluation-message]')).toBeInViewport();
  await expect(page.locator('[data-rating]').first()).toHaveValue('PARTIAL');await page.screenshot({path:fileURLToPath(new URL('m06-save-error-mobile.png',output))});
  failSave=false;await page.getByRole('button',{name:'Guardar revisión',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-evaluation-message]')).toContainText('Revisión guardada');await expect(page.locator('[data-evaluation-message]')).toBeFocused();await expect(page.locator('[data-evaluation-message]')).toBeInViewport();
  await page.screenshot({path:fileURLToPath(new URL('m06-save-success-mobile.png',output))});
  stale=true;await go();await expect(page.locator('[data-rating]').first()).toBeDisabled();await expect(page.locator('[data-evaluation-total]')).toContainText('Pendiente');await shot('m06-stale-mobile');
  stale=false;fail=true;await go();await expect(page.locator('[data-evaluation-message]')).toContainText('No se pudo cargar');
  fail=false;await page.getByRole('button',{name:'Volver a cargar',exact:true}).click();await expect(page.locator('[data-evaluation-form]')).toBeVisible();
  prepared=false;confirmed=false;await go();await expect(page.getByRole('button',{name:'Preparar evaluación'})).toBeDisabled();
  confirmed=true;prepared=true;await go();
  await page.locator('[data-rating]').first().selectOption('PARTIAL');expireOnSave=true;
  await page.locator('[data-human-confirm]').check();await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();
  await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-evaluation-content]')).toBeEmpty();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'ok',screenshots:7,checks:'preparación, sugerencia, revisión, error sin pérdida, móvil, oscuro, fuentes nuevas, perfil sin confirmar, expiración, limpieza de datos al expirar'}));
}finally{await browser.close();}
