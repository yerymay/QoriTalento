import { senalDeAccion } from '../compartido/preferencias-senal';
import { postulaciones, type Application, type CvPreview } from './postulaciones.service';
import { ofertas } from '../ofertas/ofertas.service';
import { cv, fields, type CvProfile, type Review } from '../cv/cv.service';
import { ApiError } from '../compartido/services/api';
import type { Session } from '../auth/auth.service';

export function initApplicationWizard(root: HTMLElement) {
  const el = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const form = el<HTMLFormElement>('[data-wizard-form]');
  const fileInput = el<HTMLInputElement>('[data-file]');
  const next = el<HTMLButtonElement>('[data-next]');
  const back = el<HTMLButtonElement>('[data-back]');
  const consent = el<HTMLInputElement>('[data-consent]');
  const notice = el('[data-app-notice]');
  const params = new URLSearchParams(location.search);
  const jobId = params.get('id') ?? '', applicationId = params.get('application') ?? '';
  let session: Session | undefined, current: Application | undefined, file: File | undefined;
  let preview: CvPreview | undefined, submitted: Application | undefined, review: Review | undefined;
  let step = 1, busy = false, epoch = 0, title = '', uncertain = false;
  let controller: AbortController | undefined;
  const field = (key: keyof CvProfile) => el<HTMLInputElement | HTMLTextAreaElement>('[data-profile-field="' + key + '"]');
  const say = (message: string) => {
    notice.textContent = message; notice.dataset.tone = 'error'; notice.hidden = false; notice.focus(); senalDeAccion('error');
  };
  const fail = (error: unknown) => {
    if (error instanceof ApiError && (error.status === 401 || error.code === 'FORBIDDEN')) {
      document.dispatchEvent(new CustomEvent('qori:auth-error', { detail: error })); return;
    }
    say(error instanceof Error ? error.message : 'No se pudo completar la operación. Intenta nuevamente.');
  };
  const controls = () => {
    el<HTMLFieldSetElement>('[data-wizard-fields]').disabled = busy;
    next.disabled = busy || uncertain || (step === 1 && !file) || (step === 3 && !consent.checked);
    next.textContent = busy ? (step === 1 ? 'Leyendo currículum…' : 'Enviando…') : submitted ? 'Confirmar datos pendientes' : step === 3 ? (current ? 'Actualizar CV' : 'Enviar postulación') : 'Siguiente';
    back.disabled = busy || step === 1 || !!submitted || uncertain;
    form.setAttribute('aria-busy', String(busy));
  };
  const showStep = (value: number, focus = true) => {
    step = value;
    root.querySelectorAll<HTMLElement>('[data-wizard-step]').forEach(panel => panel.hidden = Number(panel.dataset.wizardStep) !== step);
    root.querySelectorAll<HTMLElement>('[data-step-indicator]').forEach(item => {
      const number = Number(item.dataset.stepIndicator);
      if (number === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.dataset.complete = String(number < step);
    });
    el('[data-step-status]').textContent = 'Paso ' + step + ' de 3';
    controls();
    if (focus) el<HTMLElement>('[data-wizard-step="' + step + '"] h3').focus();
  };
  const read = (): CvProfile => {
    const result = {} as CvProfile;
    for (const definition of fields) {
      const value = field(definition.key).value.trim();
      if (definition.array) (result[definition.key] as string[]) = value.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
      else (result[definition.key] as string) = value;
    }
    return result;
  };
  const validate = () => {
    for (const definition of fields) {
      const input = field(definition.key); input.setCustomValidity('');
      if (input.value.length > definition.max) input.setCustomValidity('Reduce la extensión de este campo.');
      if (definition.key === 'name' && input.value.trim().length < 2) input.setCustomValidity('Escribe tu nombre completo.');
      if (definition.key === 'phone' && input.value && (!/^[+\d\s().-]+$/.test(input.value) || input.value.replace(/\D/g, '').length < 7)) input.setCustomValidity('Revisa el número de teléfono.');
      if (definition.array) {
        const entries = (read()[definition.key] as string[]);
        const long = ['education', 'experience'].includes(definition.key);
        if (entries.length > (long ? 30 : 80) || entries.some(entry => entry.length > (long ? 4000 : 200))) input.setCustomValidity('Reduce las entradas o su extensión. Separa cada entrada con una línea vacía.');
      }
      if (!input.checkValidity()) {
        input.closest('details')?.setAttribute('open', '');
        input.reportValidity(); return false;
      }
    }
    if (new TextEncoder().encode(JSON.stringify(read())).length > 60_000) { say('Resume la información del CV antes de continuar.'); return false; }
    return true;
  };
  const choose = (selected?: File) => {
    if (busy || submitted || uncertain) return;
    el('[data-file-error]').hidden = true;
    if (!selected) return;
    preview = undefined; file = undefined; consent.checked = false;
    if (!selected.name.toLowerCase().endsWith('.pdf') || (selected.type && selected.type !== 'application/pdf') || !selected.size || selected.size > 5_000_000) {
      el('[data-file-error]').textContent = 'Selecciona un PDF con texto de hasta 5 MB.';
      el('[data-file-error]').hidden = false; fileInput.value = '';
    } else {
      file = selected; el('[data-filename]').textContent = selected.name;
      el('[data-filesize]').textContent = (selected.size / 1_000_000).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' MB · Listo para revisar';
    }
    el('[data-file-selected]').hidden = !file; controls();
  };
  const load = async () => {
    const run = ++epoch;
    el('[data-app-loading]').hidden = false; el('[data-app-recovery]').hidden = true; notice.hidden = true;
    try {
      if (applicationId) {
        current = (await postulaciones.list()).items.find(item => item.id === applicationId);
        if (!current) throw new Error('No se encontró la postulación.');
        if (current.status !== 'PENDING') throw new Error('Solo puedes reemplazar el CV mientras la postulación esté pendiente.');
        title = current.title;
      } else {
        if (!/^[1-9][0-9]*$/.test(jobId)) throw new Error('Selecciona una oferta para postular.');
        const job = await ofertas.detail(false, jobId);
        if (job.status !== 'PUBLISHED') throw new Error('Esta oferta ya no recibe postulaciones.');
        title = job.title;
      }
      if (run !== epoch || !session) return;
      el('[data-title]').textContent = title;
      el('[data-meta]').textContent = current ? 'Reemplazo de currículum' : 'Oferta QT-' + jobId;
      el('[data-form-content]').hidden = false; showStep(step, false);
    } catch (error) {
      if (run === epoch) { fail(error); el('[data-app-recovery]').hidden = false; }
    } finally { if (run === epoch) el('[data-app-loading]').hidden = true; }
  };
  fileInput.addEventListener('change', () => choose(fileInput.files?.[0]));
  const drop = el('[data-drop]');
  drop.addEventListener('dragover', event => { event.preventDefault(); if (!busy) drop.dataset.dragging = 'true'; });
  drop.addEventListener('dragleave', () => { delete drop.dataset.dragging; });
  drop.addEventListener('drop', event => {
    event.preventDefault(); delete drop.dataset.dragging;
    if (event.dataTransfer?.files.length !== 1) { if (!busy) say('Selecciona un solo currículum.'); return; }
    choose(event.dataTransfer.files[0]);
  });
  consent.addEventListener('change', controls);
  form.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (input.matches('[data-profile-field]')) { input.setCustomValidity(''); consent.checked = false; }
  });
  back.addEventListener('click', () => { if (!busy && !submitted) { notice.hidden = true; showStep(Math.max(1, step - 1)); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || uncertain || !session || !file) return;
    notice.hidden = true;
    if (step === 2) {
      if (!validate()) return;
      const data = read();
      root.querySelectorAll<HTMLElement>('[data-summary-field]').forEach(item => item.textContent = String(data[item.dataset.summaryField as keyof CvProfile] || 'No especificado'));
      el('[data-review-filename]').textContent = file.name;
      showStep(3); return;
    }
    if (step === 3 && !consent.checked) return;
    const run = epoch;
    busy = true; controls(); senalDeAccion('progreso');
    controller = new AbortController();
    el('[data-progress-wrap]').hidden = false;
    el('[data-progress-label]').textContent = step === 1 ? 'Leyendo el PDF. Tu postulación aún no se ha enviado.' : 'Enviando tu postulación…';
    const progress = (value: number | null) => {
      const bar = el<HTMLProgressElement>('[data-progress]');
      if (value === null || value === 100) bar.removeAttribute('value'); else bar.value = value;
    };
    progress(null);
    try {
      if (step === 1) {
        if (!preview) {
          const result = await postulaciones.preview(file, controller.signal, progress);
          if (run !== epoch || !session) return;
          preview = result;
          for (const definition of fields) {
            const value = result.profile[definition.key];
            field(definition.key).value = Array.isArray(value) ? value.join('\n\n') : value;
            const origin = root.querySelector<HTMLElement>('[data-field-origin="' + definition.key + '"]');
            if (origin) origin.textContent = value.length ? 'Extraído del CV · Revisa este dato' : 'No detectado · Puedes completarlo';
          }
          el('[data-extraction-warning]').textContent = result.warnings.join(' ');
          el('[data-extraction-warning]').hidden = !result.warnings.length;
        }
        showStep(2);
      } else {
        if (!submitted) {
          const saved = await (current ? postulaciones.replace(current.id, file, controller.signal, progress) : postulaciones.send(jobId, file, controller.signal, progress));
          if (run !== epoch || !session) return;
          submitted = saved;
        }
        if (run !== epoch || !session) return;
        el('[data-progress-label]').textContent = 'Guardando los datos que revisaste…';
        if (!review) {
          const result = await cv.review(false, submitted.id);
          if (run !== epoch || !session) return;
          review = result;
        }
        if (run !== epoch || !session) return;
        await cv.confirm(submitted.id, review, read());
        if (run !== epoch || !session) return;
        file = undefined; preview = undefined; fileInput.value = '';
        el('[data-form-content]').hidden = true;
        el('#application-success-title').textContent = current ? 'Currículum actualizado' : 'Postulación registrada';
        el('[data-success-copy]').textContent = 'Tu CV y los datos confirmados para ' + title + ' se guardaron correctamente. Puedes seguir el proceso en Mis postulaciones.';
        el('[data-wizard-success]').hidden = false; el('[data-wizard-success]').focus(); senalDeAccion('exito');
      }
    } catch (error) {
      if (run !== epoch || !session) return;
      fail(error);
      if (submitted) say('Tu CV ya se guardó. Falta confirmar los datos revisados. Puedes reintentar sin enviar otra postulación o continuar desde Mis postulaciones.');
      else if (step === 3 && error instanceof ApiError && error.status === 0) {
        uncertain = true;
        say('No pudimos confirmar el envío. Revisa Mis postulaciones antes de volver a enviarlo para evitar duplicados.');
      }
      if (submitted || uncertain) {
        el('[data-app-recovery]').hidden = false;
        el<HTMLButtonElement>('[data-app-retry]').hidden = true;
      }
    } finally {
      if (run === epoch) { busy = false; controller = undefined; el('[data-progress-wrap]').hidden = true; controls(); }
    }
  });
  el('[data-app-retry]').addEventListener('click', () => void load());
  document.addEventListener('qori:session', event => {
    const nextSession = (event as CustomEvent<Session>).detail;
    const first = !session;
    session = nextSession; if (first) void load();
  });
  document.addEventListener('qori:session-cleared', () => {
    epoch++; controller?.abort(); session = undefined; file = undefined; preview = undefined; submitted = undefined; review = undefined;
    busy = false; uncertain = false; step = 1; current = undefined; title = '';
    root.querySelectorAll<HTMLElement>('[data-summary-field], [data-filename], [data-review-filename], [data-success-copy]').forEach(item => item.textContent = '');
    form.reset(); fileInput.value = ''; el('[data-form-content]').hidden = true; el('[data-wizard-success]').hidden = true;
    notice.hidden = true; el('[data-app-recovery]').hidden = true;
  });
}
