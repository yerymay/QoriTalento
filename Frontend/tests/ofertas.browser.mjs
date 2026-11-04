// Revisión reproducible de UI con API sintética; no modifica usuarios ni ofertas reales.
// Ejecutar con Astro en 127.0.0.1:4321: node tests/ofertas.browser.mjs
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const output = new URL('../../.impeccable/review/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let role = 'RECRUITER', kind = 'COMPANY', empty = false, failList = false, failSave = false, delay = false;
let nextId = 3, posts = 0, patches = 0, expired = false;
const fixture = (id, title, status = 'DRAFT') => ({
  id, title, status, owner_user_id: '1', description: 'Diseña experiencias digitales accesibles. Colabora con un equipo que valora la claridad y la atención al detalle.',
  area: 'Producto y tecnología', location: 'Abancay · Híbrido', experience_required: 'Un año trabajando en interfaces web.',
  education_required: 'Estudios técnicos o universitarios en Sistemas o afines.',
  requirements: [{ description: 'TypeScript y HTML semántico' }, { description: 'Accesibilidad y trabajo en equipo' }],
  published_at: status === 'PUBLISHED' ? '2026-11-03T14:00:00.000Z' : null,
  closed_at: null, created_at: '2026-11-03T12:00:00.000Z', updated_at: '2026-11-03T12:00:00.000Z',
});
let jobs = [fixture('1', 'Diseñador/a de Producto', 'PUBLISHED'), fixture('2', 'Analista de selección')];
const session = () => ({ user: { id: '1', name: 'María Prueba', email: 'prueba@example.test', role, kind: role === 'RECRUITER' ? kind : null, account_state: 'ACTIVE' }, expires_at: new Date(Date.now() + 1800000).toISOString() });
await page.route('**/api/v1/**', async route => {
  const url = new URL(route.request().url()), path = url.pathname.replace('/api/v1/', ''), method = route.request().method();
  const respond = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const error = (status, code, message) => respond(status, { error: { code, message, request_id: 'fixture' } });
  if (path === 'me' || path === 'auth/session/refresh') return expired ? error(401, 'SESSION_EXPIRED', 'Tu sesión terminó. Inicia sesión de nuevo.') : respond(200, session());
  if (path === 'auth/logout') return route.fulfill({ status: 204 });
  const match = path.match(/^(recruiter\/)?jobs(?:\/(\d+))?(?:\/(publish|close))?$/);
  if (!match) return error(404, 'NOT_FOUND', 'Ruta no disponible');
  const [, owned, id, action] = match;
  if (method === 'GET' && !id) {
    if (delay) await new Promise(resolve => setTimeout(resolve, 700));
    if (failList) return error(503, 'SERVICE_UNAVAILABLE', 'No se pudo cargar las ofertas. Intenta de nuevo.');
    const q = (url.searchParams.get('q') ?? '').toLowerCase(), status = url.searchParams.get('status');
    const selected = empty ? [] : jobs.filter(job => (owned || job.status === 'PUBLISHED') && (!q || job.title.toLowerCase().includes(q)) && (!status || job.status === status));
    return respond(200, { items: selected, total: selected.length, page: 1, page_size: 20 });
  }
  const job = jobs.find(value => value.id === id);
  if (method === 'GET') return job && (owned || job.status === 'PUBLISHED') ? respond(200, job) : error(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.');
  if (failSave) return error(503, 'SERVICE_UNAVAILABLE', 'No se pudo guardar. Tus datos siguen en el formulario.');
  if (method === 'POST' && !id) {
    posts++; const created = { ...fixture(String(nextId++), ''), ...route.request().postDataJSON() }; jobs.push(created); return respond(201, created);
  }
  if (method === 'PATCH' && job) { patches++; Object.assign(job, route.request().postDataJSON()); return respond(200, job); }
  if (action && job) {
    if (action === 'publish' && kind === 'INDIVIDUAL') return error(403, 'PUBLICATION_PENDING_RULES', 'Publicación no disponible.');
    job.status = action === 'publish' ? 'PUBLISHED' : 'CLOSED';
    job[action === 'publish' ? 'published_at' : 'closed_at'] = new Date().toISOString();
    return respond(200, job);
  }
  return error(404, 'JOB_NOT_FOUND', 'La oferta no está disponible.');
});
const go = async path => {
  await page.goto('http://127.0.0.1:4321' + path);
  await page.locator('[data-private]').waitFor({ state: 'visible' });
};
const noOverflow = async () => {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Desbordamiento horizontal');
};
const capture = async name => { await noOverflow(); await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200); await page.screenshot({ path: fileURLToPath(new URL(name + '.png', output)), fullPage: true }); };
try {
  await go('/reclutador/ofertas'); await page.locator('[data-job-row-template]').waitFor({ state: 'attached' });
  await page.getByRole('link', { name: 'Gestionar Diseñador/a de Producto', exact: true }).waitFor();
  await capture('m02-reclutador-desktop');
  await page.getByLabel('Buscar ofertas').fill('Analista'); await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('1 oferta encontrada', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click(); await page.getByText('2 ofertas encontradas', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Crear oferta', exact: true }).click();
  await page.locator('[data-job-editor]').waitFor({ state: 'visible' });
  await page.getByLabel('Cargo', { exact: false }).fill('Desarrollador/a Frontend');
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await page.getByText('Oferta guardada. Tus cambios ya están disponibles.', { exact: true }).waitFor();
  assert.equal(posts, 1);
  assert.equal(await page.getByRole('button', { name: 'Publicar oferta', exact: true }).isDisabled(), true);
  await page.getByLabel('Descripción del puesto', { exact: true }).fill('Construye interfaces accesibles para equipos de selección.');
  await page.getByLabel('Requisitos y habilidades', { exact: true }).fill('TypeScript\nAccesibilidad web');
  failSave = true;
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.getByText('No se pudo guardar. Tus datos siguen en el formulario.', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('Cargo', { exact: false }).inputValue(), 'Desarrollador/a Frontend');
  assert.equal(await page.getByRole('button', { name: 'Publicar oferta', exact: true }).isDisabled(), true);
  failSave = false;
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.getByText('Oferta guardada. Tus cambios ya están disponibles.', { exact: true }).waitFor();
  assert.equal(patches, 1);
  await capture('m02-editor-desktop');
  await page.getByRole('button', { name: 'Publicar oferta', exact: true }).click();
  await page.getByRole('dialog', { name: '¿Publicar esta oferta?' }).waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.equal(jobs.at(-1).status, 'DRAFT');
  await page.getByRole('button', { name: 'Publicar oferta', exact: true }).click();
  await page.locator('[data-job-confirm-action]').click();
  await page.getByText('Oferta publicada. Los postulantes ya pueden consultarla.', { exact: true }).waitFor();
  assert.equal(jobs.at(-1).status, 'PUBLISHED');
  await page.getByRole('button', { name: 'Cerrar oferta', exact: true }).click();
  await page.getByRole('dialog', { name: '¿Cerrar esta oferta?' }).waitFor();
  await page.locator('[data-job-confirm-action]').click();
  await page.getByText('Oferta cerrada. Ya no aparece entre las oportunidades disponibles.', { exact: true }).waitFor();
  assert.equal(jobs.at(-1).status, 'CLOSED');
  assert.equal(await page.locator('[data-publish-job]').isVisible(), false);
  await page.getByLabel('Cargo', { exact: false }).fill('Cambio sin guardar');
  await page.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await page.locator('[data-job-confirm-action]').click();
  assert.equal(await page.getByLabel('Cargo', { exact: false }).inputValue(), 'Desarrollador/a Frontend');
  role = 'CANDIDATE';
  jobs[0].education_required = null; jobs[0].location = null;
  await go('/postulante/ofertas'); await page.getByRole('link', { name: 'Ver oferta: Diseñador/a de Producto', exact: true }).waitFor();
  await capture('m02-postulante-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Cambiar tema claro u oscuro' }).click();
  await capture('m02-postulante-mobile-dark');
  await page.getByRole('link', { name: 'Ver oferta: Diseñador/a de Producto', exact: true }).click();
  await page.locator('[data-job-detail]').waitFor({ state: 'visible' });
  await page.getByText('El reclutador no ha especificado la formación requerida.', { exact: true }).waitFor();
  await capture('m02-detalle-mobile-dark');
  await page.getByRole('button', { name: 'Menú', exact: true }).click();
  assert.equal(await page.locator('#account-nav').isVisible(), true);
  await go('/postulante/oferta?id=999'); await page.getByText('La oferta no está disponible.', { exact: true }).waitFor();
  empty = true; await go('/postulante/ofertas'); await page.getByText('Aún no hay ofertas publicadas', { exact: true }).waitFor();
  await capture('m02-vacio-mobile-dark');
  empty = false; failList = true; await go('/postulante/ofertas'); await page.getByText('No se pudo cargar las ofertas. Intenta de nuevo.', { exact: true }).waitFor();
  failList = false; delay = true; await page.locator('[data-job-retry]').click();
  assert.equal(await page.locator('[data-job-list-loading]').isVisible(), true);
  await page.getByRole('link', { name: 'Ver oferta: Diseñador/a de Producto', exact: true }).waitFor(); delay = false;
  role = 'RECRUITER'; kind = 'INDIVIDUAL';
  await go('/reclutador/editar-oferta?id=2'); await page.locator('[data-job-editor]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-individual-note]').isVisible(), true);
  assert.equal(await page.locator('[data-publish-job]').isVisible(), false);
  await capture('m02-editor-mobile-dark');
  // La salida voluntaria protege cambios; la expiración limpia inmediatamente.
  await page.getByLabel('Cargo', { exact: false }).fill('Cambio protegido');
  await page.locator('[data-logout]').click();
  await page.getByRole('dialog', { name: '¿Cerrar sesión sin guardar?' }).waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.equal(await page.getByLabel('Cargo', { exact: false }).inputValue(), 'Cambio protegido');
  expired = true;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('[data-private]').waitFor({ state: 'hidden' });
  assert.equal(await page.getByLabel('Cargo', { exact: false }).inputValue(), '');
  expired = false;
  await go('/reclutador/editar-oferta?id=2'); await page.locator('[data-job-editor]').waitFor({ state: 'visible' });
  await page.getByLabel('Cargo', { exact: false }).fill('Salida confirmada');
  await page.locator('[data-logout]').click(); await page.locator('[data-job-confirm-action]').click();
  await page.waitForURL('**/login');
  assert.deepEqual(errors, [], 'Errores JavaScript');
  await writeFile(new URL('m02-browser-result.json', output), JSON.stringify({ status: 'passed', screenshots: 7, widths: [1440,390], api: 'synthetic', checks: ['crear, editar y conservar datos tras error', 'publicar y cerrar con confirmación', 'borrador incompleto y particular bloqueados', 'búsqueda y filtros', 'ideal, parcial, carga, vacío y error', 'tema oscuro, menú móvil, sin desbordamiento', 'cierre voluntario protegido y expiración limpia', 'sin errores JavaScript'] }, null, 2));
  console.log('M02 navegador: flujos y 7 capturas verificados con API sintética.');
} finally { await browser.close(); }
