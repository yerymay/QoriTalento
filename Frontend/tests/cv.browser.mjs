// UI de M04 con API sintética; no accede a CV ni cuentas reales.
// Astro activo: node tests/cv.browser.mjs [http://127.0.0.1:4321]
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:4321',output=new URL('../../.impeccable/review/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
let role='CANDIDATE', fail=false, empty=false, delay=false, failSave=false, expired=false, saves=0, notes=[];
let releaseReview;
function pdfFixture(){
  const content='BT /F1 18 Tf 50 740 Td (Ana Torres) Tj 0 -40 Td (CV sintetico para verificar la vista) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let out='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=out.length;out+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(out);
}
const profile={name:'Ana Torres',email:'ana@example.test',phone:'+51 987 654 321',location:'Abancay, Perú',summary:'Desarrolladora de sistemas de información.',education:['UNAMBA · Ingeniería Informática\n2018 – 2023'],experience:['Empresa Demo · Desarrolladora\n2023 – Actualidad\nImplementación de aplicaciones web.'],skills:['TypeScript','SQL','Git'],languages:['Español nativo','Inglés intermedio']};
let data={application_id:'1',title:'Desarrolladora de aplicaciones web',status:'PENDING',document:{id:'10',filename:'cv-ana-torres.pdf'},extraction:{profile,warnings:[],text:'[Página 1] Ana Torres\nFormación académica\nUNAMBA',evidence:Object.fromEntries(Object.keys(profile).map(k=>[k,[{page:1,text:String(profile[k])}]]))},confirmed:null,current_profile_id:null,can_confirm:true};
await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api/v1/',''),method=route.request().method();
  const respond=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  const error=(status,code,message)=>respond(status,{error:{code,message,request_id:'fixture'}});
  if(path==='me'||path==='auth/session/refresh')return expired?error(401,'UNAUTHENTICATED','Tu sesión terminó.'):respond(200,{user:{id:'1',name:'Ana Torres',email:'cuenta@example.test',phone:null,role,kind:role==='RECRUITER'?'COMPANY':null,account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
  if(path==='auth/logout')return route.fulfill({status:204});
  if(path.endsWith('/cv/10'))return route.fulfill({status:200,contentType:'application/pdf',body:pdfFixture()});
  if(path.endsWith('/cv-extraction')){
    if(delay)await new Promise(resolve=>{releaseReview=resolve;});
    if(fail)return error(503,'SERVICE_UNAVAILABLE','No se pudo leer el CV. Intenta nuevamente.');
    return respond(200,empty?{...data,document:null,extraction:null}:role==='RECRUITER'?{...data,extraction:null,can_confirm:false}:data);
  }
  if(path.endsWith('/profile-confirmation')){
    saves++;if(failSave)return error(503,'SERVICE_UNAVAILABLE','No se pudo guardar. Tus correcciones siguen en el formulario.');
    const input=route.request().postDataJSON();assert.equal(input.document_id,'10');assert.equal(input.profile.name,'Ana Torres Corregida');
    data={...data,confirmed:{id:'1',source_cv_id:'10',confirmed_at:new Date().toISOString(),profile:input.profile},can_confirm:false,current_profile_id:'1'};return respond(200,data);
  }
  if(path==='candidate/profile')return respond(200,{profile:data.confirmed});
  if(path==='recruiter/jobs/1/applications')return respond(200,{items:[{id:'1',name:'Ana Torres Corregida',title:data.title,confirmed:true}]});
  if(path.endsWith('/notes')){if(method==='POST')notes.push({id:'1',body:route.request().postDataJSON().body,created_at:new Date().toISOString()});return respond(method==='POST'?201:200,{items:notes});}
  return error(404,'NOT_FOUND','Ruta no disponible');
});
const go=async path=>{await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.locator('[data-private]').waitFor({state:'visible'});};
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'astro-dev-toolbar { display:none!important } *, *::before, *::after { transition:none!important; animation:none!important }'});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento horizontal');await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:true});};
try{
  delay=true;await go('/postulante/cv?application=1');await expect(page.locator('[data-cv-loading]')).toBeVisible();await expect.poll(()=>typeof releaseReview).toBe('function');delay=false;releaseReview();await page.locator('[data-cv-content]').waitFor({state:'visible'});
  await shot('m04-desktop');
  await page.getByRole('button',{name:'Editar datos',exact:true}).click();await page.getByLabel('Nombre completo').fill('Ana Torres Corregida');
  await page.locator('[data-cv-reviewed]').check();failSave=true;await page.getByRole('button',{name:'Confirmar y actualizar perfil'}).click();
  await expect(page.locator('[data-cv-message]')).toContainText('Tus correcciones siguen');await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana Torres Corregida');
  failSave=false;await page.getByRole('button',{name:'Confirmar y actualizar perfil'}).click();await expect(page.locator('[data-cv-message]')).toContainText('Perfil actualizado');assert.equal(saves,2);await expect(page.getByLabel('Nombre completo')).toHaveAttribute('readonly','');
  await page.getByRole('link',{name:'Ver mi perfil actualizado'}).click();await expect(page.locator('[data-cv-profile-values]')).toContainText('Ana Torres Corregida');
  data={...data,confirmed:null,can_confirm:true,extraction:{...data.extraction,profile:{...profile,languages:[],phone:''},warnings:['Hay campos no detectados. Puedes completarlos.']}};
  await page.setViewportSize({width:390,height:844});await go('/postulante/cv?application=1');await page.locator('[data-cv-content]').waitFor({state:'visible'});await shot('m04-mobile');
  await page.getByRole('tab',{name:'PDF original'}).click();await expect(page.locator('[data-cv-panel="pdf"]')).toBeVisible();await expect(page.locator('[data-cv-panel="data"]')).toBeHidden();await page.getByRole('tab',{name:'PDF original'}).press('ArrowLeft');await expect(page.locator('[data-cv-panel="data"]')).toBeVisible();
  await page.evaluate(()=>document.documentElement.classList.add('dark'));await shot('m04-mobile-dark');
  fail=true;await go('/postulante/cv?application=1');await expect(page.locator('[data-cv-retry]')).toBeVisible();await shot('m04-error');fail=false;await page.locator('[data-cv-retry]').click();await expect(page.locator('[data-cv-content]')).toBeVisible();
  empty=true;await go('/postulante/cv?application=1');await expect(page.locator('[data-cv-empty]')).toBeVisible();empty=false;
  role='RECRUITER';data={...data,confirmed:{id:'1',source_cv_id:'10',confirmed_at:new Date().toISOString(),profile:{...profile,name:'Ana Torres Corregida'}}};
  await page.setViewportSize({width:1440,height:1000});await go('/reclutador/postulantes?job=1');await page.getByRole('link',{name:'Revisar CV de Ana Torres Corregida'}).click();await expect(page.locator('[data-cv-form]')).toBeVisible();await expect(page.getByLabel('Nombre completo')).toHaveAttribute('readonly','');
  await page.getByLabel('Nueva observación').fill('Experiencia contrastada con el documento.');await page.getByRole('button',{name:'Guardar nota'}).click();await expect(page.locator('[data-cv-notes]')).toContainText('Experiencia contrastada');await shot('m04-recruiter-desktop');
  await page.setViewportSize({width:390,height:844});await shot('m04-recruiter-mobile');
  expired=true;await page.evaluate(()=>document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:{}})));await page.reload();await expect(page.locator('[data-signin]')).toBeVisible();await expect(page.locator('[data-private]')).toBeHidden();
  assert.deepEqual(errors,[]);console.log('M04 UI: carga, edición, recuperación, confirmación, perfil, parcial, vacío, móvil, oscuro, pestañas, notas, sesión y desbordamiento verificados.');
}finally{await browser.close();}
