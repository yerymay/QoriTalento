// Plantilla D con datos sintéticos; no modifica cuentas reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',dialog=>dialog.accept());
let user={id:'1',name:'Ana Torres',email:'ana@example.test',phone:'+51 987654321',dni:'12345678',role:'RECRUITER',kind:'COMPANY',account_state:'ACTIVE'};
let fail=false,expired=false,verification=false,delay=false,writes=[];
await page.route('**/api/v1/**',async route=>{
 const path=new URL(route.request().url()).pathname,method=route.request().method();
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path.endsWith('/me')&&method==='PATCH'){
  const data=route.request().postDataJSON();writes.push(data);
  if(delay)await new Promise(r=>setTimeout(r,650));
  if(expired)return send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'fixture'}});
  if(fail)return send(503,{error:{code:'TEST_ERROR',message:'No se pudo guardar. Intenta nuevamente.',request_id:'fixture'}});
  if(verification)return send(200,{user,verification_required:true});
  user={...user,...data};return send(200,{user,verification_required:false});
 }
 if(path.endsWith('/me')||path.endsWith('/auth/session/refresh'))return expired?send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'fixture'}}):send(200,{user,expires_at:new Date(Date.now()+1800000).toISOString()});
 return send(200,{profile:null});
});
const personal=page.locator('[data-account-section=personal]'),contact=page.locator('[data-account-section=contacto]');
const capture=async name=>{await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/perfil-'+name+'.png',fullPage:true,animations:'disabled'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));};
try{
 await page.goto(base+'/perfil');await expect(page.locator('[data-account-name]')).toHaveText('Ana Torres');
 await expect(page.locator('[data-account-role]')).toHaveText('Reclutador');await expect(page.locator('[data-account-avatar]')).toHaveText('AT');
 await expect(page.locator('[data-account-value=dni]')).toHaveText('••••5678');
 await personal.getByRole('button',{name:'Mostrar DNI',exact:true}).click();await expect(page.locator('[data-account-value=dni]')).toHaveText('12345678');
 await personal.getByRole('button',{name:'Ocultar DNI',exact:true}).click();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  for(const dark of [false,true]){await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await capture(width+'-'+(dark?'oscuro':'claro'));}
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await page.locator('[data-account-edit]').click();await expect(page.getByLabel('Nombre completo',{exact:true})).toBeFocused();
 await expect(personal.locator('[name=dni]')).toHaveAttribute('type','password');
 await page.getByLabel('Nombre completo',{exact:true}).fill('A');await personal.getByRole('button',{name:'Guardar cambios'}).click();assert.equal(writes.length,0);
 await expect(page.locator('#name-error')).toBeVisible();
 await page.getByLabel('Nombre completo',{exact:true}).fill('Ana Torres Quispe');await page.getByLabel('DNI (opcional)',{exact:true}).fill('123');
 await personal.getByRole('button',{name:'Guardar cambios'}).click();assert.equal(writes.length,0);await expect(page.locator('#dni-error')).toBeVisible();
 await page.getByLabel('DNI (opcional)',{exact:true}).fill('12345678');
 fail=true;await personal.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(personal.locator('[data-section-error]')).toBeVisible();await expect(page.getByLabel('Nombre completo',{exact:true})).toHaveValue('Ana Torres Quispe');
 await capture('error-sin-perdida');
 fail=false;delay=true;await personal.getByRole('button',{name:'Reintentar',exact:true}).click();
 await expect(personal.locator('[data-section-save]')).toHaveText('Guardando…');
 await expect(personal.locator('[name=name]')).toBeDisabled();await expect(personal.locator('[data-section-save]')).toHaveText('Guardado');
 await expect(page.locator('[data-account-name]')).toHaveText('Ana Torres Quispe');await expect(personal.locator('[data-section-edit]')).toBeFocused();
 await expect(page.locator('[data-account-value=dni]')).toHaveText('••••5678');assert.equal(writes.at(-1).email,'ana@example.test');
 await expect(page.locator('.ui-toast')).toHaveCount(0);
 await contact.locator('[data-section-edit]').click();await page.getByLabel('Correo electrónico',{exact:true}).fill('nuevo@example.test');
 const count=writes.length;await contact.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(page.locator('[data-confirm]')).toBeVisible();assert.equal(writes.length,count);
 await page.locator('[data-confirm]').getByRole('button',{name:'Cancelar',exact:true}).click();
 await expect(page.getByLabel('Correo electrónico',{exact:true})).toHaveValue('nuevo@example.test');
 await contact.locator('[data-section-cancel]').click();await expect(page.locator('[data-account-value=email]')).toHaveText('ana@example.test');
 user={...user,kind:'INDIVIDUAL',dni:null,phone:null};await page.reload();await expect(page.locator('[data-account-value=dni]')).toHaveText('No registrado');
 await contact.locator('[data-section-edit]').click();await contact.getByRole('button',{name:'Guardar cambios'}).click();await expect(page.locator('#phone-error')).toBeVisible();assert.equal(writes.length,count);
 await contact.locator('[name=phone]').fill('+51 987654321');
 verification=true;await contact.getByRole('button',{name:'Guardar cambios'}).click();await expect(page.locator('[data-confirm]')).toBeVisible();
 await page.locator('[data-confirm]').getByRole('button',{name:'Guardar y cerrar sesión',exact:true}).click();
 await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-signin]')).toBeVisible();
 await expect(page.locator('[data-account-name]')).toHaveText('');
 verification=false;user={...user,role:'CANDIDATE',kind:null,phone:null};await page.goto(base+'/perfil');
 await expect(page.locator('[data-account-role]')).toHaveText('Postulante');await expect(page.locator('[data-cv-profile-summary]')).toBeVisible();
 await page.locator('[data-account-edit]').click();await page.getByLabel('Nombre completo',{exact:true}).fill('Ana Editada');
 expired=true;await personal.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('#name')).toHaveValue('');await expect(page.locator('[data-account-value=dni]')).toHaveText('');
 assert.deepEqual(errors,[]);
 console.log('Plantilla D OK: cabecera, edición por sección, máscara DNI, validación, error/reintento, guardado inline/foco, cambios sensibles, roles, sesión y capturas 1440/390 claro/oscuro.');
}finally{await browser.close();}
