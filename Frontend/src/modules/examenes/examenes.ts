import { exams, type Available } from './examenes.service';
import { mountEditor } from './editor';
import { mountAttempt } from './intento';
import { escape as e, icon, failure } from './ui';
import type { Session } from '../auth/auth.service';
export function initExams() {
  const root=document.querySelector<HTMLElement>('[data-exams]');if(!root)return;
  const host=root.querySelector<HTMLElement>('[data-ex-content]')!,notice=root.querySelector<HTMLElement>('[data-ex-notice]')!,loading=root.querySelector<HTMLElement>('[data-ex-loading]')!,retry=root.querySelector<HTMLButtonElement>('[data-ex-retry]')!;
  let epoch=0,dispose=()=>{},session:Session|undefined;
  async function load() {
    const run=++epoch;dispose();host.replaceChildren();loading.hidden=false;retry.hidden=true;notice.hidden=true;
    const alive=()=>run===epoch && !!session;
    try {
      let cleanup=()=>{};
      if(root!.dataset.exView==='editor')cleanup=await mountEditor(root!,alive);
      else if(root!.dataset.exView==='attempt')cleanup=await mountAttempt(root!,session!.user.id,alive);
      else {
        const owned=root!.dataset.exRole==='RECRUITER',job=new URLSearchParams(location.search).get('job');
        const data=owned?await exams.owned(job??undefined):await exams.available();
        if(!alive())return;
        const labels:Record<string,string>={DRAFT:'Borrador',PUBLISHED:'Publicada',AVAILABLE:'Por realizar',IN_PROGRESS:'En curso',SUBMITTED:'Enviada',EXPIRED:'Tiempo finalizado'};
        const rows=data.items.map(item=>{
          const candidate=item as Available;
          const state='status' in item?item.status:'AVAILABLE';
          const href=owned?'/reclutador/examen?id='+encodeURIComponent(item.id):'/postulante/examen?'+(candidate.attempt_id?'attempt='+encodeURIComponent(candidate.attempt_id):'exam='+encodeURIComponent(item.id)+'&application='+encodeURIComponent(candidate.application_id));
          return `<li class="ex-row"><div class="min-w-0"><div class="mb-2 flex flex-wrap items-center gap-3"><h2 class="text-xl font-semibold"><a class="hover:text-sky-700 hover:underline dark:hover:text-sky-300" href="${href}">${e(item.title)}</a></h2><span class="ex-state" data-state="${state}">${labels[state]}</span></div><p class="ex-muted">${e(item.job_title)}</p><p class="ex-muted mt-3 flex flex-wrap items-center gap-2 text-sm">${icon('clock')}${item.time_limit_seconds/60} minutos${!owned?' · '+candidate.question_count+' preguntas · Postulación #'+e(candidate.application_id):''}</p></div><a class="q-secondary ex-button shrink-0 self-start sm:self-center" href="${href}">${owned?(state==='DRAFT'?'Continuar edición':'Ver prueba'):state==='AVAILABLE'?'Ver instrucciones':state==='IN_PROGRESS'?'Continuar prueba':'Ver constancia'}${icon('arrow')}</a></li>`;
        }).join('');
        host.innerHTML=`<section class="ex-panel p-5 sm:px-8 sm:py-6"><div class="ex-toolbar border-b border-slate-200 pb-5 dark:border-slate-700"><div><h2 class="text-xl font-semibold">${job&&owned?'Evaluaciones de esta oferta':owned?'Tus evaluaciones':'Tus evaluaciones asignadas'}</h2><p class="ex-muted mt-1">${data.items.length} ${data.items.length===1?'prueba':'pruebas'}${owned?' · Los borradores son privados.':''}</p></div>${owned?'<a class="q-primary ex-button" href="/reclutador/examen'+(job?'?job='+e(job):'')+'">'+icon('plus')+'Crear prueba</a>':''}</div>${rows?'<ul>'+rows+'</ul>':'<div class="py-14"><h3 class="text-2xl font-semibold">'+(owned?'Una prueba para descubrir habilidades':'Todavía no tienes pruebas asignadas')+'</h3><p class="ex-muted mt-3 max-w-xl">'+(owned?'Elige una vacante, redacta las preguntas y revisa la experiencia antes de publicar.':'Cuando un reclutador publique una evaluación para una de tus postulaciones, aparecerá aquí.')+'</p><a class="q-link ex-button mt-5" href="'+(owned?'/reclutador/ofertas':'/postulante/postulaciones')+'">'+(owned?'Ver mis ofertas':'Ver mis postulaciones')+icon('arrow')+'</a></div>'}</section>`;
      }
      if(alive())dispose=cleanup;else cleanup();
    }catch(error){if(alive()){failure(error,notice);retry.hidden=false;}}
    finally{if(alive())loading.hidden=true;}
  }
  document.addEventListener('qori:session',event=>{session=(event as CustomEvent<Session>).detail;void load();});
  document.addEventListener('qori:session-cleared',event=>{if(!(event as CustomEvent).detail?.preserveLocal && session){try{for(const key of Object.keys(sessionStorage)){if(key.startsWith('qori:exam:'+session.user.id+':'))sessionStorage.removeItem(key);}}catch{}}epoch++;dispose();session=undefined;host.replaceChildren();notice.hidden=true;retry.hidden=true;root.querySelector<HTMLDialogElement>('dialog')?.close();});
  retry.addEventListener('click',()=>void load());
}
