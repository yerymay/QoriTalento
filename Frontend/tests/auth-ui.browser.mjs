// Capturas y comprobaciones con API simulada. No crea cuentas ni inicia sesiones reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review/auth';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],files=[];
try{
 for(const width of [1440,390])for(const theme of ['light','dark'])for(const screen of ['login','registro']){
  const page=await browser.newPage({viewport:{width,height:width===1440?1000:844},colorScheme:theme});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>{localStorage.setItem('qori-theme',theme==='dark'?'light':'dark');localStorage.setItem('qori-contrast','high');},theme);
  await page.clock.install();await page.clock.pauseAt(new Date());
  let mode='hold',release;
  await page.route('**/api/v1/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.endsWith('/me'))return route.fulfill({status:401,json:{error:{code:'UNAUTHORIZED',message:'Sesión requerida'}}});
   if(mode==='hold')await new Promise(r=>release=r);
   if(mode==='network')return route.abort('internetdisconnected');
   const status=mode==='invalid'?(screen==='login'?401:400):mode==='rate'?429:mode==='server'?503:200;
   return route.fulfill({status,json:status!==200?{error:{code:'UI_FIXTURE',message:'El correo electrónico no existe'}}:screen==='login'?{user:{id:'1',role:'CANDIDATE'},expires_at:'2026-12-22T00:00:00Z'}:{message:'Cuenta registrada',user:{id:'1',role:'CANDIDATE'}}});
  });
  await page.route('**/postulante/ofertas',route=>{return route.fulfill({contentType:'text/html',body:'<h1>Inicio del postulante</h1>'});});
  await page.goto(base+'/'+screen+'?role=CANDIDATE');
  await expect(page.locator('html')).toHaveClass(theme==='dark'?/dark/:/^(?!.*dark)/);
  await expect(page.locator('html')).not.toHaveAttribute('data-contraste','alto');
  await expect(page.getByRole('button',{name:/Alto contraste|Tema/})).toHaveCount(0);
  const form=page.locator('[data-auth-form]'),email=page.locator('#email'),password=page.locator('#password'),submit=page.locator('[data-submit]');
  const shot=async state=>{
   await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}.q-skip:not(:focus){visibility:hidden}'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const file=screen+'-'+state+'-'+width+'-'+theme+'.png';await page.screenshot({path:out+'/'+file,fullPage:true,animations:'disabled'});files.push(file);
  };
  await page.emulateMedia({contrast:'more'});await expect(page.locator('html')).toHaveAttribute('data-contraste','alto');await page.emulateMedia({contrast:'no-preference'});await expect(page.locator('html')).not.toHaveAttribute('data-contraste','alto');
  await shot('reposo');
  await email.fill('correo-incompleto');await expect(page.locator('#email-error')).toBeHidden();await password.focus();await expect(page.locator('#email-error')).toBeVisible();await shot('campo-invalido');
  await email.fill('ana.torres@example.test');await password.focus();await expect(page.locator('#email-error')).toBeHidden();
  if(screen==='registro'){await page.locator('#name').fill('Ana Torres');await page.locator('#confirm_password').fill('AccesoSeguro!2026');}
  const fillPassword=()=>password.fill('AccesoSeguro!2026');
  await fillPassword();
  const eye=page.locator('[data-password]').first();await eye.click();await expect(eye).toHaveAttribute('aria-label','Ocultar contraseña');await expect(password).toHaveAttribute('type','text');await eye.click();await expect(eye).toHaveAttribute('aria-label','Mostrar contraseña');
  for(const [state,title] of [['invalid',screen==='login'?'Correo o contraseña incorrectos':'No se pudo crear la cuenta'],['network','Sin conexión'],['rate','Demasiados intentos'],['server',screen==='login'?'No se pudo iniciar sesión':'No se pudo crear la cuenta']]){
   mode=state;await fillPassword();if(screen==='registro')await page.locator('#confirm_password').fill('AccesoSeguro!2026');
   assert.deepEqual(await form.locator('input').evaluateAll(inputs=>inputs.filter(i=>!i.checkValidity()).map(i=>({id:i.id,message:i.validationMessage,value:i.value,disabled:i.disabled}))),[]);
   await submit.click();await expect(page.locator('[data-error-title]')).toHaveText(title);
   await expect(password).toHaveValue('');await expect(password).toBeFocused();await expect(email).toHaveValue('ana.torres@example.test');
   await expect(page.locator('[data-message]')).toHaveAttribute('role','alert');await expect(page.locator('[data-message]')).not.toContainText('no existe');
   assert.ok(await page.locator('[data-message]').evaluate(el=>el.nextElementSibling?.querySelector('input')?.id==='email'));
   if(state==='network'||state==='server'){await expect(page.locator('[data-auth-retry]')).toBeVisible();await page.locator('[data-auth-retry]').click();await expect(password).toBeFocused();}
   await shot(state);
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('[data-message]').evaluate(el=>getComputedStyle(el).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  mode='hold';await fillPassword();if(screen==='registro')await page.locator('#confirm_password').fill('AccesoSeguro!2026');
  const idleColor=await submit.evaluate(el=>getComputedStyle(el).backgroundColor);
  const idleBox=await submit.boundingBox();await submit.click();
  await expect(submit).toHaveAttribute('data-state','busy');await expect(submit).toBeDisabled();await expect(page.locator('[data-submit-spinner]')).toBeVisible();
  assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),idleColor);
  const busyBox=await submit.boundingBox();assert.equal(idleBox.height,busyBox.height);assert.equal(idleBox.width,busyBox.width);await shot('ejecucion');
  mode='success';release();await expect(submit).toHaveAttribute('data-state','success');
  await expect(page.locator('[data-submit-check]')).toBeVisible();await expect(page.locator('[data-message]')).toBeHidden();
  await expect(page.getByText('Sesión iniciada correctamente',{exact:true})).toHaveCount(0);
  await shot('exito');
  if(screen==='login'){await page.clock.runFor(299);assert.equal(new URL(page.url()).pathname,'/login');await page.clock.runFor(1);await expect(page).toHaveURL(/postulante\/ofertas/);}
  await page.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(out+'/index.html','<!doctype html><html lang="es"><meta charset="utf-8"><title>Capturas de login y registro</title><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:16px}ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;list-style:none;padding:0}img{width:100%;height:280px;object-fit:contain;object-position:top;background:#e2e8f0}li{min-width:0}a{color:#0069a8;overflow-wrap:anywhere}</style><h1>Login y registro</h1><p>Estados reales de la interfaz con API simulada. 1440 y 390 px; claro y oscuro.</p><ul>'+files.map(f=>'<li><a href="'+f+'"><img loading="lazy" src="'+f+'" alt="'+f+'">'+f+'</a></li>').join('')+'</ul>');
 console.log('PASS: '+files.length+' capturas; estados, errores seguros, contraseña limpia/foco, correo conservado, validación blur, tema/contraste del sistema, ojo accesible, tamaño estable, 300 ms, movimiento reducido.');
}finally{await browser.close();}
