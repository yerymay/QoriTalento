import {auth,homeFor,type Session} from './auth.service';
import {ApiError} from '../compartido/services/api';
export function initWorkspace(){
  const root=document.querySelector<HTMLElement>('[data-workspace]');if(!root)return;
  const el=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
  const feedback=el('[data-feedback]'), content=el('[data-private]'), loading=el('[data-loading]');
  const form=document.querySelector<HTMLFormElement>('[data-profile]');
  const expiry=el<HTMLDialogElement>('[data-expiry]'), confirm=el<HTMLDialogElement>('[data-confirm]');
  let session:Session|undefined, saving=false, refreshing=false, lastRefresh=0, loadingNow=false;
  const notice=(text:string,tone:'error'|'success'='error')=>{feedback.textContent=text;feedback.dataset.tone=tone;feedback.hidden=false;};
  const clear=()=>{content.hidden=true;el('[data-home]').hidden=true;el('[data-identity]').textContent='Sesión no disponible';form?.reset();session=undefined;expiry.close();confirm.close();document.dispatchEvent(new CustomEvent('qori:session-cleared'));};
  const failure=(error:unknown)=>{
    notice(error instanceof Error?error.message:'No se pudo completar la operación.');
    if(error instanceof ApiError && [401,403].includes(error.status)){clear();el('[data-signin]').hidden=false;}else el('[data-retry]').hidden=false;
  };
  document.addEventListener('qori:auth-error',event=>failure((event as CustomEvent).detail));
  const editable=(value:boolean)=>{
    form?.querySelectorAll<HTMLInputElement>('input').forEach(input=>input.readOnly=!value);
    if(form){el('[data-actions]').hidden=!value;el('[data-edit]').hidden=value;el('[data-verification-warning]').hidden=!value;}
  };
  const fill=()=>{
    if(!session)return;const {user}=session;
    if(form){for(const key of ['name','email','phone'] as const)(form.elements.namedItem(key) as HTMLInputElement).value=user[key]??'';
      (form.elements.namedItem('phone') as HTMLInputElement).required=user.kind==='INDIVIDUAL';el('[data-partial]').hidden=!!user.phone;editable(false);}
    el('[data-identity]').textContent=`${user.name} · ${user.role==='RECRUITER'?'Reclutador':'Postulante'}`;
    el('[data-space]').textContent=user.role==='RECRUITER'?'Panel de reclutamiento':'Portal de talento';
    const home=el<HTMLAnchorElement>('[data-home]');home.href=homeFor(user.role);home.hidden=false;
    el('[data-home-label]').textContent=user.role==='RECRUITER'?'Mis ofertas':'Buscar oportunidades';
    if(root.dataset.view==='home')home.setAttribute('aria-current','page');content.hidden=false;
    document.dispatchEvent(new CustomEvent('qori:session',{detail:session}));
  };
  const load=async()=>{
    if(loadingNow)return;loadingNow=true;loading.hidden=false;content.hidden=true;el('[data-retry]').hidden=true;feedback.hidden=true;
    try{session=await auth.me();if(root.dataset.role && root.dataset.role!==session.user.role){location.replace(homeFor(session.user.role));return;}fill();}
    catch(error){failure(error);}finally{loading.hidden=true;loadingNow=false;}
  };
  const logout=async()=>{const guard={allowed:Promise.resolve(true)};document.dispatchEvent(new CustomEvent('qori:before-logout',{detail:guard}));if(!await guard.allowed)return;try{await auth.logout();clear();location.replace('/login');}catch(error){failure(error);}};
  const refresh=async()=>{
    if(refreshing || !session)return;refreshing=true;
    try{session=await auth.refresh();lastRefresh=Date.now();expiry.close();}catch(error){failure(error);expiry.close();}finally{refreshing=false;}
  };
  el('[data-logout]').addEventListener('click',logout);el('[data-end]').addEventListener('click',logout);
  el('[data-continue]').addEventListener('click',refresh);el('[data-retry]').addEventListener('click',load);
  el('[data-menu]').addEventListener('click',()=>{const menu=el('#account-nav');const visible=menu.classList.toggle('hidden')===false;el('[data-menu]').setAttribute('aria-expanded',String(visible));});
  const checkTime=()=>{if(!session)return;const remaining=new Date(session.expires_at).getTime()-Date.now();if(remaining<=0){clear();notice('Tu sesión terminó. Inicia sesión de nuevo.');el('[data-signin]').hidden=false;}else if(remaining<=61000 && !expiry.open)expiry.showModal();};
  const interval=window.setInterval(checkTime,1000);
  const activity=()=>{if(session && !expiry.open && Date.now()-lastRefresh>30000)void refresh();};
  document.addEventListener('pointerdown',activity);document.addEventListener('keydown',activity);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkTime();if(session)void auth.me().then(value=>{session=value;}).catch(failure);}});
  window.addEventListener('pagehide',()=>{clearInterval(interval);clear();});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  if(form){
    el('[data-edit]').addEventListener('click',()=>{editable(true);(form.elements.namedItem('name') as HTMLInputElement).focus();});
    el('[data-cancel]').addEventListener('click',fill);
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(saving || !session || !form.reportValidity())return;
      const data=Object.fromEntries(new FormData(form));
      if(String(data.email).trim().toLowerCase()!==session.user.email || (session.user.kind==='INDIVIDUAL' && String(data.phone).trim()!==session.user.phone)){
        confirm.returnValue='cancel';confirm.showModal();await new Promise<void>(resolve=>confirm.addEventListener('close',()=>resolve(),{once:true}));if(confirm.returnValue!=='save')return;
      }
      saving=true;const button=el<HTMLButtonElement>('[data-save]');button.disabled=true;button.textContent='Guardando…';form.setAttribute('aria-busy','true');
      try{const result=await auth.update(data);if(result.verification_required){clear();notice('Cambios guardados. Por seguridad, inicia sesión nuevamente con tus datos actualizados.','success');el('[data-signin]').hidden=false;}else{session.user=result.user;fill();notice('Cambios guardados','success');}}
      catch(error){failure(error);}finally{saving=false;button.disabled=false;button.textContent='Guardar cambios';form.removeAttribute('aria-busy');}
    });
  }
  void load();
}
