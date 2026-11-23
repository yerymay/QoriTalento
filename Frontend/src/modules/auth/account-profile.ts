import {auth,type Session,type User} from './auth.service';
import {ApiError} from '../compartido/services/api';
import {initProfileValidation} from './profile-validation';
import {senalDeAccion} from '../compartido/preferencias-senal';

interface Callbacks {
  getSession:()=>Session|undefined;
  updated:(user:User)=>void;
  verification:()=>void;
  unauthorized:(error:unknown)=>void;
}
export function initAccountProfile(callbacks:Callbacks) {
  const element=document.querySelector<HTMLElement>('[data-account-profile]');
  if(!element)return;
  const root:HTMLElement=element;
  const sections=[...root.querySelectorAll<HTMLElement>('[data-account-section]')];
  const forms=sections.map(section=>section.querySelector<HTMLFormElement>('form')!);
  const validators=forms.map(initProfileValidation);
  const dialog=document.querySelector<HTMLDialogElement>('[data-confirm]')!;
  let editing:HTMLElement|undefined,saving=false,epoch=0,revealed=false;
  const get=<T extends HTMLElement=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const mask=()=>{
    const dni=callbacks.getSession()?.user.dni;
    get('[data-account-value=dni]').textContent=dni?(revealed?dni:'••••'+dni.slice(-4)):'No registrado';
    root.querySelectorAll<HTMLButtonElement>('[data-dni-toggle]').forEach(button=>{
      button.hidden=!dni&&(!editing||editing.dataset.accountSection!=='personal');button.setAttribute('aria-pressed',String(revealed));
      button.textContent=revealed?'Ocultar DNI':'Mostrar DNI';
      button.setAttribute('aria-label',revealed?'Ocultar DNI':'Mostrar DNI');
    });
    get<HTMLInputElement>('[name=dni]').type=revealed?'text':'password';
  };
  const controls=()=>{
    root.querySelectorAll<HTMLButtonElement>('[data-section-edit],[data-account-edit]').forEach(button=>button.disabled=saving||!!editing);
  };
  function close(section:HTMLElement) {
    section.querySelector<HTMLElement>('[data-section-view]')!.hidden=false;
    const form=section.querySelector<HTMLFormElement>('form')!;
    form.hidden=true;form.reset();validators[forms.indexOf(form)]!.reset();
    editing=undefined;revealed=false;mask();controls();
  }
  function fill() {
    const user=callbacks.getSession()?.user;if(!user)return;
    get('[data-account-name]').textContent=user.name;
    get('[data-account-avatar]').textContent=user.name.trim().split(/\s+/u).slice(0,2).map(part=>Array.from(part)[0]??'').join('').toLocaleUpperCase('es');
    get('[data-account-role]').textContent=user.role==='RECRUITER'?'Reclutador':'Postulante';
    for(const key of ['name','email','phone'] as const)get('[data-account-value='+key+']').textContent=user[key]||'No registrado';
    get<HTMLInputElement>('[name=phone]').required=user.kind==='INDIVIDUAL';
    const optional=root.querySelector<HTMLElement>('[data-phone-optional]');if(optional)optional.hidden=user.kind==='INDIVIDUAL';
    sections.forEach(section=>{close(section);section.querySelector<HTMLElement>('[data-section-save]')!.hidden=true;section.querySelector<HTMLElement>('[data-section-error]')!.hidden=true;});
    revealed=false;mask();controls();
  }
  function edit(section:HTMLElement) {
    const session=callbacks.getSession();if(!session||saving||editing)return;
    editing=section;revealed=false;
    const form=section.querySelector<HTMLFormElement>('form')!;
    for(const input of form.querySelectorAll<HTMLInputElement>('input[name]'))input.value=session.user[input.name as 'name'|'email'|'phone'|'dni']??'';
    section.querySelector<HTMLElement>('[data-section-view]')!.hidden=true;
    section.querySelector<HTMLElement>('[data-section-save]')!.hidden=true;
    section.querySelector<HTMLElement>('[data-section-error]')!.hidden=true;
    form.hidden=false;mask();controls();form.querySelector<HTMLInputElement>('input')?.focus();
  }
  root.querySelector('[data-account-edit]')!.addEventListener('click',()=>edit(sections[0]!));
  sections.forEach((section,index)=>{
    const form=forms[index]!,fieldset=form.querySelector<HTMLFieldSetElement>('fieldset')!;
    const status=section.querySelector<HTMLElement>('[data-section-save]')!;
    const errorBox=section.querySelector<HTMLElement>('[data-section-error]')!;
    section.querySelector('[data-section-edit]')!.addEventListener('click',()=>edit(section));
    section.querySelector('[data-section-cancel]')!.addEventListener('click',()=>{
      if(saving)return;close(section);status.hidden=true;errorBox.hidden=true;
      section.querySelector<HTMLElement>('[data-section-edit]')!.focus();senalDeAccion('cancelacion');
    });
    section.querySelector('[data-section-retry]')!.addEventListener('click',()=>form.requestSubmit());
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const session=callbacks.getSession(),run=epoch;
      let saved=false;
      if(!session||saving||editing!==section||!validators[index]!.validate())return;
      // El endpoint recibe la cuenta actual más los campos de esta sección.
      const data={name:session.user.name,email:session.user.email,phone:session.user.phone??'',dni:session.user.dni??''};
      for(const input of form.querySelectorAll<HTMLInputElement>('input[name]'))data[input.name as keyof typeof data]=input.value.trim();
      const sensitive=data.email.toLowerCase()!==session.user.email.toLowerCase()||
        (session.user.kind==='INDIVIDUAL'&&data.phone!==(session.user.phone??''));
      saving=true;fieldset.disabled=true;controls();
      try {
        if(sensitive){
          dialog.returnValue='cancel';dialog.showModal();
          await new Promise<void>(resolve=>dialog.addEventListener('close',()=>resolve(),{once:true}));
          if(run!==epoch||!callbacks.getSession()||dialog.returnValue!=='save')return;
        }
        if(run!==epoch||!callbacks.getSession())return;
        status.textContent='Guardando…';status.hidden=false;errorBox.hidden=true;form.setAttribute('aria-busy','true');senalDeAccion('progreso');
        const result=await auth.update(data);
        if(run!==epoch||!callbacks.getSession())return;
        if(result.verification_required){callbacks.verification();return;}
        callbacks.updated(result.user);
        status.textContent='Guardado';status.hidden=false;
        saved=true;
        senalDeAccion('exito');
      } catch(error) {
        if(run!==epoch||!callbacks.getSession())return;
        if(error instanceof ApiError&&[401,403].includes(error.status)){callbacks.unauthorized(error);return;}
        status.hidden=true;errorBox.hidden=false;
        section.querySelector('[data-section-error-text]')!.textContent=error instanceof Error?error.message:'Intenta nuevamente. Tus cambios siguen en el formulario.';
        errorBox.scrollIntoView({block:'nearest',behavior:'instant'});senalDeAccion('error');
      } finally {
        saving=false;fieldset.disabled=false;form.removeAttribute('aria-busy');controls();
        if(saved)section.querySelector<HTMLElement>('[data-section-edit]')!.focus();
      }
    });
  });
  root.querySelectorAll('[data-dni-toggle]').forEach(button=>button.addEventListener('click',()=>{revealed=!revealed;mask();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){revealed=false;mask();}});
  document.addEventListener('qori:session',fill);
  document.addEventListener('qori:session-cleared',()=>{
    epoch++;saving=false;editing=undefined;revealed=false;forms.forEach((form,index)=>{form.reset();form.hidden=true;form.querySelector('fieldset')!.disabled=false;validators[index]!.reset();});
    root.querySelectorAll<HTMLElement>('[data-account-value],[data-account-name],[data-account-avatar],[data-account-role],[data-section-save],[data-section-error-text]').forEach(node=>node.textContent='');
    sections.forEach(section=>{section.querySelector<HTMLElement>('[data-section-save]')!.hidden=true;section.querySelector<HTMLElement>('[data-section-error]')!.hidden=true;});controls();
  });
  document.addEventListener('qori:before-logout',event=>{
    if(saving)(event as CustomEvent<{allowed:Promise<boolean>}>).detail.allowed=Promise.resolve(false);
  });
  window.addEventListener('beforeunload',event=>{if(editing){event.preventDefault();}});
}
