// Contratos de interacción de la biblioteca UI; no usa datos ni API reales.
import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, access} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const out='../.impeccable/review';
await mkdir(out,{recursive:true});
try{
  await page.goto(base+'/dev/componentes');
  await page.locator('[data-ui-menu][data-ready]').waitFor();
  await page.addStyleTag({content:'astro-dev-toolbar {display:none !important;}'});
  await expect(page.locator('main h1')).toHaveText('Componentes de interfaz');
  await expect(page.locator('button[aria-busy="true"]')).toHaveCount(5);
  for(const el of await page.locator('button[aria-busy="true"]').all())await expect(el).toBeDisabled();
  const trigger=page.locator('[data-ui-menu-trigger]'),menu=page.locator('#gallery-menu'),items=menu.locator('[role=menuitem]');
  await trigger.focus();await page.keyboard.press('ArrowDown');await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('End');await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
  await page.keyboard.press('ArrowUp');await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('Home');await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');await expect(menu).toBeHidden();
  await trigger.click();await items.nth(1).click();await expect(page.locator('[data-menu-result]')).toContainText('Duplicar');
  await page.locator('[data-demo-save]').click();await expect(page.locator('[data-demo-save-status]')).toHaveText('Guardando…');
  await expect(page.locator('[data-demo-save-status]')).toHaveText('Guardado');
  await expect(page.locator('.ui-toast')).toHaveCount(0);
  // Un aviso nunca cubre un botón: el área de notificaciones tiene espacio propio.
  await page.locator('[data-demo-toast=success]').click();
  const success=page.locator('.ui-toast').last();
  await expect(success.locator('[role=status]')).toBeVisible();
  await success.hover();const before=await success.locator('progress').getAttribute('value');
  await page.waitForTimeout(700);
  assert.equal(await success.locator('progress').getAttribute('value'),before,'Hover debe pausar la cuenta');
  await page.mouse.move(0,0);
  await expect(success).toHaveCount(0,{timeout:6500});
  await page.locator('[data-demo-toast=error]').click();
  await expect(page.locator('.ui-toast [role=alert]')).toBeVisible();
  await page.waitForTimeout(5100);await expect(page.locator('.ui-toast')).toHaveCount(1);
  await page.locator('.ui-toast').getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.locator('.ui-toast[data-tone=success]')).toHaveCount(1);
  await page.locator('.ui-toast button[aria-label]').click();
  await page.locator('[data-demo-toast=stack]').click();
  await expect(page.locator('.ui-toast')).toHaveCount(3);
  await page.locator('[data-demo-toast=warning]').click();
  await expect(page.locator('.ui-toast')).toHaveCount(3);
  await expect(page.locator('.ui-toast').last()).toHaveAttribute('data-tone','warning');
  const overlap=await page.evaluate(()=>{const region=document.querySelector('[data-toast-region]').getBoundingClientRect();return [...document.querySelectorAll('main button')].some(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.top<region.bottom&&r.bottom>region.top;});});
  assert.equal(overlap,false,'La región de avisos debe ocupar espacio sin cubrir controles');
  while(await page.locator('.ui-toast button[aria-label]').count())await page.locator('.ui-toast button[aria-label]').first().click();
  await expect(page.locator('.ui-toast')).toHaveCount(0);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    for(const dark of [false,true]){
      await page.locator('[data-gallery-theme]').setChecked(dark);
      await page.locator('main h1').click();
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:out+'/componentes-'+width+'-'+(dark?'oscuro':'claro')+'.png',fullPage:true});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Sin desbordamiento horizontal');
      await trigger.click();
      const rect=await menu.boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width,'Menú dentro de la pantalla');
      await page.keyboard.press('Escape');
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.ui-skeleton').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.goto(base+'/login');await expect(page.locator('[data-auth-form]')).toBeVisible();
  await expect(page.locator('.ui-toast')).toHaveCount(0);
  assert.deepEqual(errors,[]);
  await assert.rejects(access('dist/dev/componentes/index.html'));
  console.log('UI OK: teclado, estados, avisos, pausa, reintento, máximo 3, temas, 390/1440, movimiento reducido y ruta solo de desarrollo.');
}finally{await browser.close();}
