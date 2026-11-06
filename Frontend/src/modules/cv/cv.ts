import { cv, fields, type CvProfile, type Review, type Note } from './cv.service';
import { ApiError } from '../compartido/services/api';
import type { Session } from '../auth/auth.service';

export function initCv() {
  const root=document.querySelector<HTMLElement>('[data-cv]'); if(!root)return;
  const el=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
  const recruiter=root.dataset.recruiter==='true', id=new URLSearchParams(location.search).get('application')??'';
  const form=el<HTMLFormElement>('[data-cv-form]');
  let session:Session|undefined, current:Review|undefined, epoch=0, dirty=false, busy=false, loading=false;
  const say=(message:string,error=false)=>{const box=el('[data-cv-message]');box.textContent=message;box.dataset.tone=error?'error':'success';box.hidden=false;box.focus();};
  const failure=(error:unknown)=>{if(error instanceof ApiError && [401,403].includes(error.status)){document.dispatchEvent(new CustomEvent('qori:auth-error',{detail:error}));return;}say(error instanceof Error?error.message:'No se pudo completar la operación.',true);};
  const input=(key:string)=>form.elements.namedItem(key) as HTMLInputElement|HTMLTextAreaElement;
  const profile=():CvProfile=>Object.fromEntries(fields.map(f=>[f.key,f.array?input(f.key).value.split(f.key==='education'||f.key==='experience'?/\n\s*\n/:/\n/).map(s=>s.trim()).filter(Boolean):input(f.key).value.trim()])) as unknown as CvProfile;
  const fill=(value:Review)=>{
    current=value; dirty=false;
    if(!value.document){el('[data-cv-empty]').hidden=false;el('[data-cv-content]').hidden=true;return;}
    const confirmedCurrent=value.confirmed?.source_cv_id===value.document.id;
    const data=recruiter?value.confirmed?.profile:confirmedCurrent?value.confirmed?.profile:value.extraction?.profile;
    el('[data-cv-title]').textContent=value.title;
    el('[data-cv-state]').textContent=confirmedCurrent?'Datos confirmados.':value.confirmed?'Hay un CV nuevo por confirmar. El perfil anterior se conserva.':'Datos pendientes de revisión y confirmación.';
    const docId=recruiter&&value.confirmed?value.confirmed.source_cv_id:value.document.id;
    const url=cv.documentUrl(recruiter,id,docId);
    el<HTMLIFrameElement>('[data-cv-pdf]').src=url;el<HTMLAnchorElement>('[data-cv-download]').href=url;
    el('[data-cv-filename]').textContent=docId===value.document.id?value.document.filename:'Documento del perfil confirmado anterior';
    for(const f of fields){
      const v=data?.[f.key];input(f.key).value=Array.isArray(v)?v.join(f.key==='education'||f.key==='experience'?'\n\n':'\n'):v??'';
      input(f.key).readOnly=true;
      const pages=[...new Set(value.extraction?.evidence[f.key]?.map(e=>e.page)??[])];
      el(`[data-cv-origin="${f.key}"]`).textContent=v?.length?(recruiter||confirmedCurrent?'Confirmado por el postulante':`Extraído del CV${pages.length?` · Página ${pages.join(', ')}`:''}. Revisa este dato.`):'No detectado';
    }
    if(!recruiter){
      el('[data-cv-edit]').hidden=!value.can_confirm;el('[data-cv-actions]').hidden=!value.can_confirm;
      el<HTMLInputElement>('[data-cv-reviewed]').checked=false;el('[data-cv-profile]').hidden=!value.confirmed;
      el('[data-cv-text]').textContent=value.extraction?.text??'';
      const warnings=el('[data-cv-warnings]');warnings.textContent=value.extraction?.warnings.join(' ')??'';warnings.hidden=!warnings.textContent||!!confirmedCurrent;
      if(!value.can_confirm&&!confirmedCurrent)el('[data-cv-state]').textContent+=' La confirmación solo está disponible mientras la postulación esté pendiente de evaluación.';
    }else{el('[data-cv-unconfirmed]').hidden=!!value.confirmed;form.hidden=!value.confirmed;}
    el('[data-cv-content]').hidden=false;
  };
  const showNotes=(items:Note[])=>{const list=el('[data-cv-notes]');list.replaceChildren();el('[data-cv-no-notes]').hidden=!!items.length;for(const n of items){const li=document.createElement('li');li.className='border-t border-slate-200 pt-4 dark:border-slate-700';const p=document.createElement('p');p.className='whitespace-pre-wrap break-words';p.textContent=n.body;const time=document.createElement('time');time.className='mt-2 block text-slate-600 dark:text-slate-300';time.dateTime=n.created_at;time.textContent=new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(n.created_at));li.append(p,time);list.append(li);}};
  const load=async()=>{
    if(loading||!session)return;loading=true;const run=++epoch;el('[data-cv-loading]').hidden=false;el('[data-cv-retry]').hidden=true;el('[data-cv-content]').hidden=true;el('[data-cv-message]').hidden=true;
    try{if(!/^[1-9][0-9]*$/.test(id))throw new Error('Abre la revisión desde una postulación.');const value=await cv.review(recruiter,id);if(run!==epoch||!session)return;fill(value);if(recruiter){const notes=await cv.notes(id);if(run===epoch&&session)showNotes(notes.items);}}
    catch(error){if(run===epoch){failure(error);el('[data-cv-retry]').hidden=false;}}
    finally{if(run===epoch)el('[data-cv-loading]').hidden=true;loading=false;}
  };
  const withBusy=async(button:HTMLButtonElement,fn:()=>Promise<void>)=>{if(busy)return;busy=true;button.disabled=true;const timer=window.setTimeout(()=>{button.classList.add('q-button-loading');button.setAttribute('aria-busy','true');},220);try{await fn();}finally{clearTimeout(timer);button.disabled=false;button.classList.remove('q-button-loading');button.removeAttribute('aria-busy');busy=false;}};
  form.addEventListener('input',event=>{dirty=true;const key=(event.target as HTMLInputElement).name;if(fields.some(f=>f.key===key))el(`[data-cv-origin="${key}"]`).textContent='Editado por ti. Se guardará al confirmar.';});
  root.querySelector('[data-cv-edit]')?.addEventListener('click',()=>{if(!current?.can_confirm)return;fields.forEach(f=>input(f.key).readOnly=false);input('name').focus();el('[data-cv-edit]').hidden=true;});
  form.addEventListener('submit',event=>{event.preventDefault();if(recruiter||!current?.can_confirm||!session||!form.reportValidity())return;const value=current,run=epoch;void withBusy(el<HTMLButtonElement>('[data-cv-save]'),async()=>{try{const result=await cv.confirm(id,value,profile());if(run!==epoch||!session)return;fill(result);say('Perfil actualizado. Tus datos quedaron confirmados.');}catch(error){if(run===epoch){failure(error);if(error instanceof ApiError&&error.status===409)el('[data-cv-retry]').hidden=false;}}});});
  const noteForm=root.querySelector<HTMLFormElement>('[data-cv-note-form]');
  noteForm?.addEventListener('input',()=>{dirty=true;});
  noteForm?.addEventListener('submit',event=>{event.preventDefault();if(!session||!noteForm.reportValidity())return;const run=epoch;void withBusy(noteForm.querySelector('button')!,async()=>{try{const notes=await cv.addNote(id,(noteForm.elements.namedItem('body') as HTMLTextAreaElement).value);if(run!==epoch||!session)return;showNotes(notes.items);noteForm.reset();dirty=false;say('Nota guardada.');}catch(error){if(run===epoch)failure(error);}});});
  el('[data-cv-retry]').addEventListener('click',()=>{if(dirty&&!window.confirm('Se descartarán las correcciones sin confirmar. ¿Volver a cargar?'))return;void load();});
  const tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-cv-tab]')];
  const select=(target:HTMLButtonElement)=>{tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===target));t.tabIndex=t===target?0:-1;el(`[data-cv-panel="${t.dataset.cvTab}"]`).classList.toggle('hidden',t!==target);});target.focus();};
  tabs.forEach(t=>{t.addEventListener('click',()=>select(t));t.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();select(event.key==='Home'?tabs[0]!:event.key==='End'?tabs[1]!:tabs.find(x=>x!==t)!);}});});
  window.addEventListener('beforeunload',event=>{if(dirty)event.preventDefault();});
  document.addEventListener('qori:before-logout',event=>{if(dirty)(event as CustomEvent).detail.allowed=Promise.resolve(window.confirm('Tienes cambios sin confirmar. ¿Cerrar sesión y descartarlos?'));});
  document.addEventListener('qori:session',event=>{session=(event as CustomEvent<Session>).detail;if(!current)void load();});
  document.addEventListener('qori:session-cleared',()=>{epoch++;session=undefined;current=undefined;dirty=false;form.reset();noteForm?.reset();el<HTMLIFrameElement>('[data-cv-pdf]').removeAttribute('src');el('[data-cv-content]').hidden=true;el('[data-cv-message]').hidden=true;root.querySelector('[data-cv-text]')?.replaceChildren();root.querySelector('[data-cv-notes]')?.replaceChildren();});
}
