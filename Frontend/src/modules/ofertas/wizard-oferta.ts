import { updateStepper } from '../compartido/stepper';
import type { JobInput } from './ofertas.service';

const titles = ['Datos del puesto', 'Descripción y requisitos', 'Condiciones', 'Revisión'];
const help = ['Define la información básica de la oportunidad.', 'Describe el puesto y el perfil que necesita tu equipo.', 'Añade la jornada y los beneficios que ofrece el puesto.', 'Revisa los datos de la oferta.'];

export function initWizardOferta(form: HTMLFormElement, read: () => JobInput) {
  const panels = [...form.querySelectorAll<HTMLElement>('[data-wizard-step]')];
  const indicators = [...form.querySelectorAll<HTMLElement>('[data-wizard-indicator]')];
  const prev = form.querySelector<HTMLButtonElement>('[data-wizard-prev]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-wizard-next]')!;
  const title = form.querySelector<HTMLElement>('[data-wizard-title]')!;
  const description = form.querySelector<HTMLElement>('[data-wizard-help]')!;
  const heading = form.querySelector<HTMLElement>('[data-wizard-heading]')!;
  const review = form.querySelector<HTMLElement>('[data-wizard-review]')!;
  let step = 0;
  function showReview() {
    const data = read();
    const entries: Array<[string, string]> = [
      ['Cargo', data.title], ['Área', data.area ?? ''], ['Ubicación', data.location ?? ''],
      ['Modalidad', data.modality ?? ''], ['Jornada', data.work_schedule ?? ''],
      ['Descripción del puesto', data.description], ['Funciones principales', data.responsibilities.join('\n')],
      ['Requisitos y habilidades', data.requirements.map(item => item.description).join('\n')],
      ['Experiencia requerida', data.experience_required ?? ''], ['Formación académica', data.education_required ?? ''],
      ['Lo que ofrecemos', data.benefits.join('\n')],
    ];
    review.replaceChildren();
    for (const [label, value] of entries) {
      const group = document.createElement('div'); group.className = 'min-w-0 rounded-lg border border-slate-200 p-4 dark:border-slate-700';
      const term = document.createElement('dt'); term.className = 'font-semibold'; term.textContent = label;
      const content = document.createElement('dd'); content.className = 'mt-2 whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-200'; content.textContent = value || 'No especificado';
      group.append(term, content); review.append(group);
    }
  }
  function show(index: number, focus = false) {
    step = Math.max(0, Math.min(3, index));
    panels.forEach(panel => { panel.hidden = Number(panel.dataset.wizardStep) !== step; });
    updateStepper(indicators, step);
    title.textContent = titles[step]!; description.textContent = help[step]!;
    prev.hidden = step === 0; next.hidden = step === 3;
    const save = form.querySelector<HTMLButtonElement>('[data-save-job]')!;
    save.classList.toggle('q-primary', step === 3); save.classList.toggle('q-secondary', step !== 3);
    if (step === 3) showReview();
    if (focus) heading.focus();
  }
  prev.addEventListener('click', () => show(step - 1, true));
  next.addEventListener('click', () => {
    const cargo = form.querySelector<HTMLInputElement>('[name="title"]')!;
    if (step === 0 && !cargo.reportValidity()) { cargo.focus(); return; }
    show(step + 1, true);
  });
  form.addEventListener('invalid', event => {
    const panel = (event.target as HTMLElement).closest<HTMLElement>('[data-wizard-step]');
    if (panel) show(Number(panel.dataset.wizardStep));
  }, true);
  show(0);
  return { show };
}
