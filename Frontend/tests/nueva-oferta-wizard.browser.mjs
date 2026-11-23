import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
let saved;
await page.route('**/api/v1/**', async route => {
  const path = new URL(route.request().url()).pathname;
  const respond = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  if (path.endsWith('/me') || path.endsWith('/auth/session/refresh')) return respond({ user: { id: '1', name: 'Reclutador', email: 'test@example.test', role: 'RECRUITER', kind: 'COMPANY', account_state: 'ACTIVE' }, expires_at: new Date(Date.now() + 1800000).toISOString() });
  if (path.endsWith('/recruiter/jobs') && route.request().method() === 'POST') { saved = route.request().postDataJSON(); return respond({ ...saved, id: '1', status: 'DRAFT', published_at: null, closed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); }
  return respond({ items: [], total: 0, page: 1, page_size: 20 });
});
try {
  await page.goto((process.env.QORI_TEST_BASE ?? 'http://127.0.0.1:3010') + '/reclutador/nueva-oferta');
  await expect(page.locator('[data-job-editor]')).toBeVisible();
  await expect(page.locator('[data-wizard-indicator="0"]')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#description')).toBeHidden();
  if (process.env.QORI_WIZARD_CAPTURE) await page.screenshot({ path: process.env.QORI_WIZARD_CAPTURE, fullPage: true });
  await page.locator('#title').fill('Diseñador de producto');
  await page.locator('[data-wizard-next]').click();
  await expect(page.locator('[data-wizard-indicator="0"]')).toHaveAttribute('data-state', 'complete');
  await expect(page.locator('[data-wizard-indicator="1"]')).toHaveAttribute('aria-current', 'step');
  await page.locator('#description').fill('Diseñar experiencias accesibles.');
  await page.locator('#requirements').fill('Accesibilidad');
  await page.locator('[data-wizard-next]').click();
  await page.locator('#work_schedule').fill('Tiempo completo');
  await page.getByText('Horario flexible', { exact: true }).click();
  await page.locator('[data-wizard-next]').click();
  await expect(page.locator('[data-wizard-review]')).toContainText('Tiempo completo');
  await expect(page.locator('[data-wizard-review]')).toContainText('Horario flexible');
  await page.locator('[data-wizard-prev]').click(); await page.locator('[data-wizard-prev]').click();
  assert.equal(await page.locator('#description').inputValue(), 'Diseñar experiencias accesibles.');
  await page.locator('[data-save-job]').click();
  await expect(page.locator('[data-dirty-message]')).toHaveText('Guardado');
  assert.equal(saved.work_schedule, 'Tiempo completo'); assert.deepEqual(saved.benefits, ['Horario flexible']);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log('PASS: navegación, revisión, borrador y ancho móvil.');
} finally { await browser.close(); }
