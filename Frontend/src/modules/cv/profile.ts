import { cv, fields } from './cv.service';
import type { Session } from '../auth/auth.service';
export function initProfileSummary(){
  const root=document.querySelector<HTMLElement>('[data-cv-profile-summary]');if(!root)return;
  let epoch=0,active=false;
  const status=root.querySelector<HTMLElement>('[data-cv-profile-status]')!,values=root.querySelector('[data-cv-profile-values]')!,retry=root.querySelector<HTMLButtonElement>('[data-cv-profile-retry]')!;
  const load=async()=>{if(!active)return;const run=++epoch;retry.hidden=true;values.replaceChildren();status.textContent='Cargando tu perfil curricular…';
    try{const result=await cv.profile();if(run!==epoch||!active)return;if(!result.profile){status.textContent='Todavía no confirmaste un CV. Revisa los datos de una postulación para completar aquí tu formación, experiencia y habilidades.';return;}status.textContent=`Confirmado el ${new Intl.DateTimeFormat('es-PE',{dateStyle:'medium'}).format(new Date(result.profile.confirmed_at))}. El correo de contacto del CV puede ser distinto del correo de acceso.`;
      for(const field of fields){const wrap=document.createElement('div');wrap.className='min-w-0';const dt=document.createElement('dt');dt.className='font-semibold';dt.textContent=field.label;const dd=document.createElement('dd');dd.className='mt-2 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200';const value=result.profile.profile[field.key];dd.textContent=(Array.isArray(value)?value.join('\n\n'):value)||'No especificado';wrap.append(dt,dd);values.append(wrap);}}
    catch{if(run===epoch){status.textContent='No se pudo cargar el perfil curricular. Intenta nuevamente.';retry.hidden=false;}}};
  document.addEventListener('qori:session',event=>{active=(event as CustomEvent<Session>).detail.user.role==='CANDIDATE';root.hidden=!active;if(active)void load();});
  document.addEventListener('qori:session-cleared',()=>{epoch++;active=false;root.hidden=true;values.replaceChildren();status.textContent='';});
  retry.addEventListener('click',()=>void load());
}
