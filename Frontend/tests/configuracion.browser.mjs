import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let failure=false,expired=false,role='RECRUITER';
const session=()=>({user:{id:'1',name:'Ana Torres',email:'ana@example.test',phone:null,dni:null,role,kind:'COMPANY',account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
await page.route('**/api/v1/**',route=>{
 const path=new URL(route.request().url()).pathname;
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path.endsWith('/auth/logout'))return route.fulfill({status:204});
 if(path.endsWith('/me')||path.endsWith('/auth/session/refresh'))return expired?send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'test'}}):failure?send(503,{error:{code:'UNAVAILABLE',message:'No se pudo cargar la cuenta. Intenta de nuevo.',request_id:'test'}}):send(200,session());
 if(path.endsWith('/auth/login'))return send(200,session());
 return send(200,{items:[],total:0,page:1,page_size:20});
});
try{
 await page.goto(base+'/configuracion');
 await expect(page.locator('[data-user-name]')).toHaveText('Ana Torres');
 await expect(page.locator('[data-private]')).toBeVisible();
 await expect(page.locator('header [data-theme],header [data-contrast-toggle],[data-space],[data-logout]')).toHaveCount(0);
 // La traducción de nodos nuevos no debe sobrescribir el nombre de la cuenta.
 await page.evaluate(()=>{const el=document.createElement('p');el.dataset.i18n='texto.TGVy';document.body.append(el);});
 await expect(page.locator('[data-user-name]')).toHaveText('Ana Torres');
 await page.locator('[data-profile-trigger]').click();
 await expect(page.locator('[data-profile-menu] [role=menuitem]')).toHaveCount(3);
 await page.keyboard.press('End');await expect(page.locator('[data-profile-logout]')).toBeFocused();
 await page.keyboard.press('Escape');
 await page.locator('[data-sidebar-collapse]').click();await expect(page.locator('[data-workspace]')).toHaveClass(/sidebar-collapsed/);
 await page.locator('[data-sidebar-collapse]').click();
 await page.getByRole('radio',{name:'Oscuro',exact:true}).check();
 await expect(page.locator('html')).toHaveClass(/dark/);
 await page.reload();await expect(page.getByRole('radio',{name:'Oscuro',exact:true})).toBeChecked();
 await page.emulateMedia({colorScheme:'light'});
 await page.getByRole('radio',{name:'Sistema',exact:true}).check();await expect(page.locator('html')).not.toHaveClass(/dark/);
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveClass(/dark/);
 await page.getByRole('switch',{name:/Alto contraste/}).check();
 await expect(page.locator('html')).toHaveAttribute('data-contraste','alto');
 await page.reload();await expect(page.getByRole('switch',{name:/Alto contraste/})).toBeChecked();
 await page.getByRole('switch',{name:/Alto contraste/}).uncheck();
 await page.locator('[data-settings-link][href="#idioma"]').click();await expect(page.locator('[data-idioma]')).toBeVisible();
 await page.locator('[data-settings-link][href="#sonido"]').click();
 const sound=page.locator('[data-config-sound]');const checked=await sound.isChecked();await sound.setChecked(!checked);
 await page.reload();await expect(sound).toBeChecked({checked:!checked});
 await expect(page.locator('[data-config-vibration][role=switch]')).toBeVisible();
 await page.locator('[data-settings-link][href="#cuenta"]').click();await expect(page.locator('#cuenta')).toBeVisible();
 await page.goto(base+'/configuracion#ayuda');await expect(page.locator('#ayuda')).toBeVisible();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  await page.goto(base+'/configuracion#apariencia');await expect(page.locator('[data-user-name]')).toHaveText('Ana Torres');
  for(const dark of [false,true]){
   await page.getByRole('radio',{name:dark?'Oscuro':'Claro',exact:true}).check();
   await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:out+'/configuracion-'+width+'-'+(dark?'oscuro':'claro')+'.png',fullPage:true,animations:"disabled"});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  if(width===390){await page.locator('[data-menu]').click();await expect(page.locator('#account-sidebar')).toBeVisible();await page.locator('[data-menu-close]').click();}
 }
 failure=true;await page.reload();await expect(page.locator('[data-user-name]')).toHaveText('Cuenta no disponible');
 await expect(page.locator('[data-retry]')).toBeVisible();await expect(page.locator('[data-private]')).toBeHidden();
 await page.screenshot({path:out+'/configuracion-error.png',fullPage:true,animations:"disabled"});
 failure=false;await page.locator('[data-retry]').click();await expect(page.locator('[data-user-name]')).toHaveText('Ana Torres');
 expired=true;await page.reload();await expect(page.locator('[data-signin]')).toBeVisible();await expect(page.locator('[data-private]')).toBeHidden();
 expired=false;role='CANDIDATE';await page.goto(base+'/configuracion');await expect(page.locator('[data-app-nav]')).toBeAttached();
 await page.locator('[data-profile-trigger]').click();await page.locator('[data-profile-logout]').click();await expect(page).toHaveURL(/\/login/);
 await page.getByLabel('Correo electrónico',{exact:true}).fill('ana@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('Password123!');
 await page.locator('[data-submit]').click();await expect(page).toHaveURL(/postulante\/ofertas/);
 await expect(page.locator('[data-user-name]')).toHaveText('Ana Torres');await expect(page.locator('.ui-toast')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 console.log('OK: shell, menú, carga/traducción, error/reintento, sesión, login sin toast, tabs, tema sistema/persistencia, switches, móvil, oscuro y capturas.');
}finally{await browser.close();}
