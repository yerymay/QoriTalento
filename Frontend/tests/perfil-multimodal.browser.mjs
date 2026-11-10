// Prueba con respuestas simuladas; no modifica cuentas reales.
// Con Astro iniciado: QORI_TEST_URL=http://127.0.0.1:3012 node tests/perfil-multimodal.browser.mjs
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const base = process.env.QORI_TEST_URL ?? 'http://127.0.0.1:3009';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__sonidos = []; window.__vibraciones = [];
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: pattern => { window.__vibraciones.push(pattern); return true; } });
  HTMLMediaElement.prototype.play = function () { window.__sonidos.push(new URL(this.src).pathname); return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function () {};
});
const user = { id: '1', name: 'María Prueba', email: 'maria@example.test', phone: null, role: 'RECRUITER', kind: 'COMPANY', account_state: 'ACTIVE' };
let falla = false, guardados = 0;
await page.route('**/api/v1/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/me') && route.request().method() === 'PATCH') {
    guardados++;
    return falla ? route.fulfill({ status: 503, json: { error: { message: 'No se pudo guardar' } } }) : route.fulfill({ json: { user, verification_required: false } });
  }
  if (path.endsWith('/me') || path.endsWith('/refresh')) return route.fulfill({ json: { user, expires_at: new Date(Date.now() + 1800000).toISOString() } });
  return route.fulfill({ status: 404, json: { error: { message: 'No disponible' } } });
});
try {
  for (const sound of ['exito','advertencia','error']) assert.equal((await page.request.get(`${base}/audio/${sound}.mp3`)).status(), 200);
  await page.goto(`${base}/perfil`);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  assert.equal(await page.locator('[data-profile-sound]').isVisible(), false);
  await page.getByText('Opciones de confirmación', { exact: true }).click();
  const sonido = page.getByLabel('Sonido', { exact: true });
  const vibracion = page.getByLabel('Vibración, si está disponible');
  assert.equal(await sonido.isChecked(), true); assert.equal(await vibracion.isChecked(), true);
  await sonido.focus(); await page.keyboard.press('Space'); assert.equal(await sonido.isChecked(), false); await page.keyboard.press('Space'); assert.equal(await sonido.isChecked(), true);
  await page.getByLabel('Correo electrónico').fill('otro@example.test');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('dialog', { name: 'Se necesitará verificar tu cuenta' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.__sonidos), ['/audio/advertencia.mp3']);
  assert.equal(guardados, 0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).last().click();
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByText('Cambios guardados', { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.__sonidos), ['/audio/advertencia.mp3', '/audio/exito.mp3']);
  await page.getByRole('button', { name: 'Editar', exact: true }).click(); falla = true;
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByText('No se pudo guardar', { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.__sonidos), ['/audio/advertencia.mp3', '/audio/exito.mp3', '/audio/error.mp3']);
  assert.deepEqual(await page.evaluate(() => window.__vibraciones), [[20,50,20],25,[35,60,35]]);
  await sonido.uncheck(); await vibracion.uncheck(); falla = false;
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByText('Cambios guardados', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__sonidos.length), 3);
  assert.equal(await page.evaluate(() => window.__vibraciones.length), 3);
  assert.deepEqual(errors, []);
  console.log('Perfil: advertencia, cancelación, éxito, error, preferencias y teclado verificados.');
} finally { await browser.close(); }
