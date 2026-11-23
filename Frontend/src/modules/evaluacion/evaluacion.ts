import { ApiError } from '../compartido/services/api';
import { evaluationApi, type Assessment, type EvaluationView, type Rating, type ReviewInput } from './evaluacion.service';

const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const labels:Record<Rating,string>={MEETS:'Cumple',PARTIAL:'Cumple parcialmente',DOES_NOT_MEET:'No cumple',INSUFFICIENT_EVIDENCE:'Sin evidencia suficiente'};
const fields:Record<string,string>={summary:'Resumen',education:'Formación',experience:'Experiencia',skills:'Habilidades',languages:'Idiomas'};
const number=(value:number)=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:2}).format(value);
export function initEvaluation(){
  const root=document.querySelector<HTMLElement>('[data-evaluation]');if(!root)return;
  const content=root.querySelector<HTMLElement>('[data-evaluation-content]')!;
  const loading=root.querySelector<HTMLElement>('[data-evaluation-loading]')!;
  const message=root.querySelector<HTMLElement>('[data-evaluation-message]')!;
  const retry=root.querySelector<HTMLButtonElement>('[data-evaluation-retry]')!;
  const id=new URLSearchParams(location.search).get('application')??'';
  let view:EvaluationView|undefined,active=false,epoch=0,busy=false,dirty=false;
  const notice=(text:string,error=false,reveal=false)=>{message.textContent=text;message.dataset.tone=error?'error':'success';message.hidden=false;if(reveal){message.focus({preventScroll:true});message.scrollIntoView({block:'center',behavior:'instant'});}};
  const fail=(error:unknown)=>{
    if(error instanceof ApiError&&[401,403].includes(error.status)){document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:error}));return;}
    notice(error instanceof Error?error.message:'No se pudo completar la operación.',true,true);
    retry.hidden=false;
  };
  const evidence=(a:Assessment)=>a.source_refs.length?a.source_refs.map(ref=>{
    const source=view?.evaluation?.sources.find(s=>s.ref===ref);
    return '<li><span class="font-medium">'+esc(fields[ref.split(':')[0]!]??'Perfil')+':</span> '+esc(source?.text)+'</li>';
  }).join(''):'<li>No hay evidencia suficiente para este requisito.</li>';
  function render(){
    if(!view)return;
    const v=view,e=v.evaluation;
    root!.querySelector<HTMLAnchorElement>('[data-evaluation-back]')!.href='/reclutador/postulantes?job='+encodeURIComponent(v.job_id);
    root!.querySelector<HTMLAnchorElement>('[data-evaluation-cv]')!.href='/reclutador/cv?application='+encodeURIComponent(id);
    const summary='<section class="ui-panel space-y-4 p-5 sm:p-6" aria-labelledby="evaluation-summary"><h2 id="evaluation-summary" class="break-words text-xl font-semibold">'+esc(v.job_title)+'</h2>'+(v.candidate_name?'<p class="font-medium">Postulante: '+esc(v.candidate_name)+'</p>':'')+
      '<p>'+(v.profile_max===60?'Con examen: perfil hasta 60 puntos y examen hasta 40.':'Sin examen publicado: perfil sobre 100 puntos.')+' Las modalidades no son directamente equivalentes.</p>'+
      '<dl class="grid gap-4 sm:grid-cols-3"><div><dt class="text-slate-600 dark:text-slate-300">Perfil revisado</dt><dd class="mt-1 text-lg font-semibold tabular-nums">'+number(v.profile_points)+' / '+v.profile_max+'</dd></div>'+
      '<div><dt class="text-slate-600 dark:text-slate-300">Examen</dt><dd class="mt-1 text-lg font-semibold tabular-nums">'+(v.exam_count?(v.exam_points===null?'Pendiente':number(v.exam_points)+' / 40'):'No corresponde')+'</dd></div>'+
      '<div><dt class="text-slate-600 dark:text-slate-300">Total indicativo revisado</dt><dd data-evaluation-total class="mt-1 text-lg font-semibold tabular-nums">'+(v.total===null?'Pendiente de revisión':number(v.total)+' / 100')+'</dd></div></dl>'+
      (v.pending.length?'<ul class="list-disc space-y-2 pl-5">'+v.pending.map(p=>'<li>'+esc(p)+'</li>').join(''):'<p>Revisión guardada. Este resultado orienta la evaluación; la decisión de selección sigue en tus manos.</p>')+
      '<p class="text-slate-600 dark:text-slate-300">Las preguntas filtro son información de apoyo: no suman puntos ni descartan postulantes. La rúbrica aún requiere validación para uso real.</p></section>';
    const grades='<section class="space-y-3" aria-labelledby="objective-title"><h2 id="objective-title" class="text-xl font-semibold">Calificación objetiva del examen</h2>'+
      (v.grades.length?'<ul class="divide-y divide-slate-200 dark:divide-slate-700">'+v.grades.map(g=>'<li class="py-3"><p class="font-medium">'+esc(g.title)+'</p><p>'+g.correct+' de '+g.total+' respuestas correctas · '+number(g.percent)+' % · '+g.unanswered+' sin respuesta válida.</p></li>').join('')+'</ul>':'<p>'+(v.exam_count?'Aún no hay intentos finalizados. Las respuestas guardadas se califican al finalizar el intento.':'Esta oferta no tiene un examen publicado.')+'</p>')+'</section>';
    if(!e){
      content.innerHTML=summary+grades+'<section class="ui-panel space-y-4 p-5 sm:p-6"><h2 class="text-xl font-semibold">Revisión por requisito</h2><p>'+
        (!v.confirmed?'Espera a que el postulante confirme su perfil. Puedes consultar el expediente.':!v.requirement_count?'Define los requisitos de la oferta antes de evaluar.':'Prepara el desglose con pesos iguales. Después puedes pedir sugerencias o revisar la evidencia manualmente.')+
        '</p><button type="button" class="ui-button--primary" data-prepare '+(!v.confirmed||!v.requirement_count?'disabled':'')+'>Preparar evaluación</button></section>';
      content.querySelector('[data-prepare]')?.addEventListener('click',()=>void mutate(()=>evaluationApi.prepare(id),'Evaluación preparada. Revisa cada requisito.'));
      return;
    }
    content.innerHTML=summary+grades+
      '<form data-evaluation-form class="space-y-6"><fieldset data-evaluation-fields class="min-w-0 space-y-6" '+(v.stale?'disabled':'')+'>'+
      '<div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="text-xl font-semibold">Revisión por requisito</h2><p class="mt-2 max-w-prose">Cumple aporta el 100 % del peso; cumple parcialmente, el 50 %; no cumple, el 0 %. Sin evidencia suficiente mantiene el total pendiente, incluso con peso cero.</p></div>'+
      '<button data-assist type="button" class="ui-button--secondary">Solicitar sugerencias de Ollama</button></div>'+
      '<p>Perfil confirmado · versión '+esc(e.profile_version_id)+'. Pesos de esta evaluación: deben sumar '+e.profile_max+' puntos.</p>'+
      e.criteria.map((c,i)=>'<fieldset data-criterion="'+i+'" class="min-w-0 space-y-4 border-t border-slate-200 py-5 dark:border-slate-700"><legend class="max-w-full break-words pt-4 text-lg font-semibold">'+esc(c.text)+'</legend>'+
        '<div class="grid gap-6 lg:grid-cols-2"><section aria-label="Sugerencia para '+esc(c.text)+'" class="min-w-0 space-y-3"><h3 class="font-semibold">Sugerencia de Ollama</h3>'+
        (c.suggestion?'<p>'+esc(labels[c.suggestion.rating])+' · pendiente de tu revisión</p><ul class="list-disc space-y-2 break-words pl-5">'+evidence(c.suggestion)+'</ul><p class="max-w-prose break-words">'+esc(c.suggestion.explanation)+'</p><button type="button" data-use="'+i+'" class="ui-button--secondary">Usar como borrador de revisión</button>':
        '<p class="text-slate-600 dark:text-slate-300">Todavía no se ha solicitado una sugerencia. Puedes revisar el perfil manualmente.</p>')+'</section>'+
        '<div class="min-w-0 space-y-4"><div class="grid gap-4 sm:grid-cols-[1fr_9rem]"><label class="block"><span class="mb-2 block font-medium">Tu valoración</span><select data-rating class="q-input w-full"><option value="">Sin revisar</option>'+
        Object.entries(labels).map(([key,label])=>'<option value="'+key+'" '+(c.review?.rating===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
        '<label class="block"><span class="mb-2 block font-medium">Peso en puntos</span><input data-weight class="q-input w-full" type="number" min="0" max="'+e.profile_max+'" step="0.01" required value="'+c.weight+'"></label></div>'+
        '<details '+(c.review?'open':'')+'><summary class="flex min-h-11 cursor-pointer items-center font-medium text-sky-800 dark:text-sky-200">Elegir evidencia del perfil confirmado</summary><div class="mt-2 space-y-2">'+
        (e.sources.length?e.sources.map(s=>'<label class="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"><input type="checkbox" data-source value="'+esc(s.ref)+'" '+(c.review?.source_refs.includes(s.ref)?'checked':'')+' class="mt-1 h-5 w-5 shrink-0 rounded border-slate-400 text-sky-700 focus:ring-sky-600"><span class="min-w-0 break-words"><span class="font-medium">'+esc(fields[s.ref.split(':')[0]!]??'Perfil')+':</span> '+esc(s.text)+'</span></label>').join(''):'<p>No hay información profesional confirmada. Mantén la valoración sin evidencia suficiente.</p>')+'</div></details>'+
        '<label class="block"><span class="mb-2 block font-medium">Explicación de tu valoración</span><textarea data-explanation rows="3" maxlength="2000" class="q-input w-full placeholder:text-slate-600 dark:placeholder:text-slate-300" placeholder="Explica cómo se relaciona la evidencia con el requisito.">'+esc(c.review?.explanation??'')+'</textarea></label></div></div></fieldset>').join('')+
      '<div class="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700"><p data-weight-total class="font-medium"></p>'+
      '<label class="flex min-h-11 cursor-pointer items-start gap-3"><input data-human-confirm type="checkbox" required class="mt-1 h-5 w-5 shrink-0 rounded text-sky-700 focus:ring-sky-600"><span>He contrastado las valoraciones con la evidencia. Guardar esta revisión no selecciona ni descarta al postulante.</span></label>'+
      '<p data-unsaved class="text-slate-600 dark:text-slate-300">Los puntos mostrados corresponden a la última revisión guardada.</p>'+
      '<button type="submit" class="ui-button--primary">Guardar revisión</button></div></fieldset></form>';
    const form=content.querySelector<HTMLFormElement>('[data-evaluation-form]')!;
    const update=()=>{
      const sum=Array.from(form.querySelectorAll<HTMLInputElement>('[data-weight]')).reduce((n,input)=>n+Number(input.value),0);
      form.querySelector('[data-weight-total]')!.textContent='Suma de pesos: '+number(sum)+' / '+e.profile_max+' puntos.';
    };
    update();
    form.addEventListener('input',()=>{dirty=true;update();form.querySelector('[data-unsaved]')!.textContent='Tienes cambios sin guardar. El total se actualizar? al guardar la revisión.';});
    form.querySelector('[data-assist]')!.addEventListener('click',()=>{
      if(dirty){notice('Guarda tu revisión antes de solicitar nuevas sugerencias para conservar tus cambios.',true);return;}
      void mutate(()=>evaluationApi.assist(id,e.revision),'Sugerencias recibidas. Contrasta la evidencia antes de guardar tu valoración.');
    });
    form.querySelectorAll<HTMLButtonElement>('[data-use]').forEach(button=>button.addEventListener('click',()=>{
      const i=Number(button.dataset.use),suggestion=e.criteria[i]!.suggestion!;
      const row=form.querySelector<HTMLElement>('[data-criterion="'+i+'"]')!;
      row.querySelector<HTMLSelectElement>('[data-rating]')!.value=suggestion.rating;
      row.querySelector<HTMLTextAreaElement>('[data-explanation]')!.value=suggestion.explanation;
      row.querySelectorAll<HTMLInputElement>('[data-source]').forEach(input=>input.checked=suggestion.source_refs.includes(input.value));
      row.querySelector('details')!.open=true;
      form.querySelector<HTMLInputElement>('[data-human-confirm]')!.checked=false;
      row.dispatchEvent(new Event('input',{bubbles:true}));
      row.querySelector<HTMLSelectElement>('[data-rating]')!.focus();
    }));
    form.addEventListener('submit',event=>{
      event.preventDefault();if(busy)return;
      const criteria=e.criteria.map((c,i)=>{
        const row=form.querySelector<HTMLElement>('[data-criterion="'+i+'"]')!;
        const rating=row.querySelector<HTMLSelectElement>('[data-rating]')!.value as Rating|'';
        return {id:c.id,weight:Number(row.querySelector<HTMLInputElement>('[data-weight]')!.value),
          review:rating?{rating,source_refs:Array.from(row.querySelectorAll<HTMLInputElement>('[data-source]:checked')).map(input=>input.value),
            explanation:row.querySelector<HTMLTextAreaElement>('[data-explanation]')!.value}:null};
      });
      const input:ReviewInput={revision:e.revision,criteria};
      void mutate(()=>evaluationApi.review(id,input),'Revisión guardada. La decisión de selección permanece en tus manos.');
    });
  }
  async function mutate(work:()=>Promise<EvaluationView>,success:string){
    if(busy||!active)return;busy=true;const run=epoch;
    const buttons=Array.from(content.querySelectorAll<HTMLButtonElement>('button'));
    const fieldset=content.querySelector<HTMLFieldSetElement>('[data-evaluation-fields]');
    const previous=buttons.map(button=>button.disabled);
    buttons.forEach(button=>button.disabled=true);if(fieldset)fieldset.disabled=true;
    notice('Procesando la solicitud… La comparación local puede tardar hasta dos minutos.');
    const timer=setTimeout(()=>{buttons.forEach(b=>{b.classList.add('ui-button-loading');b.setAttribute('aria-busy','true');});},220);
    try{
      const result=await work();if(run!==epoch||!active)return;
      view=result;dirty=false;retry.hidden=true;render();notice(success,false,true);
    }catch(error){if(run===epoch&&active)fail(error);}
    finally{
      clearTimeout(timer);
      if(run===epoch){busy=false;buttons.forEach((button,i)=>{button.disabled=previous[i]!;button.classList.remove('ui-button-loading');button.removeAttribute('aria-busy');});if(fieldset)fieldset.disabled=!!view?.stale;}
    }
  }
  async function load(){
    if(!active||busy)return;if(dirty&&!confirm('Tienes cambios sin guardar. ¿Volver a cargar y descartarlos?'))return;
    const run=++epoch;dirty=false;loading.hidden=false;content.replaceChildren();message.hidden=true;retry.hidden=true;
    try{
      if(!/^[1-9][0-9]*$/.test(id))throw new Error('Abre la evaluación desde la lista de postulantes de una oferta.');
      const result=await evaluationApi.read(id);if(run!==epoch||!active)return;
      view=result;render();
    }catch(error){if(run===epoch&&active)fail(error);}
    finally{if(run===epoch)loading.hidden=true;}
  }
  document.addEventListener('qori:session',()=>{if(!active){active=true;void load();}});
  document.addEventListener('qori:session-cleared',()=>{epoch++;active=false;busy=false;dirty=false;view=undefined;content.replaceChildren();message.hidden=true;loading.hidden=true;retry.hidden=true;});
  document.addEventListener('qori:before-logout',event=>{
    if(dirty||busy)(event as CustomEvent<{allowed:Promise<boolean>}>).detail.allowed=Promise.resolve(confirm('Hay cambios sin guardar o una operación en curso. ¿Cerrar sesión?'));
  });
  window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();}});
  retry.addEventListener('click',()=>void load());
}
