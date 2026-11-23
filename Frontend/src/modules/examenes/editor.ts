import { showToast } from '../compartido/services/toast';
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
  let step = saved?.status === 'PUBLISHED' ? 2 : 0, current = 0, dirty = false, busy = false, savingDraft = false;
  const abort = new AbortController(), opts = { signal: abort.signal };
  const locked = () => saved?.status === 'PUBLISHED';
  const complete = () => draft.questions.length > 0 && draft.questions.every(q => q.text.trim() && q.options.every(o => o.text.trim()) && q.options.filter(o => o.is_correct).length === 1);
  const selectedJob = () => saved?.job_title ?? usableJobs.find(j => j.id === jobId)?.title ?? 'Selecciona una oferta';
  const dirtyLabel = () => {
    const label = host.querySelector('[data-draft-status]');
    const jobLabel=host.querySelector('[data-editor-job-title]'),meta=host.querySelector('[data-editor-meta]');
    if(jobLabel)jobLabel.textContent=selectedJob();if(meta)meta.textContent=draft.questions.length+' preguntas · '+draft.time_limit_minutes+' min';
    if(dirty && notice.dataset.tone==='success')notice.hidden=true;
    if (label) label.textContent = savingDraft ? 'Guardando…' : dirty ? 'Cambios sin guardar' : saved ? 'Borrador guardado' : 'Aún no se ha guardado';
  };
  const configReady = () => !!jobId && !!draft.title.trim() && Number.isInteger(draft.time_limit_minutes) && draft.time_limit_minutes>=1 && draft.time_limit_minutes<=480;
  const pendingQuestions = () => draft.questions.flatMap((q,i)=>{
    const reasons=[];
    if(!q.text.trim())reasons.push('falta el enunciado');
    if(q.options.some(o=>!o.text.trim()))reasons.push('hay alternativas sin texto');
    if(q.options.filter(o=>o.is_correct).length!==1)reasons.push('elige una respuesta correcta');
    return reasons.length?[{index:i,reason:reasons.join('; ')}]:[];
  });
  const reviewWarning = () => locked() ? '' : (!configReady() || !complete()) ?
    '<div class="ui-alert my-6" data-tone="warning" role="status"><strong class="block">Completa la prueba antes de publicar</strong><ul class="mt-2 space-y-2">'+
    (!configReady()?'<li><a href="#exam-title" data-review-config class="q-link">Ir a configuración</a>: revisa oferta, título y tiempo.</li>':'')+
    (!draft.questions.length?'<li><a href="#question-text" data-review-question="0" class="q-link">Añadir la primera pregunta</a></li>':'')+
    pendingQuestions().map(q=>'<li><a href="#question-text" data-review-question="'+q.index+'" class="q-link">Ir a la pregunta '+(q.index+1)+'</a>: '+e(q.reason)+'.</li>').join('')+
    '</ul></div>':'';
  const publishReason = () => !configReady()?'Revisa la oferta, el título y el tiempo en Configuración.':!draft.questions.length?'Añade al menos una pregunta para publicar.':!complete()?'Completa los enunciados, las alternativas y una respuesta correcta por pregunta.':'';
  function moveQuestion(from:number,to:number) {
    if(busy||locked()||from===to||from<0||from>=draft.questions.length||to<0||to>=draft.questions.length)return;
    const selected=draft.questions[current]!;
    const [question]=draft.questions.splice(from,1);draft.questions.splice(to,0,question!);
    current=draft.questions.indexOf(selected);dirty=true;render();
    host.querySelector<HTMLElement>('[data-drag-question="'+to+'"]')?.focus();
    orderStatus.textContent='Pregunta movida de la posición '+(from+1)+' a la '+(to+1)+'.';
  }
  const orderStatus=document.createElement('p');orderStatus.className='sr-only';orderStatus.setAttribute('role','status');root.append(orderStatus);
  let dragging:number|undefined;
  function closeMenus(restore=false){
    host.querySelectorAll<HTMLButtonElement>('[data-editor-menu-trigger][aria-expanded=true]').forEach(trigger=>{
      const menu=host.querySelector<HTMLElement>('#'+trigger.getAttribute('aria-controls'));
      if(menu)menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore)trigger.focus();
    });
  }
  const preview = () => draft.questions.length ? draft.questions.map((q, i) => `<section class="border-t border-slate-200 py-6 dark:border-slate-700"><h3 class="mb-4 font-semibold">Pregunta ${i + 1}</h3><p class="ex-question-text mb-5">${e(q.text || 'Falta el enunciado')}</p><ul class="space-y-2">${q.options.map((o,j) => `<li class="flex items-start gap-3 rounded-lg p-3 ${o.is_correct ? 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100' : 'bg-slate-50 dark:bg-slate-800'}"><span class="font-semibold">${String.fromCharCode(65+j)}.</span><span class="min-w-0 flex-1 whitespace-pre-wrap">${e(o.text || 'Alternativa pendiente')}</span>${o.is_correct ? icon('check') + '<span class="ui-badge" data-tone="success">Correcta</span>' : ''}</li>`).join('')}</ul></section>`).join('') : '<p class="ex-muted py-8">Todavía no hay preguntas. Añade la primera en el paso Preguntas.</p>';
  function render() {
    if (!alive()) return;
    host.innerHTML = `<div class="ex-toolbar mb-6"><a class="q-link ui-button" href="/reclutador/examenes${jobId ? '?job=' + e(jobId) : ''}">${icon('back')}Todas las pruebas</a><span class="ui-badge" data-state="${locked() ? 'PUBLISHED' : 'DRAFT'}">${icon(locked() ? 'lock' : 'file')}${locked() ? 'Publicada · contenido protegido' : 'Borrador · solo tú puedes verlo'}</span></div>
      <div class="ex-grid"><aside class="ex-rail"><nav aria-label="Pasos para crear la prueba" class="space-y-2">${['Configuración','Preguntas','Revisar y publicar'].map((label,i) => `<button type="button" class="ex-nav-button" data-step="${i}" aria-current="${step===i ? 'step' : 'false'}" ${locked() && i!==2 ? 'disabled' : ''}><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm">${i+1}</span>${label}</button>`).join('')}</nav>
      <div class="mt-6 hidden border-t border-slate-200 pt-5 dark:border-slate-700 xl:block"><p data-editor-job-title class="font-medium break-words">${e(selectedJob())}</p><p data-editor-meta class="ex-muted mt-2">${draft.questions.length} preguntas · ${draft.time_limit_minutes} min</p><p class="ex-muted mt-4 text-sm">Cada pregunta tiene una sola respuesta correcta. Las claves solo son visibles para ti.</p></div></aside>
      <section class="ui-panel min-w-0 overflow-hidden"><form data-editor-form class="p-5 sm:p-8">
      ${step === 0 ? `<h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">El contexto de la prueba</h2><p class="ex-muted mt-2 mb-7">Dale un nombre reconocible y elige el tiempo necesario para resolverla.</p>
        <div class="space-y-6"><div><label class="ex-label" for="exam-job">Oferta asociada</label>${saved ? `<p id="exam-job" class="q-input">${e(saved.job_title)}</p>` : `<select id="exam-job" name="job" class="q-input" required><option value="">Selecciona una oferta</option>${usableJobs.map(j => `<option value="${e(j.id)}" ${j.id===jobId?'selected':''}>${e(j.title)}</option>`).join('')}</select>${!usableJobs.length ? '<p class="mt-2 ex-muted">Necesitas una oferta con proceso abierto. <a class="q-link" href="/reclutador/nueva-oferta">Crear una oferta</a></p>' : ''}`}</div>
        <div><label class="ex-label" for="exam-title">Nombre de la prueba</label><input id="exam-title" name="title" class="q-input" maxlength="180" required value="${e(draft.title)}" placeholder="Por ejemplo: Fundamentos de desarrollo web"/><p class="ex-muted mt-2 text-sm">Será visible para quienes postulan a esta oferta.</p></div>
        <div class="max-w-sm"><label class="ex-label" for="exam-minutes">Tiempo para resolverla</label><div class="flex items-center gap-3"><input id="exam-minutes" name="minutes" type="number" min="1" max="480" required class="q-input" value="${draft.time_limit_minutes}"/><span class="shrink-0">minutos</span></div><p class="ex-muted mt-2 text-sm">El reloj empieza cuando la persona confirma el inicio. No se pausa al salir.</p></div></div>` : step === 1 ? `<div class="ex-toolbar"><div><h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">Las preguntas</h2><p class="ex-muted mt-2">Plantea situaciones concretas del puesto.</p></div><button type="button" class="ui-button--secondary ui-button" data-add-question ${!draft.questions.length?'hidden':''} ${draft.questions.length>=50?'disabled title="Máximo 50 preguntas"':''}>${icon('plus')}Añadir pregunta</button></div>
        ${draft.questions.length ? `<nav class="ex-editor-pages my-6" aria-label="Preguntas de la prueba" aria-describedby="ex-order-help">${draft.questions.map((_,i)=>`<span class="ex-editor-chip" data-sort-target="${i}"><button type="button" class="ex-drag-handle" data-drag-question="${i}" aria-label="Reordenar pregunta ${i+1}" title="Arrastra o usa Alt + flechas para reordenar" aria-describedby="ex-order-help">${icon('grip')}</button><button type="button" data-question="${i}" aria-label="Editar pregunta ${i+1}" aria-current="${i===current}">Pregunta ${i+1}</button></span>`).join('')}</nav><p id="ex-order-help" class="ex-muted mb-5 text-sm">Arrastra desde el asa para cambiar el orden. Con teclado: enfoca el asa y usa Alt + flechas; Alt + Inicio o Fin mueve al principio o al final.</p>${questionForm()}` : `<div class="ui-empty py-14"><h3 class="text-xl font-semibold">Tu primera pregunta empieza aquí</h3><p class="ex-muted mx-auto mt-3 max-w-md">Puedes incluir fragmentos de código o casos prácticos en el enunciado y definir sus alternativas.</p><button type="button" class="ui-button--primary ui-button mt-6" data-add-question>${icon('plus')}Crear primera pregunta</button></div>`}` :
        `<h2 tabindex="-1" data-step-heading class="text-2xl font-semibold">${locked() ? e(draft.title) : 'Todo listo para revisar'}</h2><p class="ex-muted mt-2">${locked() ? 'Esta es la versión que recibirán los postulantes.' : e(draft.title || 'Prueba sin título')} · ${draft.time_limit_minutes} minutos</p>
        <div class="ui-alert my-6">${locked() ? 'El contenido publicado no se puede editar. Para cambiarlo, crea una nueva prueba; los intentos anteriores se conservan.' : 'Al publicar, los postulantes de esta oferta podrán iniciar un único intento. El contenido y el tiempo quedarán fijos.'}</div>
        ${reviewWarning()}${preview()}`}
      </form><footer class="ex-sticky-actions">${locked() ? '<a class="ui-button--secondary ui-button" href="/reclutador/examen?job='+e(jobId)+'">Crear otra prueba</a>' : `<div><button type="button" data-save class="ui-button--secondary ui-button">${icon('file')}Guardar borrador</button><p data-draft-status class="ex-muted mt-2 text-sm" aria-live="polite"></p></div><div class="flex flex-wrap gap-3">${step>0?'<button type="button" data-previous class="ui-button--secondary">Anterior</button>':''}<button type="button" ${step===2?'data-publish '+(publishReason()?'disabled aria-describedby="ex-publish-reason"':''):'data-next'} class="ui-button--primary ui-button">${step===2?'Publicar prueba':'Continuar'}${icon('arrow')}</button>${step===2&&publishReason()?'<p id="ex-publish-reason" class="ex-muted max-w-sm text-sm">'+e(publishReason())+'</p>':''}</div>`}</footer></section></div>`;
    dirtyLabel();host.querySelectorAll<HTMLTextAreaElement>('[data-option]').forEach(input=>{input.style.height='auto';input.style.height=input.scrollHeight+'px';});
  }
  function questionForm() {
    const q = draft.questions[current]!;
    return `<div class="ex-toolbar mb-5"><h3 class="text-lg font-semibold">Pregunta ${current+1}</h3><div class="ex-editor-menu"><button type="button" class="ui-button ui-button--icon" data-editor-menu-trigger aria-haspopup="menu" aria-controls="question-menu" aria-expanded="false" aria-label="Opciones de la pregunta ${current+1}">${icon('more')}</button><div id="question-menu" role="menu" aria-label="Opciones de la pregunta" class="ui-menu-popup" hidden><button type="button" role="menuitem" data-remove-question>Eliminar pregunta</button></div></div></div>
    <label class="ex-label" for="question-text">Enunciado</label><textarea id="question-text" data-q-text rows="5" maxlength="6000" class="q-input" placeholder="Describe el problema o pega el fragmento de código.">${e(q.text)}</textarea>
    <fieldset class="mt-6"><legend class="font-semibold">Alternativas de respuesta</legend><p class="ex-muted mb-3 mt-2 text-sm">Marca una sola alternativa como correcta.</p>
    <div class="space-y-2">${q.options.map((o,i)=>`<div class="ex-editor-option"><label for="option-${i}" class="ex-option-letter">${String.fromCharCode(65+i)}</label><textarea id="option-${i}" rows="1" class="q-input" data-option="${i}" maxlength="2000" aria-label="Alternativa ${String.fromCharCode(65+i)}" placeholder="Escribe la alternativa">${e(o.text)}</textarea><label class="ex-correct-label"><input class="h-5 w-5 accent-sky-700" type="radio" name="correct" data-correct="${i}" ${o.is_correct?'checked':''} aria-label="Alternativa ${String.fromCharCode(65+i)} correcta"/><span>Correcta</span></label><div class="ex-editor-menu"><button type="button" class="ui-button ui-button--icon" data-editor-menu-trigger aria-haspopup="menu" aria-controls="option-menu-${i}" aria-expanded="false" aria-label="Opciones de la alternativa ${String.fromCharCode(65+i)}">${icon('more')}</button><div id="option-menu-${i}" role="menu" aria-label="Opciones de la alternativa ${String.fromCharCode(65+i)}" class="ui-menu-popup" hidden><button type="button" role="menuitem" data-remove-option="${i}" ${q.options.length<=2?'disabled':''}>Eliminar alternativa</button>${q.options.length<=2?'<p class="px-3 py-2 text-sm ex-muted">Se necesitan al menos dos alternativas.</p>':''}</div></div></div>`).join('')}</div>
    <button type="button" data-add-option class="q-link ui-button mt-3" ${q.options.length>=6?'disabled':''}>${icon('plus')}Añadir alternativa</button>${q.options.length>=6?'<p class="ex-muted text-sm">Máximo seis alternativas por pregunta.</p>':''}</fieldset>`;

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
    savingDraft=true;dirtyLabel();setBusy(true);
    try {
      const result = id ? await exams.update(id,draft) : await exams.create(jobId,draft);
      if (!alive()) return false;
      saved=result; id=result.id; dirty=false;
      history.replaceState(null,'','/reclutador/examen?id='+encodeURIComponent(id));
      notice.hidden=true;dirtyLabel(); return true;
    } catch(error) { if(alive()) failure(error,notice); return false; }
    finally { savingDraft=false;if(alive()){setBusy(false);dirtyLabel();} }
  }
  host.addEventListener('pointerdown',event=>{
    const handle=(event.target as Element).closest<HTMLButtonElement>('[data-drag-question]');
    if(!handle||busy||locked()||event.button!==0)return;
    dragging=Number(handle.dataset.dragQuestion);handle.setPointerCapture(event.pointerId);
    handle.dataset.dragging='true';handle.focus();
  },opts);
  host.addEventListener('pointermove',event=>{
    if(dragging===undefined)return;event.preventDefault();
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-sort-target]');
    host.querySelectorAll<HTMLElement>('[data-sort-target]').forEach(chip=>chip.toggleAttribute('data-drop-target',chip===target));
  },opts);
  host.addEventListener('pointerup',event=>{
    if(dragging===undefined)return;
    const from=dragging;dragging=undefined;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-sort-target]');
    host.querySelectorAll<HTMLElement>('[data-dragging],[data-drop-target]').forEach(el=>{delete el.dataset.dragging;delete el.dataset.dropTarget;});
    if(target)moveQuestion(from,Number(target.dataset.sortTarget));
  },opts);
  host.addEventListener('pointercancel',()=>{dragging=undefined;host.querySelectorAll<HTMLElement>('[data-dragging],[data-drop-target]').forEach(el=>{delete el.dataset.dragging;delete el.dataset.dropTarget;});},opts);
  host.addEventListener('keydown',event=>{
    const handle=(event.target as Element).closest<HTMLElement>('[data-drag-question]');
    if(handle&&event.altKey&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();const from=Number(handle.dataset.dragQuestion);
      moveQuestion(from,event.key==='Home'?0:event.key==='End'?draft.questions.length-1:from+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1));return;
    }
    const trigger=(event.target as Element).closest<HTMLButtonElement>('[data-editor-menu-trigger]');
    if(trigger&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();trigger.click();return;}
    const menu=(event.target as Element).closest<HTMLElement>('[role=menu]');if(!menu)return;
    if(event.key==='Escape'){event.preventDefault();closeMenus(true);return;}
    if(event.key==='Tab'){closeMenus();return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();const list=[...menu.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)')],i=list.indexOf(document.activeElement as HTMLButtonElement);
      list[event.key==='Home'?0:event.key==='End'?list.length-1:(i+(event.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();
    }
  },opts);
  document.addEventListener('pointerdown',event=>{if(!(event.target as Element).closest('.ex-editor-menu'))closeMenus();},opts);
  host.addEventListener('input',event => {
    const target=event.target as HTMLInputElement;
    if(locked() || busy) return;
    if(target.name==='title') draft.title=target.value;
    else if(target.name==='minutes') draft.time_limit_minutes=Number(target.value);
    else if(target.name==='job') jobId=target.value;
    else if(target.hasAttribute('data-q-text')) draft.questions[current]!.text=target.value;
    else if(target.dataset.option!==undefined) draft.questions[current]!.options[Number(target.dataset.option)]!.text=target.value;
    else if(target.dataset.correct!==undefined) draft.questions[current]!.options.forEach((o,i)=>o.is_correct=i===Number(target.dataset.correct));
    dirty=true;dirtyLabel();if(target.matches('[data-option]')){target.style.height='auto';target.style.height=target.scrollHeight+'px';}
  },opts);
  host.addEventListener('submit',event=>event.preventDefault(),opts);
  host.addEventListener('click',async event=>{
    const jump=(event.target as Element).closest<HTMLElement>('[data-review-question],[data-review-config]');
    if(jump){event.preventDefault();if(jump.hasAttribute('data-review-config')){step=0;render();focusHeading();}else{step=1;current=Number(jump.dataset.reviewQuestion);if(!draft.questions.length){draft.questions.push(freshQuestion());dirty=true;}render();host.querySelector<HTMLElement>('[data-q-text]')?.focus();}return;}
    const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button || busy || button.disabled)return;
    if(button.hasAttribute('data-editor-menu-trigger')){const open=button.getAttribute('aria-expanded')==='true';closeMenus();if(!open){const menu=host.querySelector<HTMLElement>('#'+button.getAttribute('aria-controls'))!;menu.hidden=false;button.setAttribute('aria-expanded','true');menu.querySelector<HTMLElement>('[role=menuitem]:not(:disabled)')?.focus();}return;}
    closeMenus();
    if(button.hasAttribute('data-save')) { await save(); return; }
    if(button.hasAttribute('data-publish')) {
      if(!validateConfig())return;
      if(!complete()){step=1;render();failure(new Error('Completa cada pregunta, sus alternativas y una respuesta correcta antes de publicar.'),notice);notice.focus();return;}
      if(!await confirmAction(root,'¿Publicar esta prueba?', 'Estará disponible para los postulantes de esta oferta. No podrás modificar preguntas, respuestas ni tiempo después de publicar.', 'Publicar prueba') || !alive())return;
      if(!await save())return;
      setBusy(true);
      try { saved=await exams.publish(id!);if(!alive())return;dirty=false;step=2;render();showToast('Los postulantes de la oferta ya pueden realizarla.','success',{title:'Prueba publicada'});senalDeAccion('exito'); }
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
  return ()=>{orderStatus.remove();abort.abort();draft={title:'',time_limit_minutes:30,questions:[]};saved=undefined;};
}
