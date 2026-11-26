import { selectionApi,labels,type Detail,type State,type ResultRow } from './seleccion.service';
import { ApiError } from '../compartido/services/api';
import { showToast } from '../compartido/services/toast';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
const number=(n:number)=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:2}).format(n);
const date=(s:string)=>new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'}).format(new Date(s));
const badge=(s:string|null)=>{const b=node('span',labels[s??'']??'Estado no disponible','selection-badge');b.dataset.state=s??'';return b;};
const link=(text:string,href:string)=>{const a=node('a',text,'q-link');a.href=href;return a;};
export function initSelection(){
  const root=document.querySelector<HTMLElement>('[data-selection]');if(!root)return;
  const el=<T extends HTMLElement=HTMLElement>(name:string)=>document.querySelector<T>('[data-'+name+']')!;
  const job=el<HTMLSelectElement>('job'),search=el<HTMLInputElement>('search'),state=el<HTMLSelectElement>('state');
  const dialog=el<HTMLDialogElement>('decision-dialog'),action=el<HTMLSelectElement>('decision-state'),reason=el<HTMLTextAreaElement>('decision-reason');
  let active=false,listRun=0,detailRun=0,page=1,total=0,sort='date',direction='desc',selected='',detail:Detail|null=null,saving=false,timer=0;
  const errorText=(e:unknown)=>e instanceof Error?e.message:'No se pudo completar la operación. Intenta de nuevo.';
  const unauthorized=(e:unknown)=>{if(e instanceof ApiError&&[401,403].includes(e.status)){document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:e}));return true;}return false;};
  const close=()=>{detailRun++;selected='';detail=null;el('detail-content').replaceChildren();el('detail').hidden=true;el('selection-grid').classList.remove('has-detail');for(const r of el('results-rows').children)r.removeAttribute('aria-selected');};
  const section=(title:string)=>{const s=node('section','','selection-section space-y-3');s.append(node('h3',title,'font-semibold'));return s;};
  const metric=(label:string,value:string,dl:HTMLElement)=>dl.append(node('dt',label,'text-slate-600 dark:text-slate-300'),node('dd',value,'font-semibold'));
  const fillDetail=(data:Detail)=>{
    detail=data;const container=el('detail-content');container.replaceChildren();const r=data.record,v=data.evaluation;
    const heading=node('div','','space-y-2');heading.append(node('h3',r.name,'text-xl font-semibold break-words'),node('p',r.email,'selection-muted break-all'),badge(r.status));container.append(heading);
    const results=section('Resultados');const dl=node('dl','','selection-definition');
    metric('Modalidad',v.exam_count?'Perfil + examen':'Solo perfil',dl);
    metric('Perfil',v.stale?'Revisión desactualizada':number(v.profile_points)+' / '+v.profile_max,dl);
    for(const g of v.grades)metric(g.title,number(g.percent)+' / 100',dl);
    if(v.exam_count&&!v.grades.length)metric('Examen','Pendiente',dl);
    metric('Total indicativo',v.total===null?'Pendiente':number(v.total)+' / 100',dl);results.append(dl);
    if(v.pending.length){const notice=node('div','','ui-alert text-sm');notice.dataset.tone='info';notice.append(node('strong','Revisión pendiente'));const ul=node('ul','','mt-2 list-disc space-y-1 pl-5');for(const p of v.pending)ul.append(node('li',p));notice.append(ul);results.append(notice);}
    results.append(link('Revisar evaluación y evidencia','/reclutador/evaluacion?application='+encodeURIComponent(r.id)));container.append(results);
    const profile=section('Perfil confirmado');
    if(!data.profile){profile.append(node('p','El postulante aún no ha confirmado su perfil.','selection-muted'));}
    else{
      if(data.profile.summary)profile.append(node('p',data.profile.summary,'whitespace-pre-wrap break-words'));
      for(const [key,title] of [['education','Formación'],['experience','Experiencia'],['skills','Habilidades'],['languages','Idiomas']] as const){
        profile.append(node('h4',title,'font-medium'));const ul=node('ul','','space-y-1 break-words');
        for(const text of data.profile[key].length?data.profile[key]:['No detectado'])ul.append(node('li',text,'selection-muted'));profile.append(ul);
      }
    }
    profile.append(link('Consultar CV original y notas','/reclutador/cv?application='+encodeURIComponent(r.id)));container.append(profile);
    const decision=section('Selección');
    if(r.decision){decision.append(badge(r.decision.state),node('p','Registrado por '+r.decision.actor_name+' · '+date(r.decision.at),'selection-muted'));if(r.decision.reason)decision.append(node('p',r.decision.reason,'whitespace-pre-wrap break-words'));}
    const button=node('button',data.allowed_actions.length?'Registrar decisión':'Decisión no disponible','ui-button--primary');button.type='button';button.dataset.openDecision='';button.disabled=!data.allowed_actions.length;button.addEventListener('click',openDecision);decision.append(button);
    if(!data.allowed_actions.length)decision.append(node('p',r.process_finished?'El proceso de esta oferta ya finalizó.':r.decision||['ADVANCES','NOT_ADVANCES'].includes(r.status??'')?'La decisión final está registrada y no admite reversión.':'Este estado no tiene acciones de selección habilitadas.','selection-muted'));
    container.insertBefore(decision,results);
    if(data.history.length){const history=section('Historial de selección'),ol=node('ol','','space-y-3');for(const h of data.history){const li=node('li');li.append(node('p',labels[h.next_state]??h.next_state,'font-medium'),node('p',(h.actor_name??'Sistema')+' · '+date(h.at),'selection-muted'));ol.append(li);}history.append(ol);container.append(history);}
  };
  async function openDetail(id:string,focus=true){
    selected=id;detail=null;const run=++detailRun;el('detail').hidden=false;el('selection-grid').classList.add('has-detail');el('detail-content').replaceChildren();el('detail-loading').hidden=false;el('detail-error').hidden=true;
    for(const r of el('results-rows').children)r.setAttribute('aria-selected',String((r as HTMLElement).dataset.id===id));
    if(focus){document.getElementById('selection-detail-title')!.focus();el('detail').scrollIntoView({block:'nearest'});}
    try{const data=await selectionApi.detail(id);if(!active||run!==detailRun)return;fillDetail(data);}
    catch(e){if(!active||run!==detailRun||unauthorized(e))return;el('detail-error-copy').textContent=errorText(e);el('detail-error').hidden=false;}
    finally{if(run===detailRun)el('detail-loading').hidden=true;}
  }
  function row(item:ResultRow){
    const tr=node('tr');tr.dataset.id=item.id;if(selected===item.id)tr.setAttribute('aria-selected','true');
    const person=node('td'),wrap=node('div','','selection-person'),avatar=node('span',item.name.trim().split(/\s+/u).slice(0,2).map(s=>Array.from(s)[0]).join(''),'selection-avatar');avatar.setAttribute('aria-hidden','true');
    const copy=node('div','','selection-person-copy');copy.append(node('p',item.name,'font-semibold'),node('p',item.email,'selection-muted'));wrap.append(avatar,copy);person.append(wrap);tr.append(person);
    const r=item.results;
    const values=[r?r.exam_count===0?'Sin examen':r.grades.length===1&&r.exam_count===1?number(r.grades[0]!.percent)+' / 100':r.grades.length?'Ver pruebas':'Pendiente':'No disponible',
      r?r.stale?'Desactualizado':r.reviewed&&r.profile_points!==null?number(r.profile_points)+' / '+r.profile_max:'Por revisar':'No disponible',
      r?.total===null||!r?'Pendiente':number(r.total)+' / 100'];
    values.forEach((value,i)=>{const td=node('td',value,'selection-metric');td.dataset.label=['Examen','Perfil','Total indicativo'][i]!;tr.append(td);});
    const status=node('td');status.append(badge(item.status));if(item.decision)status.append(node('p',date(item.decision.at),'selection-muted mt-1'));tr.append(status);
    const cell=node('td'),button=node('button','Ver ficha','ui-button--secondary whitespace-nowrap');button.type='button';button.setAttribute('aria-label','Ver ficha de '+item.name);button.addEventListener('click',()=>void openDetail(item.id));cell.append(button);tr.append(cell);
    tr.addEventListener('click',e=>{if(!(e.target as HTMLElement).closest('button,a'))void openDetail(item.id);});return tr;
  }
  async function load(){
    const run=++listRun;el('list-error').hidden=true;el('results-loading').hidden=false;el('results-table').hidden=true;el('results-empty').hidden=true;el('results-footer').hidden=true;el('results-rows').replaceChildren();
    if(!job.value){el('results-loading').hidden=true;el('results-empty').hidden=false;el('empty-title').textContent='Selecciona una oferta';el('empty-copy').textContent='Elige una de tus ofertas para consultar sus postulantes.';el('clear-filters').hidden=true;el('empty-jobs').hidden=false;return;}
    try{
      const result=await selectionApi.list(job.value,new URLSearchParams({search:search.value.trim(),status:state.value,page:String(page),sort,direction}));
      if(!active||run!==listRun)return;total=result.total;
      if(!result.items.length&&page>1&&total>0){page=Math.max(1,Math.ceil(total/result.page_size));void load();return;}
      el('results-rows').replaceChildren(...result.items.map(row));el('results-table').hidden=!result.items.length;el('results-empty').hidden=!!result.items.length;
      const filtered=!!search.value.trim()||!!state.value;
      el('empty-title').textContent=filtered?'No hay coincidencias':'Aún no hay postulantes';
      el('empty-copy').textContent=filtered?'Prueba otro nombre o amplía los estados de selección.':'Las postulaciones recibidas aparecerán aquí para su revisión.';
      el('clear-filters').hidden=!filtered;el('empty-jobs').hidden=filtered;
      el('results-footer').hidden=!result.items.length;el('result-count').textContent=`${(page-1)*result.page_size+1}–${Math.min(page*result.page_size,total)} de ${total} · Página ${page} de ${Math.max(1,Math.ceil(total/result.page_size))}`;
      el('prev').hidden=page<=1;el('next').hidden=page*result.page_size>=total;
    }catch(e){if(!active||run!==listRun||unauthorized(e))return;el('list-error-copy').textContent=errorText(e);el('list-error').hidden=false;}
    finally{if(run===listRun)el('results-loading').hidden=true;}
  }
  async function loadJobs(){
    const run=++listRun;el('list-error').hidden=true;
    try{const result=await selectionApi.jobs();if(!active||run!==listRun)return;const requested=new URLSearchParams(location.search).get('job');job.replaceChildren();
      for(const item of result.items){const option=node('option',item.title);option.value=item.id;job.append(option);}
      if(!result.items.length){const option=node('option','No tienes ofertas todavía');option.value='';job.append(option);}
      if(requested&&result.items.some(j=>j.id===requested))job.value=requested;
      await load();
    }catch(e){if(!active||run!==listRun||unauthorized(e))return;el('results-loading').hidden=true;el('list-error-copy').textContent=errorText(e);el('list-error').hidden=false;job.replaceChildren(new Option('No se pudieron cargar las ofertas',''));}
  }
  function warning(){const final=['ADVANCES','NOT_ADVANCES'].includes(action.value);el('reason-label').hidden=!final;el('decision-warning-copy').textContent=final?'Esta decisión es final. Se guardarán tu nombre y la fecha; no podrás revertirla desde este módulo.':'Se registrará el cambio y su fecha en el historial del postulante.';}
  function openDecision(){if(!detail?.allowed_actions.length||saving)return;action.replaceChildren();for(const s of detail.allowed_actions){const o=node('option',labels[s]!);o.value=s;action.append(o);}reason.value='';el('save-error').hidden=true;el('decision-person').textContent=detail.record.name+' · '+labels[detail.record.status??''];warning();dialog.showModal();}
  action.addEventListener('change',warning);
  el('decision-cancel').addEventListener('click',()=>{if(!saving)dialog.close();});
  dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
  el('decision-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!detail||saving||!active)return;const current=detail,run=detailRun;saving=true;
    const save=el<HTMLButtonElement>('decision-save');save.disabled=true;save.textContent='Guardando…';el<HTMLButtonElement>('decision-cancel').disabled=true;action.disabled=true;reason.disabled=true;el('save-error').hidden=true;
    try{
      await selectionApi.decide(current.record.id,action.value as State,current.record.status!,['ADVANCES','NOT_ADVANCES'].includes(action.value)?reason.value.trim():'');
      if(!active||run!==detailRun)return;dialog.close();showToast('El estado y su historial se guardaron.','success',{title:'Decisión registrada'});await Promise.all([load(),openDetail(current.record.id,false)]);
    }catch(err){
      if(!active||run!==detailRun||unauthorized(err))return;
      if(err instanceof ApiError&&err.status===409){dialog.close();await openDetail(current.record.id,false);el('detail-error-copy').textContent=errorText(err);el('detail-error').hidden=false;}
      else{el('save-error-copy').textContent=errorText(err)+' Conservamos tu decisión para que puedas reintentar.';el('save-error').hidden=false;el('save-error').focus();}
    }finally{saving=false;save.disabled=false;save.textContent='Confirmar y guardar';el<HTMLButtonElement>('decision-cancel').disabled=false;action.disabled=false;reason.disabled=false;}
  });
  el('filters').addEventListener('submit',e=>e.preventDefault());
  const filter=()=>{page=1;close();void load();};
  search.addEventListener('input',()=>{window.clearTimeout(timer);listRun++;timer=window.setTimeout(filter,300);});
  state.addEventListener('change',filter);job.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('job',job.value);history.replaceState(null,'',url);filter();});
  el('clear-filters').addEventListener('click',()=>{search.value='';state.value='';filter();});
  for(const b of root.querySelectorAll<HTMLButtonElement>('[data-sort]'))b.addEventListener('click',()=>{
    direction=sort===b.dataset.sort&&direction==='asc'?'desc':'asc';sort=b.dataset.sort!;for(const h of root.querySelectorAll('[aria-sort]'))h.setAttribute('aria-sort','none');b.closest('th')!.setAttribute('aria-sort',direction==='asc'?'ascending':'descending');filter();
  });
  el<HTMLSelectElement>('mobile-order').addEventListener('change',()=>{const order=el<HTMLSelectElement>('mobile-order').value.split(':');sort=order[0]!;direction=order[1]!;filter();});
  el('list-retry').addEventListener('click',()=>{if(job.value)void load();else void loadJobs();});
  el('detail-retry').addEventListener('click',()=>{if(selected)void openDetail(selected);});
  el('detail-close').addEventListener('click',()=>{const id=selected;close();const button=root.querySelector<HTMLButtonElement>('tr[data-id="'+id+'"] button');button?.focus();});
  el('prev').addEventListener('click',()=>{if(page>1){page--;close();void load();}});
  el('next').addEventListener('click',()=>{page++;close();void load();});
  document.addEventListener('qori:session',()=>{if(active)return;active=true;void loadJobs();});
  document.addEventListener('qori:session-cleared',()=>{active=false;listRun++;window.clearTimeout(timer);close();dialog.close();job.replaceChildren();el('results-rows').replaceChildren();el('decision-person').textContent='';reason.value='';for(const name of ['list-error-copy','detail-error-copy','save-error-copy','result-count'])el(name).textContent='';});
}
