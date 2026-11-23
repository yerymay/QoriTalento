import {initApplicationWizard} from './wizard';
import {postulaciones} from './postulaciones.service';
import {ApiError} from '../compartido/services/api';
import {initMenus} from '../compartido/components/ui/menu';
import type {Session} from '../auth/auth.service';

const labels:Record<string,string>={PENDING:'Pendiente de evaluación',IN_REVIEW:'En revisión',SHORTLISTED:'Preseleccionado',ADVANCES:'Avanza',NOT_ADVANCES:'No avanza'};
export function initPostulaciones(){
  const root=document.querySelector<HTMLElement>('[data-applications]');if(!root)return;
  if(root.dataset.view==='form'){initApplicationWizard(root);return;}
  const get=<T extends HTMLElement=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const loading=get('[data-app-loading]'),notice=get('[data-app-notice]'),recovery=get('[data-app-recovery]'),list=get('[data-app-list]');
  let session:Session|undefined,epoch=0,disposeMenus=()=>{};
  const date=(value:string|null)=>value&&!Number.isNaN(Date.parse(value))?new Intl.DateTimeFormat('es-PE',{dateStyle:'medium'}).format(new Date(value)):'Fecha no disponible';
  const load=async()=>{
    const run=++epoch;loading.hidden=false;notice.hidden=true;recovery.hidden=true;disposeMenus();list.replaceChildren();get('[data-app-empty]').hidden=true;
    try{
      const result=await postulaciones.list();if(run!==epoch||!session)return;
      get('[data-app-empty]').hidden=!!result.items.length;
      for(const item of result.items){
        const fragment=get<HTMLTemplateElement>('[data-card]').content.cloneNode(true) as DocumentFragment;
        const find=<T extends HTMLElement=HTMLElement>(selector:string)=>fragment.querySelector<T>(selector)!;
        find('[data-card-title]').textContent=item.title;
        find('[data-card-meta]').textContent='Postulación '+item.id+' · '+date(item.created_at);
        find('[data-card-status]').textContent=item.status?labels[item.status]??'Estado no disponible':'Estado pendiente';
        find('[data-card-file]').textContent=item.filename?'CV: '+item.filename:'CV no disponible';
        find<HTMLAnchorElement>('[data-card-cv]').href='/postulante/cv?application='+encodeURIComponent(item.id);
        find<HTMLAnchorElement>('[data-card-cv]').setAttribute('aria-label','Revisar datos del CV de '+item.title);
        const replace=find<HTMLAnchorElement>('[data-card-replace]');replace.hidden=item.status!=='PENDING';replace.href='/postulante/postular?application='+encodeURIComponent(item.id);
        find<HTMLAnchorElement>('[data-card-job]').href='/postulante/oferta?id='+encodeURIComponent(item.job_id);
        find('[data-tracking-date]').textContent='Registrada el '+date(item.submitted_at||item.created_at);
        find('[data-tracking-status]').textContent=item.status?labels[item.status]??'Estado no disponible':'Estado no disponible';
        const tracking=find('[data-tracking]');
        find('[data-card-tracking]').addEventListener('click',()=>{tracking.focus();tracking.scrollIntoView({block:'center',behavior:'instant'});});
        const menu=find('[data-card-menu]');menu.id='application-menu-'+item.id;
        find('[data-ui-menu-trigger]').setAttribute('aria-controls',menu.id);
        find('[data-ui-menu-trigger]').setAttribute('aria-label','Opciones de '+item.title);
        list.append(fragment);
      }
      disposeMenus=initMenus(root);
    }catch(error){
      if(run!==epoch||!session)return;
      if(error instanceof ApiError&&(error.status===401||error.status===403)){document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:error}));return;}
      notice.textContent=error instanceof Error?error.message:'No se pudieron cargar las postulaciones.';notice.dataset.tone='error';notice.setAttribute('role','alert');notice.hidden=false;recovery.hidden=false;
    }finally{if(run===epoch)loading.hidden=true;}
  };
  get('[data-app-retry]').addEventListener('click',()=>void load());
  document.addEventListener('qori:session',event=>{session=(event as CustomEvent<Session>).detail;void load();});
  document.addEventListener('qori:session-cleared',()=>{epoch++;session=undefined;disposeMenus();list.replaceChildren();notice.hidden=true;recovery.hidden=true;get('[data-app-empty]').hidden=true;});
  window.addEventListener('pagehide',()=>disposeMenus());
}
