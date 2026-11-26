import { seguimiento,trackingLabels,type TrackingApplication,type TrackingDetail } from './seguimiento.service';
import { ApiError } from '../compartido/services/api';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',classes='')=>{const e=document.createElement(tag);e.textContent=text;e.className=classes;return e;};
const date=(s:string|null,withTime=false)=>s&&!Number.isNaN(Date.parse(s))?new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',...(withTime?{timeStyle:'short' as const}:{}),timeZone:'America/Lima'}).format(new Date(s)):'Fecha no registrada';
const label=(s:TrackingApplication['status'])=>s?trackingLabels[s]:'Estado no disponible';
const badge=(s:TrackingApplication['status'])=>{const e=node('span',label(s),'tracking-badge');e.dataset.status=s??'';return e;};
const anchor=(text:string,href:string)=>{const a=node('a',text,'q-link');a.href=href;return a;};
export function initSeguimiento(){
 const root=document.querySelector<HTMLElement>('[data-tracking-root]');if(!root)return;
 const el=<T extends HTMLElement=HTMLElement>(name:string)=>root.querySelector<T>('[data-'+name+']')!;
 const search=el<HTMLInputElement>('tracking-search'),filter=el<HTMLSelectElement>('tracking-filter');
 let active=false,listEpoch=0,detailEpoch=0,page=1,selected='',listCache='',detailCache='',debounce=0,refreshing=false;
 const unauthorized=(error:unknown)=>{if(error instanceof ApiError&&[401,403].includes(error.status)){document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:error}));return true;}return false;};
 const message=(e:unknown)=>e instanceof Error?e.message:'No se pudo conectar. Intenta de nuevo.';
 const sync=(at:string)=>{el('tracking-sync').textContent='Última consulta: '+date(at,true);};
 const restore=(key:string|undefined)=>{if(key){const target=[...root.querySelectorAll<HTMLElement>('[data-focus]')].find(e=>e.dataset.focus===key);(target??search).focus({preventScroll:true});}};
 const close=()=>{detailEpoch++;selected='';detailCache='';el('tracking-detail-content').replaceChildren();el('tracking-detail').hidden=true;el('tracking-grid').classList.remove('has-detail');for(const row of el('app-list').children)(row as HTMLElement).dataset.selected='false';const url=new URL(location.href);url.searchParams.delete('application');history.replaceState(null,'',url);};
 const section=(title:string)=>{const s=node('section','','tracking-section space-y-3');s.append(node('h3',title,'font-semibold'));return s;};
 const notice=(title:string,text:string)=>{const a=node('div','','ui-alert text-sm');a.dataset.tone='info';a.append(node('strong',title),node('p',text));return a;};
 function renderDetail(data:TrackingDetail){
  const value=JSON.stringify({application:data.application,history:data.history,history_complete:data.history_complete});if(value===detailCache)return;detailCache=value;
  const focus=(document.activeElement as HTMLElement)?.dataset.focus;
  const container=el('tracking-detail-content'),a=data.application;container.replaceChildren();
  const header=node('div','','space-y-3');header.append(node('h3',a.title,'text-xl font-semibold break-words'),node('p','Postulación '+a.id+' · Recibida el '+date(a.registered_at),'tracking-muted'),badge(a.status));container.append(header);
  const steps=section('Avance del proceso'),ol=node('ol','','tracking-progress');
  const phases=[{key:'PENDING',text:'Recibida'},{key:'IN_REVIEW',text:'En revisión'},{key:'SHORTLISTED',text:'Preselección'},{key:'RESULT',text:'Resultado'}];
  phases.forEach((phase,i)=>{
   const matching=data.history.filter(h=>phase.key==='RESULT'?['ADVANCES','NOT_ADVANCES'].includes(h.status):h.status===phase.key);
   const recorded=phase.key==='PENDING'||matching.length>0,current=phase.key==='RESULT'?a.final:a.status===phase.key;
   const li=node('li');li.dataset.visited=String(recorded);if(current)li.setAttribute('aria-current','step');
   const marker=node('span',String(i+1),'tracking-step');marker.setAttribute('aria-hidden','true');
   const title=node('p',phase.text,'mt-2 font-medium sm:mt-3'),hint=node('p',current?'Etapa actual':recorded?'Registrada':'Sin paso registrado','tracking-muted mt-1');li.append(marker,title,hint);ol.append(li);
  });
  steps.append(ol);container.append(steps);
  if(!data.history_complete)container.append(notice('Historial parcial','Se muestra el estado actual confirmado por el servidor. Algunos cambios anteriores no tienen un registro completo.'));
  if(a.process_finished_at)container.append(notice('Proceso finalizado','La oferta finalizó el '+date(a.process_finished_at,true)+'. '+(a.final?'Tu resultado individual se muestra arriba.':'No hay una decisión individual final registrada.')));
  else if(a.job_status==='CLOSED')container.append(notice('Recepción de postulaciones cerrada','La oferta ya no recibe postulaciones. Esto no modifica tu estado de selección.'));
  if(a.final)container.append(notice('Decisión registrada',label(a.status)+'. '+(a.status_at?'Registrada el '+date(a.status_at,true)+'.':'La fecha de este resultado no está registrada.')));
  const historySection=section('Historial de mi postulación'),historyList=node('ol','','tracking-history space-y-4');
  const received=node('li');received.append(node('p','Postulación recibida','font-medium'),node('p',date(a.registered_at,true),'tracking-muted'));historyList.append(received);
  for(const event of data.history){if(event.status==='PENDING')continue;const li=node('li');li.append(node('p',trackingLabels[event.status],'font-medium'),node('p',date(event.at,true),'tracking-muted'));historyList.append(li);}
  historySection.append(historyList);
  if(!data.history.length&&!a.final)historySection.append(node('p','Todavía no hay cambios de selección registrados.','tracking-muted'));container.append(historySection);
  const documents=section('Mi postulación');documents.append(node('p',a.filename?'CV enviado: '+a.filename:'No hay un nombre de archivo disponible para el CV.','tracking-muted break-words'));
  const actions=node('div','','flex flex-wrap gap-x-5 gap-y-2');
  for(const [key,text,href] of [['cv','Revisar datos del CV','/postulante/cv?application='+a.id],['job','Ver oferta','/postulante/oferta?id='+a.job_id],['exams','Ver mis pruebas','/postulante/examenes']]){
   const link=anchor(text!,href!);link.dataset.focus='detail-'+key;actions.append(link);
  }
  if(a.can_replace_cv){const link=anchor('Reemplazar CV','/postulante/postular?application='+a.id);link.dataset.focus='detail-replace';actions.append(link);}
  documents.append(actions);container.append(documents);restore(focus);
 }
 async function loadDetail(id:string,preserve=false){
  selected=id;const run=++detailEpoch;el('tracking-detail').hidden=false;el('tracking-grid').classList.add('has-detail');
  el('tracking-detail-error').hidden=true;
  if(!preserve){detailCache='';el('tracking-detail-content').replaceChildren();el('tracking-detail-loading').hidden=false;document.getElementById('tracking-detail-title')!.focus();}
  for(const row of el('app-list').children)(row as HTMLElement).dataset.selected=String((row as HTMLElement).dataset.id===id);
  try{const data=await seguimiento.detail(id);if(!active||run!==detailEpoch)return;renderDetail(data);sync(data.checked_at);}
  catch(e){if(!active||run!==detailEpoch||unauthorized(e))return;el('tracking-detail-error-copy').textContent=message(e)+(preserve?' La información visible corresponde a la última consulta correcta.':'');el('tracking-detail-error').hidden=false;}
  finally{if(run===detailEpoch)el('tracking-detail-loading').hidden=true;}
 }
 const open=(id:string)=>{const url=new URL(location.href);url.searchParams.set('application',id);history.replaceState(null,'',url);void loadDetail(id);};
 function renderRow(a:TrackingApplication){
  const article=node('article','','tracking-row');article.dataset.id=a.id;article.dataset.selected=String(selected===a.id);
  const heading=node('div','','flex flex-col items-start gap-3 sm:flex-row sm:justify-between'),copy=node('div','','min-w-0 flex-1');
  copy.append(node('h2',a.title,'text-lg font-semibold break-words'),node('p','Postulación '+a.id+' · '+date(a.registered_at),'tracking-muted mt-1'));heading.append(copy,badge(a.status));article.append(heading);
  const bottom=node('div','','mt-4 flex flex-wrap items-center justify-between gap-3'),text=a.process_finished_at?'Proceso finalizado':a.status_at?'Último estado: '+date(a.status_at):'Fecha del estado no registrada';
  bottom.append(node('p',text,'tracking-muted'));const button=node('button','Ver seguimiento','ui-button--secondary');button.type='button';button.dataset.open=a.id;button.dataset.focus='open-'+a.id;button.setAttribute('aria-label','Ver seguimiento de '+a.title);button.addEventListener('click',()=>open(a.id));bottom.append(button);article.append(bottom);
  article.addEventListener('click',event=>{if(!(event.target as HTMLElement).closest('button,a'))open(a.id);});return article;
 }
 async function loadList(preserve=false){
  const run=++listEpoch;el('app-notice').hidden=true;
  if(!preserve){el('app-loading').hidden=false;el('app-empty').hidden=true;el('tracking-footer').hidden=true;el('app-list').replaceChildren();listCache='';}
  try{
   const result=await seguimiento.list(new URLSearchParams({search:search.value.trim(),status:filter.value,page:String(page)}));
   if(!active||run!==listEpoch)return;
   if(!result.items.length&&page>1&&result.total>0){page=Math.max(1,Math.ceil(result.total/result.page_size));void loadList(preserve);return;}
   const cache=JSON.stringify({items:result.items,total:result.total,page:result.page});
   if(cache!==listCache){const focused=(document.activeElement as HTMLElement)?.dataset.focus;el('app-list').replaceChildren(...result.items.map(renderRow));if(preserve&&listCache)el('tracking-live').textContent='Se actualizó el seguimiento de tus postulaciones.';listCache=cache;restore(focused);}
   const filtered=!!search.value.trim()||!!filter.value;
   el('app-empty').hidden=!!result.items.length;el('tracking-empty-title').textContent=filtered?'No hay coincidencias':'Tu primera postulación te espera';
   el('tracking-empty-copy').textContent=filtered?'Prueba otro nombre o consulta todos los estados.':'Encuentra una oferta y consulta aquí su avance.';
   el('tracking-empty-link').hidden=filtered;el('tracking-clear').hidden=!filtered;el('tracking-footer').hidden=!result.items.length;
   el('tracking-count').textContent=`${(page-1)*result.page_size+1}–${Math.min(page*result.page_size,result.total)} de ${result.total} · Página ${page}`;
   el('tracking-prev').hidden=page===1;el('tracking-next').hidden=page*result.page_size>=result.total;sync(result.checked_at);
  }catch(e){if(!active||run!==listEpoch||unauthorized(e))return;el('tracking-error-copy').textContent=message(e)+(preserve?' La información visible puede estar desactualizada.':'');el('app-notice').hidden=false;}
  finally{if(run===listEpoch)el('app-loading').hidden=true;}
 }
 async function refresh(){
  if(!active||refreshing)return;refreshing=true;const button=el<HTMLButtonElement>('tracking-refresh');button.disabled=true;button.setAttribute('aria-busy','true');
  try{await Promise.all([loadList(true),...(selected?[loadDetail(selected,true)]:[])]);}
  finally{refreshing=false;button.disabled=false;button.removeAttribute('aria-busy');}
 }
 const filters=()=>{page=1;close();void loadList();};
 el('tracking-filters').addEventListener('submit',e=>e.preventDefault());
 search.addEventListener('input',()=>{clearTimeout(debounce);listEpoch++;debounce=window.setTimeout(filters,300);});
 filter.addEventListener('change',filters);
 el('tracking-clear').addEventListener('click',()=>{search.value='';filter.value='';filters();search.focus();});
 el('tracking-refresh').addEventListener('click',()=>void refresh());
 el('app-retry').addEventListener('click',()=>void refresh());
 el('tracking-detail-retry').addEventListener('click',()=>{if(selected)void loadDetail(selected,true);});
 el('tracking-close').addEventListener('click',()=>{const id=selected;close();const target=[...root.querySelectorAll<HTMLElement>('[data-open]')].find(e=>e.dataset.open===id);(target??search).focus();});
 el('tracking-prev').addEventListener('click',()=>{if(page>1){page--;close();void loadList();}});
 el('tracking-next').addEventListener('click',()=>{page++;close();void loadList();});
 const interval=window.setInterval(()=>{if(active&&document.visibilityState==='visible'&&navigator.onLine)void refresh();},30000);
 const resume=()=>{if(document.visibilityState==='visible'&&navigator.onLine)void refresh();};
 document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
 window.addEventListener('offline',()=>{if(active){el('tracking-error-copy').textContent='Sin conexión. Conservamos la última información consultada y volveremos a actualizar al recuperar la conexión.';el('app-notice').hidden=false;}});
 document.addEventListener('qori:session',()=>{if(active)return;active=true;const id=new URLSearchParams(location.search).get('application');void loadList();if(id)void loadDetail(id);});
 document.addEventListener('qori:session-cleared',()=>{active=false;listEpoch++;detailEpoch++;clearTimeout(debounce);close();listCache='';el('app-list').replaceChildren();el('app-empty').hidden=true;el('app-notice').hidden=true;el('tracking-footer').hidden=true;for(const name of ['tracking-sync','tracking-live','tracking-error-copy','tracking-detail-error-copy','tracking-count'])el(name).textContent='';});
 window.addEventListener('pagehide',()=>{clearInterval(interval);clearTimeout(debounce);});
}
