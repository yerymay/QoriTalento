import { exams, type AttemptView, type Available } from './examenes.service';
import { ApiError } from '../compartido/services/api';
import { escape as e, icon, confirmAction, failure } from './ui';
import { senalDeAccion } from '../compartido/preferencias-senal';
type Pending = { option_id: string; client_revision: number };
export async function mountAttempt(root: HTMLElement, userId: string, alive: () => boolean) {
  const host=root.querySelector<HTMLElement>('[data-ex-content]')!,notice=root.querySelector<HTMLElement>('[data-ex-notice]')!;
  const params=new URLSearchParams(location.search),attemptId=params.get('attempt');
  let data:AttemptView|undefined,available:Available|undefined,current=0,sending=false,syncing=false,submitting=false,starting=false,hadExpiry=false,disposed=false;
  let serverBase=0,localBase=0,lastSync=0,lastTry=0;
  const pending=new Map<string,Pending>(),abort=new AbortController(),opts={signal:abort.signal};
  const active=()=>alive()&&!disposed;
  const key=()=> 'qori:exam:'+userId+':'+(data?.attempt.id??'');
  function persist() {
    try { if(pending.size)sessionStorage.setItem(key(),JSON.stringify([...pending]));else sessionStorage.removeItem(key()); }
    catch { notice.textContent='El navegador no permite conservar respuestas pendientes al recargar. Mantén esta página abierta hasta ver «Guardada». ';notice.hidden=false; }
  }
  function restore() {
    try {
      const value=JSON.parse(sessionStorage.getItem(key())??'[]');
      if(Array.isArray(value))for(const row of value){
        if(!Array.isArray(row)||row.length!==2)continue;
        const [question,p]=row;
        if(!p||!Number.isInteger(p.client_revision)||p.client_revision<1||!data?.exam.questions.find(q=>q.id===question)?.options.some(o=>o.id===p.option_id))continue;
        const saved=data.attempt.answers.find(a=>a.question_id===question);
        if(!saved || p.client_revision>saved.client_revision)pending.set(question,p);
      }
    }catch{sessionStorage.removeItem(key());}
  }
  const remaining=()=>data?Math.max(0,Date.parse(data.attempt.deadline_at_utc)-(serverBase+performance.now()-localBase)):0;
  const closed=()=>data?.attempt.status!=='IN_PROGRESS';
  const expiredLocally=()=>!!data&&remaining()<=0;
  function accept(value:AttemptView,started:number) {
    if(!active())return;
    data=value;const end=performance.now();serverBase=Date.parse(value.server_now)+(end-started)/2;localBase=end;lastSync=end;
    if(closed()) {pending.clear();persist();document.dispatchEvent(new CustomEvent('qori:exam-active',{detail:false}));}
    else document.dispatchEvent(new CustomEvent('qori:exam-active',{detail:true}));
  }
  const savedAnswer=(id:string)=>data?.attempt.answers.find(a=>a.question_id===id);
  function noticeText(message:string,tone='error') {notice.textContent=message;notice.dataset.tone=tone;notice.hidden=false;}
  function renderInstructions() {
    host.innerHTML=`<a class="q-link ui-button mb-5" href="/postulante/examenes">${icon('back')}Mis pruebas</a><section class="ui-panel mx-auto max-w-3xl p-6 sm:p-10"><h2 class="text-2xl font-semibold">${e(available!.title)}</h2><p class="ex-muted mt-2">${e(available!.job_title)}</p><div class="my-7 flex flex-wrap gap-5 border-y border-slate-200 py-5 dark:border-slate-700"><p class="ui-button">${icon('clock')}<strong>${available!.time_limit_seconds/60} minutos</strong></p><p class="ui-button">${icon('file')}${available!.question_count} preguntas</p><p class="ui-button">${icon('lock')}Un intento</p></div>
    <h3 class="text-lg font-semibold">Antes de comenzar</h3><ul class="mt-4 list-disc space-y-3 pl-5 leading-relaxed"><li>Elige una alternativa por pregunta. Puedes cambiarla mientras quede tiempo.</li><li>Comprueba el mensaje <strong>Guardada</strong> antes de avanzar. El servidor guarda cada respuesta por separado.</li><li>El tiempo sigue corriendo si cierras la página o pierdes conexión. Puedes regresar a este mismo intento.</li><li>Al terminar el tiempo, se envía lo que el servidor haya guardado. No se aceptan respuestas tardías.</li></ul>
    <p class="ex-muted mt-7">Empieza cuando tengas tiempo y una conexión estable. El reloj aún no ha comenzado.</p><button data-start type="button" class="ui-button--primary ui-button mt-6">Comenzar prueba${icon('arrow')}</button></section>`;
  }
  function renderReceipt() {
    root.querySelector<HTMLDialogElement>('[data-ex-confirm]')?.close();
    host.innerHTML=`<section class="ui-panel mx-auto max-w-3xl p-6 sm:p-10"><div class="mb-5 inline-flex items-center gap-2 font-medium text-sky-800 dark:text-sky-200">${icon('check')}Envío confirmado</div><h2 tabindex="-1" data-receipt class="text-2xl font-semibold">${data!.attempt.status==='EXPIRED'?'El tiempo terminó. Tu prueba fue enviada.':'Tu prueba fue enviada'}</h2><p class="ex-muted mt-3">${e(data!.exam.title)}</p><dl class="my-7 space-y-4 border-y border-slate-200 py-6 dark:border-slate-700"><div class="flex flex-wrap justify-between gap-2"><dt>Respuestas guardadas</dt><dd class="font-semibold">${data!.attempt.answers.length} de ${data!.exam.questions.length}</dd></div><div class="flex flex-wrap justify-between gap-2"><dt>Fecha de envío</dt><dd>${e(new Date(data!.attempt.finished_at_utc!).toLocaleString('es-PE'))}</dd></div><div class="flex flex-wrap justify-between gap-2"><dt>Constancia</dt><dd>#${e(data!.attempt.id)}</dd></div></dl><p class="ex-muted leading-relaxed">Se conservaron tus respuestas para su evaluación. Esta constancia confirma el envío; la calificación todavía no está disponible.</p><a class="ui-button--primary ui-button mt-7" href="/postulante/examenes">Volver a mis pruebas${icon('arrow')}</a></section>`;
  }
  function renderExam() {
    if(!data)return;
    if(closed()){renderReceipt();return;}
    host.innerHTML=`<div class="ex-toolbar sticky top-18 z-10 mb-5 bg-slate-50 py-3 dark:bg-slate-950"><div class="min-w-0"><h2 class="text-xl font-semibold">${e(data.exam.title)}</h2><p class="ex-muted mt-1">${e(data.exam.job_title)}</p></div><div class="ex-time" data-time-box>${icon('clock')}<span data-time role="timer" aria-label="Tiempo restante" aria-live="off"></span></div></div>
      <div data-connection class="ui-alert mb-5" role="status" hidden></div><p data-time-warning class="sr-only" role="status"></p>
      <div class="ex-grid"><aside class="ex-rail ui-panel order-2 p-5 xl:order-1"><h3 class="font-semibold">Tu avance</h3><p data-progress-label class="ex-muted my-3"></p><progress data-progress class="ex-progress" max="${data.exam.questions.length}" value="0" aria-label="Preguntas guardadas"></progress><nav data-question-nav aria-label="Ir a una pregunta" class="ex-question-nav my-5">${data.exam.questions.map((q,i)=>`<button type="button" data-go="${i}" data-question-id="${e(q.id)}" aria-label="Pregunta ${i+1}">${i+1}</button>`).join('')}</nav><p class="ex-muted text-sm">Puedes revisar cualquier pregunta antes de enviar.</p><button data-review type="button" class="ui-button--secondary w-full mt-5">Revisar y enviar</button></aside>
      <section class="ui-panel order-1 min-w-0 overflow-hidden xl:order-2"><div data-question-body class="p-5 sm:p-8"></div><footer class="ex-sticky-actions"><button type="button" data-prev class="ui-button--secondary ui-button">${icon('back')}Anterior</button><button type="button" data-next class="ui-button--primary ui-button">Siguiente${icon('arrow')}</button></footer></section></div>`;
    renderQuestion();update();
  }
  function renderQuestion() {
    const q=data!.exam.questions[current]!,chosen=pending.get(q.id)?.option_id??savedAnswer(q.id)?.option_id;
    host.querySelector('[data-question-body]')!.innerHTML=`<p class="ex-muted mb-4">Pregunta ${current+1} de ${data!.exam.questions.length}</p><h3 tabindex="-1" data-question-heading class="ex-question-text font-semibold" id="attempt-question">${e(q.text)}</h3><fieldset class="mt-7 space-y-3" aria-labelledby="attempt-question"><legend class="sr-only">Elige una respuesta</legend>${q.options.map((o,i)=>`<label class="ex-option"><input type="radio" name="answer" value="${e(o.id)}" ${chosen===o.id?'checked':''}/><span class="font-medium">${String.fromCharCode(65+i)}.</span><span class="min-w-0 whitespace-pre-wrap">${e(o.text)}</span></label>`).join('')}</fieldset><p data-save-status class="mt-5 flex items-center gap-2 text-sm" role="status"></p><button type="button" data-retry-answer class="q-link mt-2" hidden>Reintentar guardado</button>`;
  }
  function update() {
    if(!data||closed())return;
    const seconds=Math.ceil(remaining()/1000),time=host.querySelector('[data-time]');
    if(!time)return;
    time.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
    host.querySelector<HTMLElement>('[data-time-box]')!.dataset.urgent=String(seconds<=60);
    if(seconds<=60&&!hadExpiry){hadExpiry=true;host.querySelector('[data-time-warning]')!.textContent='Queda un minuto o menos. Revisa las respuestas pendientes.';}
    const confirmed=data.attempt.answers.length;
    host.querySelector('[data-progress-label]')!.textContent=confirmed+' de '+data.exam.questions.length+' guardadas';
    (host.querySelector('[data-progress]') as HTMLProgressElement).value=confirmed;
    host.querySelectorAll<HTMLButtonElement>('[data-go]').forEach(button=>{
      const id=button.dataset.questionId!;
      button.dataset.saved=String(!!savedAnswer(id)&&!pending.has(id));
      button.setAttribute('aria-current',String(Number(button.dataset.go)===current));
      button.setAttribute('aria-label','Pregunta '+(Number(button.dataset.go)+1)+(pending.has(id)?', pendiente de guardar':savedAnswer(id)?', guardada':', sin responder'));
    });
    const question=data.exam.questions[current]!,status=host.querySelector<HTMLElement>('[data-save-status]')!;
    const hasPending=pending.has(question.id);
    status.textContent=hasPending?(sending?'Guardando respuesta…':'Pendiente de guardar. Mantén esta página abierta.'):savedAnswer(question.id)?'Guardada en el servidor':'Aún no has respondido esta pregunta.';
    status.className='mt-5 flex items-center gap-2 text-sm '+(hasPending?'text-amber-900 dark:text-amber-200':'ex-muted');
    host.querySelector<HTMLButtonElement>('[data-retry-answer]')!.hidden=!hasPending||sending||seconds<=0;
    host.querySelectorAll<HTMLInputElement>('input[name="answer"]').forEach(input=>input.disabled=seconds<=0||submitting);
    host.querySelector<HTMLButtonElement>('[data-prev]')!.disabled=current===0;
    host.querySelector<HTMLButtonElement>('[data-next]')!.textContent=current===data.exam.questions.length-1?'Revisar y enviar':'Siguiente';
    host.querySelector<HTMLButtonElement>('[data-review]')!.disabled=seconds<=0||submitting;
    const connection=host.querySelector<HTMLElement>('[data-connection]')!;
    connection.hidden=navigator.onLine&&seconds>0;
    connection.textContent=seconds<=0?'El tiempo terminó. Estamos comprobando el envío con el servidor. Las respuestas pendientes ya no se enviarán.':'Sin conexión. Conservamos tus selecciones pendientes en este navegador. El tiempo sigue corriendo.';
  }
  async function synchronize() {
    if(!data||syncing||sending||submitting||!active())return;
    syncing=true;const started=performance.now();
    try {
      const result=await exams.read(data.attempt.id);if(!active())return;
      const wasClosed=closed();accept(result,started);
      for(const [question,p] of pending){const saved=savedAnswer(question);if(saved&&saved.client_revision>=p.client_revision)pending.delete(question);}
      persist();
      if(closed()&&!wasClosed){notice.hidden=true;renderReceipt();senalDeAccion('exito');}
      else {const q=data!.exam.questions[current]!;const chosen=pending.get(q.id)?.option_id??savedAnswer(q.id)?.option_id;host.querySelectorAll<HTMLInputElement>('input[name="answer"]').forEach(input=>{input.checked=input.value===chosen;});update();}
    }catch(error){if(active()){failure(error,notice);update();}}
    finally{syncing=false;}
  }
  async function flush():Promise<boolean> {
    if(sending||!data||closed()||expiredLocally()||!active())return false;
    sending=true;lastTry=performance.now();update();let failedQuestion='';
    try {
      for(const [question] of pending) {
        if(!active()||expiredLocally())break;
        failedQuestion=question;const value=pending.get(question)!;const started=performance.now();
        const result=await exams.answer(data.attempt.id,question,value.option_id,value.client_revision);
        if(!active())return false;
        accept(result,started);
        if(pending.get(question)?.client_revision===value.client_revision)pending.delete(question);
        persist();update();
      }
      if(!pending.size){notice.hidden=true;return true;}
      return false;
    }catch(error){
      if(active()){
        failure(error,notice);
        if(error instanceof ApiError&&error.code==='ANSWER_CONFLICT'){
          pending.delete(failedQuestion);persist();noticeText('Otra pestaña guardó una respuesta más reciente. Sincronizamos el intento; vuelve a elegir si deseas cambiarla.');
          setTimeout(()=>void synchronize(),0);
        }
        if(error instanceof ApiError&&error.code==='ATTEMPT_CLOSED')setTimeout(()=>void synchronize(),0);
      }
      return false;
    }finally{sending=false;if(active())update();}
  }
  async function finish() {
    if(!data||submitting||!active())return;
    if(expiredLocally()){await synchronize();return;}
    if(sending){noticeText('Espera a que termine el guardado antes de enviar.');return;}
    if(pending.size&&!await flush())return;
    if(!active()||!data)return;
    const unanswered=data.exam.questions.length-data.attempt.answers.length;
    if(!await confirmAction(root,'¿Enviar tu prueba?',unanswered?'Quedan '+unanswered+' preguntas sin responder. Se enviarán las respuestas guardadas y no podrás modificarlas.':'Todas las respuestas están guardadas. Después de enviar no podrás modificarlas.','Enviar prueba')||!active())return;
    if(pending.size||sending)return;
    submitting=true;update();const started=performance.now();
    try {accept(await exams.submit(data.attempt.id),started);if(active()){notice.hidden=true;renderReceipt();senalDeAccion('exito');}}
    catch(error){if(active())failure(error,notice);}
    finally{submitting=false;if(active()&&!closed())update();}
  }
  if(attemptId){const started=performance.now();accept(await exams.read(attemptId),started);if(active()){restore();renderExam();}}
  else {
    const exam=params.get('exam'),application=params.get('application');
    available=(await exams.available()).items.find(item=>item.id===exam&&item.application_id===application);
    if(!available)throw new Error('Esta prueba no está disponible. Vuelve a Mis pruebas para consultar tus evaluaciones.');
    if(!active())return ()=>{};
    if(available.attempt_id){const started=performance.now();accept(await exams.read(available.attempt_id),started);history.replaceState(null,'','/postulante/examen?attempt='+available.attempt_id);restore();renderExam();}
    else renderInstructions();
  }
  host.addEventListener('change',event=>{
    const target=event.target as HTMLInputElement;if(target.name!=='answer'||!data||closed()||expiredLocally()||submitting)return;
    const question=data.exam.questions[current]!;
    const revision=Math.max(savedAnswer(question.id)?.client_revision??0,pending.get(question.id)?.client_revision??0)+1;
    pending.set(question.id,{option_id:target.value,client_revision:revision});persist();update();void flush();
  },opts);
  host.addEventListener('click',async event=>{
    const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.hasAttribute('data-start')){
      if(starting||!available)return;
      if(!await confirmAction(root,'¿Comenzar ahora?','Tendrás '+available.time_limit_seconds/60+' minutos. El reloj seguirá corriendo aunque salgas de esta página.','Comenzar ahora')||!active())return;
      starting=true;button.disabled=true;button.textContent='Iniciando…';const started=performance.now();
      try{accept(await exams.start(available.id,available.application_id),started);if(active()){history.replaceState(null,'','/postulante/examen?attempt='+data!.attempt.id);restore();renderExam();}}
      catch(error){if(active()){failure(error,notice);button.disabled=false;button.textContent='Reintentar inicio';}}
      finally{starting=false;}return;
    }
    if(button.hasAttribute('data-review') || button.hasAttribute('data-next')&&current===data!.exam.questions.length-1){await finish();return;}
    if(button.hasAttribute('data-retry-answer')){void flush();return;}
    if(button.dataset.go!==undefined || button.hasAttribute('data-prev') || button.hasAttribute('data-next')){
      current=button.dataset.go!==undefined?Number(button.dataset.go):current+(button.hasAttribute('data-prev')?-1:1);renderQuestion();update();host.querySelector<HTMLElement>('[data-question-heading]')!.focus();
    }
  },opts);
  window.addEventListener('online',()=>{update();if(expiredLocally())void synchronize();else void flush();},opts);
  window.addEventListener('offline',update,opts);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void synchronize();},opts);
  window.addEventListener('beforeunload',event=>{if(data&&!closed()&&(pending.size||sending)){event.preventDefault();}},opts);
  document.addEventListener('qori:before-logout',event=>{
    if(data&&!closed())(event as CustomEvent).detail.allowed=confirmAction(root,'¿Salir de la prueba?',pending.size?'Hay respuestas sin guardar. Al cerrar sesión se borrarán las selecciones pendientes y el reloj seguirá corriendo.':'El reloj seguirá corriendo. Podrás volver al mismo intento mientras quede tiempo.','Cerrar sesión');
  },opts);
  document.addEventListener('qori:session-cleared',event=>{if(!(event as CustomEvent).detail?.preserveLocal){try{sessionStorage.removeItem(key());}catch{}}},opts);
  const timer=window.setInterval(()=>{
    if(!active()||!data||closed())return;
    update();
    if(expiredLocally()){if(performance.now()-lastTry>3000){lastTry=performance.now();void synchronize();}return;}
    if(pending.size&&performance.now()-lastTry>3000&&navigator.onLine)void flush();
    else if(performance.now()-lastSync>20000&&!pending.size)void synchronize();
  },500);
  return ()=>{disposed=true;abort.abort();clearInterval(timer);document.dispatchEvent(new CustomEvent('qori:exam-active',{detail:false}));pending.clear();data=undefined;};
}
