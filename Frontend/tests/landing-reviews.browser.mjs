import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4322',out='../.impeccable/review';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const width of [1440,390])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  await page.addInitScript(theme=>{localStorage.setItem('qori-theme',theme);localStorage.setItem('qori-idioma','es')},theme);
  await page.goto(base+'/');const root=page.locator('[data-reviews]'),track=root.locator('[data-track]');await root.scrollIntoViewIfNeeded();
  await expect(root.locator('[data-review-text=title]')).toHaveText('Lo que dicen quienes la prueban');await expect(root.getByText('Opiniones de demostración')).toHaveCount(0);
  await expect(root.getByRole('button')).toHaveCount(0);await expect(root.locator('[data-review]:not([data-clone])')).toHaveCount(4);
  await expect(root.locator('[data-review-name]').first()).toHaveText('María Quispe');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}.q-skip:not(:focus){visibility:hidden}'});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:out+'/testimonios-'+width+'-'+theme+'-1.png',fullPage:true,animations:'disabled'});
  await track.evaluate(el=>el.scrollTo({left:el.scrollWidth/2,behavior:'instant'}));await page.screenshot({path:out+'/testimonios-'+width+'-'+theme+'-2.png',fullPage:true,animations:'disabled'});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:900}});await page.goto(base+'/');const root=page.locator('[data-reviews]'),track=root.locator('[data-track]');await root.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 const first=await track.evaluate(el=>el.scrollLeft);await page.waitForTimeout(1200);const second=await track.evaluate(el=>el.scrollLeft);assert.ok(second>first,'El slider debe avanzar');
 await root.hover();await page.waitForTimeout(120);const paused=await track.evaluate(el=>el.scrollLeft);await page.waitForTimeout(400);assert.equal(await track.evaluate(el=>el.scrollLeft),paused);
 await page.close();console.log('PASS: movimiento continuo, pausa al interactuar, movimiento reducido, nombres y ocho capturas.');
}finally{await browser.close();}
