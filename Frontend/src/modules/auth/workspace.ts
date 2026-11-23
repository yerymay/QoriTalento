import { initAccountProfile } from './account-profile';
import { initProfileMenu } from './profile-menu';
import { initSidebar } from './sidebar';
import {auth,homeFor,type Session} from './auth.service';
import {ApiError} from '../compartido/services/api';
export function initWorkspace(){
  const root=document.querySelector<HTMLElement>('[data-workspace]');if(!root)return;
  initSidebar(root);
  const profileMenu=initProfileMenu(root);
  const el=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
  const feedback=el('[data-feedback]'), content=el('[data-private]'), loading=el('[data-loading]');
  const expiry=el<HTMLDialogElement>('[data-expiry]'), confirm=el<HTMLDialogElement>('[data-confirm]');
  let session:Session|undefined, refreshing=false, lastRefresh=0, loadingNow=false, examActive=false;
  const notice=(text:string,tone:'error'|'success'='error')=>{feedback.textContent=text;feedback.dataset.tone=tone;feedback.setAttribute('role',tone==='error'?'alert':'status');feedback.hidden=false;};
  document.addEventListener('qori:exam-active',event=>{examActive=!!(event as CustomEvent).detail;});
  const clear=(preserveLocal=false)=>{profileMenu.close();el<HTMLButtonElement>('[data-profile-trigger]').disabled=true;el('[data-profile-name]').textContent='';el('[data-profile-email]').textContent='';el('[data-profile-role]').textContent='';content.hidden=true;el('[data-home]').hidden=true;el('[data-app-nav]').hidden=true;el('[data-exam-nav]').hidden=true;el('[data-user-name]').textContent='Sesión no disponible';el('[data-user-role]').textContent='';el('[data-user-avatar]').textContent='';session=undefined;expiry.close();confirm.close();document.dispatchEvent(new CustomEvent('qori:session-cleared',{detail:{preserveLocal}}));};
  const failure=(error:unknown)=>{
    el('[data-user-name]').textContent='Cuenta no disponible';el('[data-user-role]').textContent='';el<HTMLButtonElement>('[data-profile-trigger]').disabled=true;
    notice(error instanceof Error?error.message:'No se pudo completar la operación.');
    if(error instanceof ApiError && [401,403].includes(error.status)){clear();el('[data-signin]').hidden=false;}else el('[data-retry]').hidden=false;
  };
  document.addEventListener('qori:auth-error',event=>failure((event as CustomEvent).detail));
  const fill=()=>{
    if(!session)return;const {user}=session;
    el('[data-profile-name]').textContent=user.name;
    el('[data-profile-email]').textContent=user.email;
    el('[data-profile-role]').textContent=user.role==='RECRUITER'?'Reclutador':'Postulante';
    el<HTMLButtonElement>('[data-profile-trigger]').disabled=false;
    el('[data-user-name]').removeAttribute('data-i18n');el('[data-user-name]').textContent=user.name;
    el('[data-user-role]').textContent=user.role==='RECRUITER'?'Reclutador':'Postulante';
    el('[data-user-avatar]').textContent=user.name.trim().split(/\s+/u).slice(0,2).map(part=>Array.from(part)[0] ?? '').join('').toLocaleUpperCase('es');
    const home=el<HTMLAnchorElement>('[data-home]');home.href=homeFor(user.role);home.hidden=false;home.setAttribute('aria-label',user.role==='RECRUITER'?'Mis ofertas':'Buscar oportunidades');
    el<HTMLAnchorElement>('[data-exam-nav]').href=user.role==='RECRUITER'?'/reclutador/examenes':'/postulante/examenes';el('[data-exam-nav]').hidden=false;
    el('[data-home-label]').textContent=user.role==='RECRUITER'?'Mis ofertas':'Buscar oportunidades';el('[data-app-nav]').hidden=user.role!=='CANDIDATE';
    if(root.dataset.view==='home'){home.setAttribute('aria-current','page');home.classList.add('bg-sky-50','text-sky-800','dark:bg-sky-950','dark:text-sky-200');}content.hidden=false;
    document.dispatchEvent(new CustomEvent('qori:session',{detail:session}));
  };
  const load=async()=>{
    if(loadingNow)return;loadingNow=true;loading.hidden=false;el('[data-signin]').hidden=true;el('[data-user-name]').textContent='Cargando cuenta…';content.hidden=true;el('[data-retry]').hidden=true;feedback.hidden=true;
    try{session=await auth.me();if(root.dataset.role && root.dataset.role!==session.user.role){location.replace(homeFor(session.user.role));return;}fill();}
    catch(error){failure(error);}finally{loading.hidden=true;loadingNow=false;}
  };
  const logout=async()=>{const guard={allowed:Promise.resolve(true)};document.dispatchEvent(new CustomEvent('qori:before-logout',{detail:guard}));if(!await guard.allowed)return;try{await auth.logout();clear();location.replace('/login');}catch(error){failure(error);}};
  const refresh=async()=>{
    if(refreshing || !session)return;refreshing=true;
    try{session=await auth.refresh();lastRefresh=Date.now();expiry.close();}catch(error){failure(error);expiry.close();}finally{refreshing=false;}
  };
  el('[data-profile-logout]').addEventListener('click',logout);el('[data-end]').addEventListener('click',logout);
  el('[data-continue]').addEventListener('click',refresh);el('[data-retry]').addEventListener('click',load);

  const checkTime=()=>{if(!session)return;const remaining=new Date(session.expires_at).getTime()-Date.now();if(remaining<=0){clear();notice('Tu sesión terminó. Inicia sesión de nuevo.');el('[data-signin]').hidden=false;}else if(examActive && remaining<=90000){void refresh();}else if(remaining<=61000 && !expiry.open)expiry.showModal();};
  const interval=window.setInterval(checkTime,1000);
  const activity=()=>{if(session && !expiry.open && Date.now()-lastRefresh>30000)void refresh();};
  document.addEventListener('pointerdown',activity);document.addEventListener('keydown',activity);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkTime();if(session)void auth.me().then(value=>{session=value;}).catch(failure);}});
  window.addEventListener('pagehide',()=>{clearInterval(interval);clear(true);});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  initAccountProfile({getSession:()=>session,updated:user=>{if(session){session.user=user;fill();}},verification:()=>{clear();notice('Cambios guardados. Por seguridad, inicia sesión nuevamente con tus datos actualizados.','success');el('[data-signin]').hidden=false;},unauthorized:failure});
  void load();
}
