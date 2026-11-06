import { postulaciones, type Application } from './postulaciones.service';
import { ofertas } from '../ofertas/ofertas.service';
import { ApiError } from '../compartido/services/api';
import type { Session } from '../auth/auth.service';
const labels: Record<string,string> = { PENDING:'Pendiente de evaluación', IN_REVIEW:'En revisión', SHORTLISTED:'Preseleccionado', ADVANCES:'Avanza', NOT_ADVANCES:'No avanza' };
export function initPostulaciones() {
  const root = document.querySelector<HTMLElement>('[data-applications]'); if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(s:string) => root.querySelector<T>(s)!;
  const input = root.querySelector<HTMLInputElement>('[data-file]'), dialog = el<HTMLDialogElement>('[data-app-confirm]');
  const notice = el('[data-app-notice]'), loading = el('[data-app-loading]'), recovery = el('[data-app-recovery]');
  const params = new URLSearchParams(location.search), jobId = params.get('id') ?? '', applicationId = params.get('application') ?? '';
  let session: Session | undefined, file: File | undefined, active: AbortController | undefined, current: Application | undefined, title = '', epoch = 0;
  const say = (message:string, error = false) => { notice.textContent = message; notice.dataset.tone = error ? 'error' : 'success'; notice.hidden = false; notice.focus(); };
  const failure = (error:unknown) => {
    if (error instanceof ApiError && (error.status === 401 || error.code === 'FORBIDDEN')) { document.dispatchEvent(new CustomEvent('qori:auth-error', {detail:error})); return; }
    say(error instanceof Error ? error.message : 'No se pudo completar la operación.', true);
  };
  const choose = (value:File | undefined) => {
    file = undefined; const error = el('[data-file-error]'), name = el('[data-filename]'); error.hidden = true; name.hidden = true;
    if (value && (!value.name.toLowerCase().endsWith('.pdf') || (value.type && value.type !== 'application/pdf') || value.size > 5_000_000 || value.size === 0)) {
      error.textContent = 'Selecciona un PDF de hasta 5 MB.'; error.hidden = false;
    } else if (value) { file = value; name.textContent = `Seleccionado: ${value.name}`; name.hidden = false; }
    el<HTMLButtonElement>('[data-submit]').disabled = !file || !!active;
  };
  const load = async () => {
    const run = ++epoch; loading.hidden = false; notice.hidden = true; recovery.hidden = true;
    try {
      if (root.dataset.view === 'list') {
        const result = await postulaciones.list(); if (run !== epoch || !session) return;
        const list = el('[data-app-list]'); list.replaceChildren(); el('[data-app-empty]').hidden = result.items.length > 0;
        for (const item of result.items) {
          const fragment = el<HTMLTemplateElement>('[data-card]').content.cloneNode(true) as DocumentFragment;
          fragment.querySelector('[data-card-title]')!.textContent = item.title;
          fragment.querySelector('[data-card-meta]')!.textContent = `Postulación ${item.id} · ${new Intl.DateTimeFormat('es-PE',{dateStyle:'medium'}).format(new Date(item.created_at))}`;
          fragment.querySelector('[data-card-status]')!.textContent = item.status ? labels[item.status] ?? item.status : 'Estado pendiente';
          fragment.querySelector('[data-card-file]')!.textContent = item.filename ? `CV: ${item.filename}` : 'CV no disponible';
          const replace = fragment.querySelector<HTMLAnchorElement>('[data-card-replace]')!;
          const review = document.createElement('a'); review.className = 'q-link ml-3'; review.href = `/postulante/cv?application=${encodeURIComponent(item.id)}`; review.textContent = 'Revisar datos del CV'; replace.after(review);
          if (item.status === 'PENDING') { replace.hidden = false; replace.href = `/postulante/postular?application=${encodeURIComponent(item.id)}`; }
          list.append(fragment);
        }
      } else {
        if (applicationId) { const result = await postulaciones.list(); current = result.items.find(a => a.id === applicationId); if (!current) throw new Error('No se encontró la postulación.'); title = current.title; if (current.status !== 'PENDING') throw new Error('El CV solo puede reemplazarse mientras la postulación esté pendiente de evaluación.'); }
        else { const job = await ofertas.detail(false, jobId); title = job.title; }
        if (run !== epoch || !session) return;
        el('[data-title]').textContent = title; el('[data-meta]').textContent = current ? 'Actualizar currículum' : `Oferta QT-${jobId}`;
        el('[data-submit]').textContent = current ? 'Actualizar CV' : 'Enviar postulación'; el('[data-form-content]').hidden = false;
      }
    } catch (error) { if (run === epoch) { failure(error); recovery.hidden = false; } }
    finally { if (run === epoch) loading.hidden = true; }
  };
  input?.addEventListener('change', () => choose(input.files?.[0]));
  const drop = root.querySelector<HTMLElement>('[data-drop]');
  drop?.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('border-sky-600'); });
  drop?.addEventListener('dragleave', () => drop.classList.remove('border-sky-600'));
  drop?.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('border-sky-600'); choose(e.dataTransfer?.files[0]); });
  root.querySelector('[data-submit]')?.addEventListener('click', async () => {
    if (!file || active || !session) return;
    const selected = file; el('[data-confirm-copy]').textContent = `${current ? 'Actualizarás tu CV para' : 'Enviarás tu postulación a'} ${title} con el archivo ${selected.name}.`;
    dialog.returnValue = 'cancel'; dialog.showModal(); await new Promise<void>(resolve => dialog.addEventListener('close', () => resolve(), {once:true}));
    if (dialog.returnValue !== 'confirm' || !session || active) return;
    active = new AbortController(); const run = epoch, controller = active;
    el<HTMLButtonElement>('[data-submit]').disabled = true; el('[data-cancel-upload]').hidden = false; el('[data-progress-wrap]').hidden = false;
    try {
      const progress = (value:number|null) => { const bar = el<HTMLProgressElement>('[data-progress]'); if (value === null) bar.removeAttribute('value'); else bar.value = value; el('[data-progress-label]').textContent = value === 100 ? 'Leyendo currículum…' : 'Enviando archivo…'; };
      const result = await (current ? postulaciones.replace(current.id, selected, controller.signal, progress) : postulaciones.send(jobId, selected, controller.signal, progress));
      if (run !== epoch || !session) return;
      location.assign(`/postulante/cv?application=${encodeURIComponent(result.id)}`);
      file = undefined; if (input) input.value = ''; el('[data-form-content]').hidden = true; say(current ? 'CV actualizado correctamente.' : 'Postulación registrada. Puedes consultar su estado en Mis postulaciones.');
      recovery.hidden = false; el('[data-app-retry]').hidden = true;
    } catch (error) { if (run === epoch) { failure(error); if (error instanceof ApiError && error.status === 0) say('No pudimos confirmar el resultado. Consulta Mis postulaciones antes de volver a enviar.', true); } }
    finally { if (active === controller) active = undefined; if (run === epoch) { el('[data-progress-wrap]').hidden = true; el('[data-cancel-upload]').hidden = true; el<HTMLButtonElement>('[data-submit]').disabled = !file; } }
  });
  root.querySelector('[data-cancel-upload]')?.addEventListener('click', () => active?.abort());
  el('[data-app-retry]').addEventListener('click', () => void load());
  document.addEventListener('qori:session', e => { session = (e as CustomEvent<Session>).detail; void load(); });
  document.addEventListener('qori:session-cleared', () => { epoch++; active?.abort(); session = undefined; file = undefined; dialog.close(); root.querySelector('[data-app-list]')?.replaceChildren(); if (input) input.value = ''; });
}
