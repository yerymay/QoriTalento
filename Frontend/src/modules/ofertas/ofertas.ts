import { ofertas, type Job, type JobInput } from './ofertas.service';
import type { Session } from '../auth/auth.service';
import { ApiError } from '../compartido/services/api';

const labels: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', CLOSED: 'Cerrada' };
const date = (value: string | null) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value)) : 'Sin publicar';

export function initOfertas() {
  const root = document.querySelector<HTMLElement>('[data-ofertas]');
  if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const view = root.dataset.jobView, owned = root.dataset.jobOwned === 'true';
  const feedback = el('[data-job-feedback]'), recovery = el('[data-job-recovery]');
  const form = root.querySelector<HTMLFormElement>('[data-job-form]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-job-confirm]');
  const search = root.querySelector<HTMLFormElement>('[data-job-search]');
  const listControls=[...root.querySelectorAll<HTMLElement>('[data-job-list-control]')];
  const listError=root.querySelector<HTMLElement>('[data-job-list-error]');
  let session: Session | undefined, job: Job | undefined, page = 1, epoch = 0;
  let busy = false, dirty = false, baseline = '', query = new URLSearchParams();
  let id = new URLSearchParams(location.search).get('id') ?? '';
  const notice = (message: string, tone: 'error' | 'success' = 'error') => {
    feedback.textContent = message; feedback.dataset.tone = tone; feedback.hidden = false;
  };
  const failure = (error: unknown, retry = false) => {
    if (error instanceof ApiError && (error.status === 401 || ['ACCOUNT_INACTIVE', 'FORBIDDEN'].includes(error.code ?? ''))) {
      document.dispatchEvent(new CustomEvent('qori:auth-error', { detail: error })); return;
    }
    notice(error instanceof Error ? error.message : 'No se pudo completar la operación. Intenta de nuevo.');
    recovery.hidden = !retry;
    el('[data-job-retry]').hidden = error instanceof ApiError && error.status === 404;
  };
  const text = (target: ParentNode, selector: string, value: string) => { target.querySelector<HTMLElement>(selector)!.textContent = value; };
  const link = (target: ParentNode, selector: string, href: string) => { target.querySelector<HTMLAnchorElement>(selector)!.href = href; };
  const field = (name: string) => form!.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
  const read = (): JobInput => ({
    title: field('title').value.trim(), description: field('description').value.trim(),
    area: field('area').value.trim() || null, location: field('location').value.trim() || null,
    experience_required: field('experience_required').value.trim() || null,
    education_required: field('education_required').value.trim() || null,
    requirements: field('requirements').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean).map(description => ({ description })),
  });
  const updateDirty = () => {
    if (!form) return;
    dirty = JSON.stringify(read()) !== baseline;
    el('[data-dirty-message]').textContent = dirty ? 'Tienes cambios sin guardar.' : 'Sin cambios pendientes.';
    el<HTMLButtonElement>('[data-discard-job]').disabled = busy || !dirty;
    el<HTMLButtonElement>('[data-publish-job]').disabled = busy || dirty || !job?.description || !job.requirements.length;
    el<HTMLButtonElement>('[data-close-job]').disabled = busy || dirty;
    el<HTMLButtonElement>('[data-finish-job]').disabled = busy || dirty;
  };
  const publication = () => {
    if (!form) return;
    el('[data-publication]').hidden = !job;
    el('[data-individual-note]').hidden = session?.user.kind !== 'INDIVIDUAL';
    el('[data-editor-status]').textContent = labels[job?.status ?? 'DRAFT'] ?? job?.status ?? 'Borrador';
    el('[data-editor-status]').dataset.status = job?.status ?? 'DRAFT';
    el('[data-save-job]').textContent = job ? 'Guardar cambios' : 'Guardar borrador';
    if (!job) return;
    el('[data-job-id]').textContent = 'QT-' + job.id;
    el('[data-publish-job]').hidden = job.status !== 'DRAFT';
    el('[data-close-job]').hidden = job.status !== 'PUBLISHED';
    el('[data-finish-job]').hidden = !['PUBLISHED','CLOSED'].includes(job.status) || !!job.process_finished_at;
    el('[data-publication-help]').textContent = job.process_finished_at ? 'El proceso ha finalizado. Se registró su fecha de finalización.' : job.status === 'DRAFT'
      ? !job.description || !job.requirements.length ? 'Completa y guarda la descripción y al menos un requisito para habilitar la publicación.' : 'Al publicar, los postulantes podrán consultar esta oferta. Guarda los cambios antes de publicarla.'
      : job.status === 'PUBLISHED' ? 'Visible para los postulantes. Cerrar la oferta la retira del listado disponible; no se podrá reabrir.'
        : 'Esta oferta está cerrada y ya no aparece entre las oportunidades disponibles. Puedes corregir su información, pero no reabrirla.';
  };
  const fillEditor = () => {
    if (!form) return;
    form.reset();
    if (job) {
      for (const name of ['title', 'description', 'area', 'location', 'experience_required', 'education_required'] as const) field(name).value = job[name] ?? '';
      field('requirements').value = job.requirements.map(item => item.description).join('\n');
    }
    baseline = JSON.stringify(read()); publication(); updateDirty();
    el('[data-job-editor]').hidden = false;
  };
  const fillDetail = (value: Job) => {
    text(root, '[data-detail-title]', value.title);
    text(root, '[data-detail-area]', value.area || 'Área no especificada');
    text(root, '[data-detail-meta]', `${value.location || 'Ubicación no especificada'} · QT-${value.id} · ${date(value.published_at)}`);
    text(root, '[data-detail-description]', value.description || 'Descripción no especificada.');
    text(root, '[data-detail-experience]', value.experience_required || 'El reclutador no ha especificado la experiencia requerida.');
    text(root, '[data-detail-education]', value.education_required || 'El reclutador no ha especificado la formación requerida.');
    const list = el('[data-detail-requirements]'); list.replaceChildren();
    for (const requirement of value.requirements) {
      const item = document.createElement('li'); item.className = 'whitespace-pre-wrap break-words'; item.textContent = requirement.description; list.append(item);
    }
    if (!value.requirements.length) { const item = document.createElement('li'); item.textContent = 'Requisitos no especificados.'; list.append(item); }
    link(root, '[data-apply]', '/postulante/postular?id=' + encodeURIComponent(value.id));
    el('[data-job-detail]').hidden = false;
  };
  const loadList = async () => {
    const run = ++epoch, loading = el('[data-job-list-loading]'), list = el('[data-job-list]');
    loading.hidden = false; list.replaceChildren(); el('[data-job-empty]').hidden = true; listError && (listError.hidden = true);
    listControls.forEach(control => control.hidden = true);
    el('[data-job-pagination]').hidden = true; el('[data-job-count]').textContent = '';
    feedback.hidden = true; recovery.hidden = true;
    const params = new URLSearchParams(query); params.set('page', String(page)); params.set('page_size', '20');
    el('[data-reset-search]').hidden = !query.toString();
    try {
      const result = await ofertas.list(owned, params);
      if (run !== epoch || !session) return;
      for (const item of result.items) {
        const fragment = el<HTMLTemplateElement>(owned ? '[data-job-row-template]' : '[data-job-card-template]').content.cloneNode(true) as DocumentFragment;
        const href = owned ? `/reclutador/editar-oferta?id=${encodeURIComponent(item.id)}` : `/postulante/oferta?id=${encodeURIComponent(item.id)}`;
        text(fragment, '[data-job-link]', item.title); link(fragment, '[data-job-link]', href);
        text(fragment, '[data-job-date]', date(item.published_at));
        if (owned) {
          text(fragment, '[data-job-meta]', `QT-${item.id} · ${item.area || 'Área no especificada'}`);
          text(fragment, '[data-job-status]', labels[item.status] ?? item.status);
          fragment.querySelector<HTMLElement>('[data-job-status]')!.dataset.status = item.status;
          link(fragment, '[data-job-edit]', href);
          fragment.querySelector('[data-job-edit]')!.setAttribute('aria-label', `Gestionar ${item.title}`);
        } else {
          text(fragment, '[data-job-area]', item.area || 'Área no especificada');
          text(fragment, '[data-job-code]', 'QT-' + item.id);
          text(fragment, '[data-job-location]', item.location || 'Ubicación no especificada');
          text(fragment, '[data-job-description]', item.requirements.length ? item.requirements.map(requirement => requirement.description).join(' · ') : item.description || 'Requisitos no especificados.');
          link(fragment, '[data-job-view]', href);
          fragment.querySelector('[data-job-view]')!.setAttribute('aria-label', `Ver oferta: ${item.title}`);
        }
        list.append(fragment);
      }
      el('[data-job-count]').textContent = `${result.total} ${result.total === 1 ? 'oferta encontrada' : 'ofertas encontradas'}`;
      const empty = result.items.length === 0;
      el('[data-job-empty]').hidden = !empty;
      listControls.forEach(control => control.hidden = empty && !query.toString());
      if (empty) {
        text(root, '[data-empty-title]', query.toString() ? 'No encontramos ofertas con esos filtros' : owned ? 'Tu próxima contratación empieza aquí' : 'Aún no hay ofertas publicadas');
        text(root, '[data-empty-text]', query.toString() ? 'Prueba con otro cargo o limpia los filtros para ver las ofertas disponibles.' : owned ? 'Crea tu primera oferta. Puedes guardarla como borrador y completarla cuando estés listo.' : 'Vuelve más adelante para conocer nuevas oportunidades.');
      }
      const pages = Math.max(1, Math.ceil(result.total / result.page_size));
      el('[data-job-pagination]').hidden = pages <= 1 && page === 1;
      el('[data-page-label]').textContent = `Página ${page} de ${pages}`;
      el<HTMLButtonElement>('[data-page-prev]').disabled = page <= 1;
      el<HTMLButtonElement>('[data-page-next]').disabled = page >= pages;
    } catch (error) { if (run === epoch) {
      if (error instanceof ApiError && (error.status === 401 || ['ACCOUNT_INACTIVE', 'FORBIDDEN'].includes(error.code ?? ''))) { document.dispatchEvent(new CustomEvent('qori:auth-error', { detail: error })); }
      else if (listError) { feedback.hidden = true; recovery.hidden = true; listError.hidden = false; }
      else failure(error, true);
    } }
    finally { if (run === epoch) loading.hidden = true; }
  };
  const load = async () => {
    if (!session) return;
    if (view === 'list') { await loadList(); return; }
    if (view === 'new' && !job) { fillEditor(); return; }
    const run = ++epoch;
    feedback.hidden = true; recovery.hidden = true;
    el('[data-job-loading]').hidden = false;
    try {
      if (!/^[1-9]\d{0,19}$/.test(id)) throw new ApiError('El enlace de la oferta no es válido. Vuelve al listado y selecciona una oferta.', 404);
      const value = await ofertas.detail(owned, id);
      if (run !== epoch || !session) return;
      job = value;
      if (form) fillEditor(); else fillDetail(value);
    } catch (error) { if (run === epoch) failure(error, true); }
    finally { if (run === epoch) el('[data-job-loading]').hidden = true; }
  };
  const confirm = async (title: string, message: string, action: string) => {
    if (!dialog) return false;
    text(root, '#job-confirm-title', title); text(root, '#job-confirm-text', message);
    text(root, '[data-job-confirm-action]', action); dialog.returnValue = 'cancel'; dialog.showModal();
    await new Promise<void>(resolve => dialog.addEventListener('close', () => resolve(), { once: true }));
    return dialog.returnValue === 'confirm' && !!session;
  };
  const setBusy = (value: boolean) => {
    busy = value; el<HTMLFieldSetElement>('[data-job-fields]').disabled = value;
    form?.setAttribute('aria-busy', String(value)); updateDirty();
  };
  form?.addEventListener('input', updateDirty);
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !session || !form.reportValidity()) return;
    const body = read();
    if (body.requirements.length > 50 || body.requirements.some(item => item.description.length > 1000)) {
      notice('Revisa los requisitos: máximo 50 líneas, con hasta 1000 caracteres cada una.'); field('requirements').focus(); return;
    }
    const run = epoch, creating = !job;
    setBusy(true); feedback.hidden = true; el('[data-save-job]').textContent = 'Guardando…';
    try {
      const saved = job ? await ofertas.update(job.id, body) : await ofertas.create(body);
      if (run !== epoch || !session) return;
      job = saved; id = saved.id; fillEditor(); notice('Oferta guardada. Tus cambios ya están disponibles.', 'success');
      if (creating) {
        history.replaceState(null, '', `/reclutador/editar-oferta?id=${encodeURIComponent(id)}`);
        document.querySelector('h1')!.textContent = 'Gestionar oferta';
      }
      feedback.focus();
    } catch (error) { if (run === epoch) { failure(error); feedback.focus(); } }
    finally { if (session) { setBusy(false); publication(); } }
  });
  root.querySelector('[data-discard-job]')?.addEventListener('click', async () => {
    if (busy || !dirty) return;
    if (await confirm('¿Descartar los cambios?', 'Se recuperará la última versión guardada de esta oferta.', 'Descartar cambios')) { fillEditor(); feedback.hidden = true; field('title').focus(); }
  });
  for (const action of ['publish', 'close'] as const) {
    root.querySelector(`[data-${action}-job]`)?.addEventListener('click', async event => {
      if (!job || busy || dirty || !session) return;
      const accepted = await confirm(action === 'publish' ? '¿Publicar esta oferta?' : '¿Cerrar esta oferta?',
        action === 'publish' ? `«${job.title}» será visible para los postulantes.` : `«${job.title}» dejará de estar disponible. No podrás reabrirla.`,
        action === 'publish' ? 'Publicar oferta' : 'Cerrar oferta');
      if (!accepted || busy || !job || dirty) return;
      const actionButton=event.currentTarget as HTMLButtonElement;
      const shimmerTimeout=window.setTimeout(()=>{ actionButton.classList.add('q-button-loading'); actionButton.setAttribute('aria-busy','true'); },220);
      const run = epoch; setBusy(true);
      try {
        const value = await ofertas.transition(job.id, action);
        if (run !== epoch || !session) return;
        job = value; fillEditor();
        notice(action === 'publish' ? 'Oferta publicada. Los postulantes ya pueden consultarla.' : 'Oferta cerrada. Ya no aparece entre las oportunidades disponibles.', 'success');
        feedback.focus();
      } catch (error) { if (run === epoch) { failure(error); feedback.focus(); } }
      finally { window.clearTimeout(shimmerTimeout); actionButton.classList.remove('q-button-loading'); actionButton.removeAttribute('aria-busy'); if (session) setBusy(false); }
    });
  }
  root.querySelector('[data-finish-job]')?.addEventListener('click', async () => {
    if (!job || busy || dirty || !session || job.process_finished_at) return;
    const accepted = await confirm('¿Finalizar el proceso?', 'Se cerrará la recepción de postulaciones y comenzará el plazo de conservación. Esta acción no puede deshacerse.', 'Finalizar proceso');
    if (!accepted || !job || busy || !session) return;
    const run = epoch; setBusy(true);
    try {
      const result = await ofertas.finish(job.id);
      if (run !== epoch || !session) return;
      job = { ...job, status: 'CLOSED', process_finished_at: result.finished_at };
      fillEditor(); notice('Proceso finalizado. Se registró la fecha de finalización.', 'success'); feedback.focus();
    } catch (error) { if (run === epoch) { failure(error); feedback.focus(); } }
    finally { if (session) setBusy(false); }
  });
  search?.addEventListener('submit', event => {
    event.preventDefault(); query = new URLSearchParams();
    const data = new FormData(search);
    for (const name of ['q', 'status']) { const value = String(data.get(name) ?? '').trim(); if (value) query.set(name, value); }
    page = 1; void load();
  });
  root.querySelector('[data-reset-search]')?.addEventListener('click', () => { search?.reset(); query = new URLSearchParams(); page = 1; void load(); });
  root.querySelector('[data-page-prev]')?.addEventListener('click', () => { if (page > 1) { page--; void load(); } });
  root.querySelector('[data-page-next]')?.addEventListener('click', () => { page++; void load(); });
  root.querySelector('[data-job-list-retry]')?.addEventListener('click', () => void loadList());
  el('[data-job-retry]').addEventListener('click', () => void load());
  document.addEventListener('qori:session', event => { session = (event as CustomEvent<Session>).detail; void load(); });
  document.addEventListener('qori:session-cleared', () => {
    epoch++; session = undefined; job = undefined; dirty = false; busy = false; form?.reset(); dialog?.close();
    root.querySelector('[data-job-list]')?.replaceChildren();
    root.querySelector('[data-job-detail]')?.setAttribute('hidden', '');
    root.querySelector('[data-job-editor]')?.setAttribute('hidden', '');
    feedback.hidden = true; recovery.hidden = true;
  });
  document.addEventListener('qori:before-logout', event => {
    const guard = (event as CustomEvent<{ allowed: Promise<boolean> }>).detail;
    if (busy) { notice('Espera a que termine el guardado antes de cerrar sesión.'); guard.allowed = Promise.resolve(false); }
    else if (dirty) guard.allowed = confirm('¿Cerrar sesión sin guardar?', 'Los cambios pendientes de esta oferta se perderán. Cancela para volver al formulario y guardarlos.', 'Cerrar sesión');
  });
  window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); } });
}
