import { exams, type Draft, type Exam } from './examenes.service';
import { ofertas, type Job } from '../ofertas/ofertas.service';
import { escape as e, icon, confirmAction, failure } from './ui';
import { senalDeAccion } from '../compartido/preferencias-senal';

export async function mountEditor(root: HTMLElement, alive: () => boolean) {
  const host = root.querySelector<HTMLElement>('[data-ex-content]')!, notice = root.querySelector<HTMLElement>('[data-ex-notice]')!;
  const params = new URLSearchParams(location.search);
  let id = params.get('id'), jobId = params.get('job') ?? '', saved: Exam | undefined;
  const jobs: Job[] = [];
  if (id) { saved = await exams.detail(id); jobId = saved.job_id; }
  else {
    let page = 1, total = 1;
    while (jobs.length < total && alive()) {
      const result = await ofertas.list(true, new URLSearchParams({ page: String(page++), page_size: '50' }));
      jobs.push(...result.items); total = result.total;
      if (!result.items.length) break;
    }
  }
  if (!alive()) return () => {};
  const usableJobs = jobs.filter(job => !job.process_finished_at);
  const freshQuestion = () => ({ text: '', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] });
  let draft: Draft = saved ? { title: saved.title, time_limit_minutes: saved.time_limit_seconds / 60, questions: saved.questions.map(q => ({ text: q.text, options: q.options.map(o => ({ text: o.text, is_correct: !!o.is_correct })) })) } : { title: '', time_limit_minutes: 30, questions: [] };
  let step = saved?.status === 'PUBLISHED' ? 2 : 0, current = 0, dirty = false, busy = false;
  const abort = new AbortController(), opts = { signal: abort.signal };
  const locked = () => saved?.status === 'PUBLISHED';
  const complete = () => draft.questions.length > 0 && draft.questions.every(q => q.text.trim() && q.options.every(o => o.text.trim()) && q.options.filter(o => o.is_correct).length === 1);
  const selectedJob = () => saved?.job_title ?? usableJobs.find(j => j.id === jobId)?.title ?? 'Selecciona una oferta';
  const announce = (message: string) => { notice.textContent = message; notice.dataset.tone = 'success'; notice.hidden = false; };
  const dirtyLabel = () => {
    const label = host.querySelector('[data-draft-status]');
    const jobLabel=host.querySelector('[data-editor-job-title]'),meta=host.querySelector('[data-editor-meta]');
    if(jobLabel)jobLabel.textContent=selectedJob();if(meta)meta.textContent=draft.questions.length+' preguntas · '+draft.time_limit_minutes+' min';
    if(dirty && notice.dataset.tone==='success')notice.hidden=true;
    if (label) label.textContent = dirty ? 'Cambios sin guardar' : saved ? 'Borrador guardado' : 'Aún no se ha guardado';
  };
  const preview = () => draft.questions.length ? draft.questions.map((q, i) => `<section class="border-t border-slate-200 py-6 dark:border-slate-700"><h3 class="mb-4 font-semibold">Pregunta ${i + 1}</h3><p class="ex-question-text mb-5">${e(q.text || 'Falta el enunciado')}</p><ul class="grid grid-cols-3 gap-2 xl:block xl:space-y-2">${q.options.map((o,j) => `<li class="flex items-start gap-3 rounded-lg p-3 ${o.is_correct ? 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100' : 'bg-slate-50 dark:bg-slate-800'}"><span class="font-semibold">${String.fromCharCode(65+j)}.</span><span class="min-w-0 flex-1 whitespace-pre-wrap">${e(o.text || 'Alternativa pendiente')}</span>${o.is_correct ? icon('check') + '<span class="sr-only">Correcta</span>' : ''}</li>`).join('')}</ul></section>`).join('') : '<p class="ex-muted py-8">Todavía no hay preguntas. Añade la primera en el paso Preguntas.</p>';
  function render() {
    if (!alive()) return;
    host.innerHTML = `<div class="ex-toolbar mb-6"><a class="q-link ex-button" href="/reclutador/examenes${jobId ? '?job=' + e(jobId) : ''}">${icon('back')}Todas las pruebas</a><span class="ex-state" data-state="${locked() ? 'PUBLISHED' : 'DRAFT'}">${icon(locked() ? 'lock' : 'file')}${locked() ? 'Publicada · contenido protegido' : 'Borrador · solo tú puedes verlo'}</span></div>
      <div class="ex-grid"><aside class="ex-rail"><nav aria-label="Pasos para crear la prueba" class="space-y-2">${['Configuración','Preguntas','Revisar y publicar'].map((label,i) => `<button type="button" class="ex-nav-button" data-step="${i}" aria-current="${step===i ? 'step' : 'false'}" ${locked() && i!==2 ? 'disabled' : ''}><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm">${i+1}</span>${label}</button>`).join('')}</nav>
      <div class="mt-6 hidden border-t border-slate-200 pt-5 dark:border-slate-700 xl:block"><p data-editor-job-title class="font-medium break-words">${e(selectedJob())}</p><p data-editor-meta class="ex-muted mt-2">${draft.questions.length} preguntas · ${draft.time_limit_minutes} min</p><p class="ex-muted mt-4 text-sm">Cada pregunta tiene una sola respuesta correcta. Las claves solo son visibles para ti.</p></div></aside>
      <section class="ex-panel min-w-0 overflow-hidden"><form data-editor-form class="p-5 sm:p-8">
      ${step === 0 ? `<h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">El contexto de la prueba</h2><p class="ex-muted mt-2 mb-7">Dale un nombre reconocible y elige el tiempo necesario para resolverla.</p>
        <div class="space-y-6"><div><label class="ex-label" for="exam-job">Oferta asociada</label>${saved ? `<p id="exam-job" class="q-input">${e(saved.job_title)}</p>` : `<select id="exam-job" name="job" class="q-input" required><option value="">Selecciona una oferta</option>${usableJobs.map(j => `<option value="${e(j.id)}" ${j.id===jobId?'selected':''}>${e(j.title)}</option>`).join('')}</select>${!usableJobs.length ? '<p class="mt-2 ex-muted">Necesitas una oferta con proceso abierto. <a class="q-link" href="/reclutador/nueva-oferta">Crear una oferta</a></p>' : ''}`}</div>
        <div><label class="ex-label" for="exam-title">Nombre de la prueba</label><input id="exam-title" name="title" class="q-input" maxlength="180" required value="${e(draft.title)}" placeholder="Por ejemplo: Fundamentos de desarrollo web"/><p class="ex-muted mt-2 text-sm">Será visible para quienes postulan a esta oferta.</p></div>
        <div class="max-w-sm"><label class="ex-label" for="exam-minutes">Tiempo para resolverla</label><div class="flex items-center gap-3"><input id="exam-minutes" name="minutes" type="number" min="1" max="480" required class="q-input" value="${draft.time_limit_minutes}"/><span class="shrink-0">minutos</span></div><p class="ex-muted mt-2 text-sm">El reloj empieza cuando la persona confirma el inicio. No se pausa al salir.</p></div></div>` : step === 1 ? `<div class="ex-toolbar"><div><h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">Las preguntas</h2><p class="ex-muted mt-2">Plantea situaciones concretas del puesto.</p></div><button type="button" class="q-secondary ex-button" data-add-question ${draft.questions.length>=50?'disabled':''}>${icon('plus')}Añadir pregunta</button></div>
        ${draft.questions.length ? `<nav class="ex-question-nav my-6" aria-label="Preguntas de la prueba">${draft.questions.map((_,i)=>`<button type="button" data-question="${i}" aria-label="Editar pregunta ${i+1}" aria-current="${i===current}">${i+1}</button>`).join('')}</nav>${questionForm()}` : `<div class="py-14 text-center"><h3 class="text-xl font-semibold">Tu primera pregunta empieza aquí</h3><p class="ex-muted mx-auto mt-3 max-w-md">Puedes incluir fragmentos de código o casos prácticos en el enunciado y definir sus alternativas.</p><button type="button" class="q-primary ex-button mt-6" data-add-question>${icon('plus')}Crear primera pregunta</button></div>`}` :
        `<h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">${locked() ? e(draft.title) : 'Todo listo para revisar'}</h2><p class="ex-muted mt-2">${locked() ? 'Esta es la versión que recibirán los postulantes.' : e(draft.title || 'Prueba sin título')} · ${draft.time_limit_minutes} minutos</p>
        <div class="q-notice my-6">${locked() ? 'El contenido publicado no se puede editar. Para cambiarlo, crea una nueva prueba; los intentos anteriores se conservan.' : 'Al publicar, los postulantes de esta oferta podrán iniciar un único intento. El contenido y el tiempo quedarán fijos.'}</div>
        ${!locked() && !complete() ? '<p class="mb-5 font-medium text-amber-900 dark:text-amber-200">Falta completar preguntas, alternativas o respuestas correctas. Puedes guardar el borrador y continuar después.</p>' : ''}${preview()}`}
      </form><footer class="ex-sticky-actions">${locked() ? '<a class="q-secondary ex-button" href="/reclutador/examen?job='+e(jobId)+'">Crear otra prueba</a>' : `<div><button type="button" data-save class="q-secondary ex-button">${icon('file')}Guardar borrador</button><p data-draft-status class="ex-muted mt-2 text-sm" aria-live="polite"></p></div><div class="flex flex-wrap gap-3">${step>0?'<button type="button" data-previous class="q-secondary">Anterior</button>':''}<button type="button" ${step===2?'data-publish':'data-next'} class="q-primary ex-button">${step===2?'Publicar prueba':'Continuar'}${icon('arrow')}</button></div>`}</footer></section></div>`;
    dirtyLabel();
  }
  function questionForm() {
    const q = draft.questions[current]!;
    return `<div class="ex-toolbar mb-5"><h3 class="text-lg font-semibold">Pregunta ${current+1}</h3><div class="flex flex-wrap gap-2"><button type="button" class="q-secondary" data-move="-1" ${current===0?'disabled':''} aria-label="Mover pregunta hacia arriba">Subir</button><button type="button" class="q-secondary" data-move="1" ${current===draft.questions.length-1?'disabled':''} aria-label="Mover pregunta hacia abajo">Bajar</button><button type="button" class="q-secondary ex-button" data-remove-question>${icon('trash')}Eliminar</button></div></div>
    <label class="ex-label" for="question-text">Enunciado</label><textarea id="question-text" data-q-text rows="5" maxlength="6000" class="q-input" placeholder="Describe el problema o pega el fragmento de código…">${e(q.text)}</textarea>
    <fieldset class="mt-7"><legend class="font-semibold">Alternativas de respuesta</legend><p class="ex-muted mb-5 mt-2">Escribe opciones distintas y marca la respuesta correcta.</p>
    <div class="space-y-4">${q.options.map((o,i)=>`<div class="flex items-start gap-2"><label class="ex-button min-h-12 min-w-11 cursor-pointer self-start" title="Marcar alternativa ${String.fromCharCode(65+i)} como correcta"><input class="h-5 w-5 accent-sky-700" type="radio" name="correct" data-correct="${i}" ${o.is_correct?'checked':''} aria-label="Alternativa ${String.fromCharCode(65+i)} correcta"/></label><div class="min-w-0 flex-1"><label for="option-${i}" class="sr-only">Alternativa ${String.fromCharCode(65+i)}</label><textarea id="option-${i}" rows="2" class="q-input" data-option="${i}" maxlength="2000" placeholder="Alternativa ${String.fromCharCode(65+i)}">${e(o.text)}</textarea></div><button type="button" class="q-secondary ex-button px-3" data-remove-option="${i}" aria-label="Eliminar alternativa ${String.fromCharCode(65+i)}" ${q.options.length<=2?'disabled':''}>${icon('trash')}</button></div>`).join('')}</div>
    <button type="button" data-add-option class="q-link ex-button mt-4" ${q.options.length>=6?'disabled':''}>${icon('plus')}Añadir alternativa</button></fieldset>`;
  }
  const focusHeading = () => host.querySelector<HTMLElement>('[data-step-heading]')?.focus();
  function validateConfig() {
    if (step===0 && !host.querySelector<HTMLFormElement>('form')!.reportValidity()) return false;
    if (!jobId || !draft.title.trim() || !Number.isInteger(draft.time_limit_minutes) || draft.time_limit_minutes<1 || draft.time_limit_minutes>480) {
      step=0; render(); host.querySelector<HTMLFormElement>('form')!.reportValidity(); return false;
    }
    return true;
  }
  function setBusy(value: boolean) {
    busy=value; host.setAttribute('aria-busy',String(value));
    host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('button,input,textarea,select').forEach(el => { if(value) { el.dataset.wasDisabled=String(el.disabled);el.disabled=true; } else if(el.dataset.wasDisabled!==undefined){el.disabled=el.dataset.wasDisabled==='true';delete el.dataset.wasDisabled;} });
  }
  async function save() {
    if (!validateConfig()) return false;
    setBusy(true);
    try {
      const result = id ? await exams.update(id,draft) : await exams.create(jobId,draft);
      if (!alive()) return false;
      saved=result; id=result.id; dirty=false;
      history.replaceState(null,'','/reclutador/examen?id='+encodeURIComponent(id));
      announce('Borrador guardado. Puedes continuar cuando quieras.'); senalDeAccion('exito'); dirtyLabel(); return true;
    } catch(error) { if(alive()) failure(error,notice); return false; }
    finally { if(alive()) setBusy(false); }
  }
  host.addEventListener('input',event => {
    const target=event.target as HTMLInputElement;
    if(locked() || busy) return;
    if(target.name==='title') draft.title=target.value;
    else if(target.name==='minutes') draft.time_limit_minutes=Number(target.value);
    else if(target.name==='job') jobId=target.value;
    else if(target.hasAttribute('data-q-text')) draft.questions[current]!.text=target.value;
    else if(target.dataset.option!==undefined) draft.questions[current]!.options[Number(target.dataset.option)]!.text=target.value;
    else if(target.dataset.correct!==undefined) draft.questions[current]!.options.forEach((o,i)=>o.is_correct=i===Number(target.dataset.correct));
    dirty=true;dirtyLabel();
  },opts);
  host.addEventListener('submit',event=>event.preventDefault(),opts);
  host.addEventListener('click',async event=>{
    const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button || busy)return;
    if(button.hasAttribute('data-save')) { await save(); return; }
    if(button.hasAttribute('data-publish')) {
      if(!validateConfig())return;
      if(!complete()){step=1;render();announce('Completa cada pregunta, sus alternativas y una respuesta correcta antes de publicar.');notice.dataset.tone='error';notice.focus();return;}
      if(!await confirmAction(root,'¿Publicar esta prueba?', 'Estará disponible para los postulantes de esta oferta. No podrás modificar preguntas, respuestas ni tiempo después de publicar.', 'Publicar prueba') || !alive())return;
      if(!await save())return;
      setBusy(true);
      try { saved=await exams.publish(id!);if(!alive())return;dirty=false;step=2;render();announce('Prueba publicada. Los postulantes de la oferta ya pueden realizarla.');senalDeAccion('exito'); }
      catch(error){if(alive())failure(error,notice);}finally{if(alive())setBusy(false);}return;
    }
    if(button.dataset.step!==undefined || button.hasAttribute('data-next') || button.hasAttribute('data-previous')) {
      const next=button.dataset.step!==undefined?Number(button.dataset.step):step+(button.hasAttribute('data-next')?1:-1);
      if(next>0 && !validateConfig())return;step=next;render();focusHeading();return;
    }
    if(button.dataset.question!==undefined){current=Number(button.dataset.question);render();host.querySelector<HTMLTextAreaElement>('[data-q-text]')?.focus();return;}
    if(button.hasAttribute('data-add-question') && draft.questions.length<50){draft.questions.push(freshQuestion());current=draft.questions.length-1;dirty=true;render();host.querySelector<HTMLTextAreaElement>('[data-q-text]')?.focus();}
    if(button.hasAttribute('data-remove-question')){
      if(!await confirmAction(root,'¿Eliminar esta pregunta?','Se eliminarán el enunciado y sus alternativas del borrador.','Eliminar pregunta') || !alive())return;
      draft.questions.splice(current,1);current=Math.max(0,current-1);dirty=true;render();focusHeading();
    }
    if(button.dataset.move){const next=current+Number(button.dataset.move);[draft.questions[current],draft.questions[next]]=[draft.questions[next]!,draft.questions[current]!];current=next;dirty=true;render();}
    if(button.hasAttribute('data-add-option') && draft.questions[current]!.options.length<6){draft.questions[current]!.options.push({text:'',is_correct:false});dirty=true;render();}
    if(button.dataset.removeOption!==undefined && draft.questions[current]!.options.length>2){
      const option=draft.questions[current]!.options[Number(button.dataset.removeOption)]!;
      if(option.text && !await confirmAction(root,'¿Eliminar esta alternativa?','Se quitará su contenido del borrador.','Eliminar alternativa'))return;
      if(!alive())return;draft.questions[current]!.options.splice(Number(button.dataset.removeOption),1);dirty=true;render();
    }
  },opts);
  const mayLeave = async () => !dirty && !busy || await confirmAction(root,'¿Salir sin guardar?',busy?'Hay un guardado en curso. Espera a que termine antes de salir.':'Tus cambios sin guardar se perderán.','Salir sin guardar');
  document.addEventListener('click',async event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if(!link || (!dirty && !busy) || event.defaultPrevented || (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey)return;
    event.preventDefault();if(busy)return;if(await mayLeave() && alive()){dirty=false;location.assign(link.href);}
  },opts);
  document.addEventListener('qori:before-logout',event=>{(event as CustomEvent).detail.allowed=busy?Promise.resolve(false):mayLeave();},opts);
  window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();}},opts);
  render();
  return ()=>{abort.abort();draft={title:'',time_limit_minutes:30,questions:[]};saved=undefined;};
}
