import { showToast, queueToast } from '../compartido/services/toast';
﻿import { auth, homeFor, type Role } from './auth.service';
export function initAuthForm() {
  const form=document.querySelector<HTMLFormElement>('[data-auth-form]');if(!form)return;
  const registration=form.dataset.authForm==='register';
  const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const message=form.querySelector<HTMLElement>('[data-message]')!;
  const password=form.elements.namedItem('password') as HTMLInputElement;
  const role=form.querySelector<HTMLSelectElement>('#role');
  const roleValue=form.querySelector<HTMLInputElement>('[data-role-value]');
  const kind=form.elements.namedItem('kind') as HTMLSelectElement|null;
  const phone=form.elements.namedItem('phone') as HTMLInputElement|null;
  let busy=false, complete=false;
  const show=(text:string,tone:'error'|'success')=>{showToast(text,tone);};
  const validate=()=>{
    const recruiter=role?.value==='RECRUITER';
    const roleSummary=form.parentElement?.querySelector<HTMLElement>('[data-role-summary]');if(roleSummary)roleSummary.textContent=recruiter?'Reclutador':'Postulante';
    const group=form.querySelector<HTMLElement>('[data-recruiter]');if(group)group.hidden=!recruiter;
    if(kind)kind.disabled=!recruiter;
    if(phone)phone.required=!!recruiter && kind?.value==='INDIVIDUAL';
    if(registration)submit.disabled=busy || complete || !form.checkValidity();
    const strength=form.querySelector<HTMLElement>('[data-strength]');
    if(strength)strength.textContent=password.value.length<8?'Fortaleza: escribe al menos 8 caracteres.':password.value.length<12?'Fortaleza: básica. Una frase más larga protege mejor tu cuenta.':'Fortaleza: buena longitud. Evita frases conocidas o datos personales.';
  };
  form.addEventListener('input',validate);form.addEventListener('change',validate);
  const showFieldError=(input:HTMLInputElement)=>{
    const error=document.getElementById(`${input.id}-error`);
    if(!error)return;
    const invalid=!input.validity.valid;
    const field=input.closest<HTMLElement>('[data-validation-field]');
    const success=!!field && input.type==='email' && !invalid && !!input.value;
    if(field)field.dataset.validation=invalid?'error':success?'success':'';
    error.hidden=!invalid && !success;
    error.textContent=!invalid?'':input.validity.valueMissing?'Completa este campo.':input.type==='email'?'Ingresa un correo válido, por ejemplo nombre@gmail.com.':`Revisa este campo${input.minLength>0?`; mínimo ${input.minLength} caracteres`:''}.`;
    if(success)error.textContent='Formato de correo válido.';
    input.setAttribute('aria-invalid',String(invalid));
  };
  form.addEventListener('focusout',event=>{
    if(event.target instanceof HTMLInputElement)showFieldError(event.target);
  });
  form.addEventListener('input',event=>{
    if(event.target instanceof HTMLInputElement && event.target.hasAttribute('aria-invalid'))showFieldError(event.target);
  });
  form.querySelector<HTMLButtonElement>('[data-password-legacy]')?.addEventListener('click',event=>{
    const button=event.currentTarget as HTMLButtonElement;password.type=password.type==='password'?'text':'password';button.setAttribute('aria-pressed',String(password.type==='text'));
    // Mantener el icono de Figma sin reconstruir el control.
    const image=button.querySelector('img');button.textContent=password.type==='text'?'Ocultar contraseña':'Mostrar contraseña';if(image)button.prepend(image);
  });
  form.querySelector<HTMLButtonElement>('[data-password]')?.addEventListener('click',event=>{
    const button=event.currentTarget as HTMLButtonElement;
    password.type=password.type==='password'?'text':'password';
    const visible=password.type==='text';
    button.setAttribute('aria-pressed',String(visible));
    button.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');
    button.setAttribute('title',visible?'Ocultar contraseña':'Mostrar contraseña');
  });
  const choices=[...form.querySelectorAll<HTMLButtonElement>('[data-role-choice]')];
  const hint=form.querySelector<HTMLElement>('[data-role-hint]');
  const registerLink=form.parentElement?.querySelector<HTMLAnchorElement>('[data-register-link]');
  choices.forEach(choice=>choice.addEventListener('click',()=>{
    choices.forEach(item=>{
      const selected=item===choice;
      item.setAttribute('aria-pressed',String(selected));
      item.classList.toggle('bg-white',selected);item.classList.toggle('dark:bg-slate-900',selected);
      item.classList.toggle('text-slate-900',selected);item.classList.toggle('dark:text-white',selected);
      item.classList.toggle('shadow-sm',selected);item.classList.toggle('text-sky-800',!selected);item.classList.toggle('dark:text-sky-200',!selected);
    });
    if(registerLink)registerLink.href=`/registro?role=${choice.dataset.role}`;
    if(hint)hint.textContent=choice.dataset.roleLabel==='Reclutador'?'Accede a tus ofertas y procesos de selección.':'Encuentra oportunidades y sigue tus postulaciones.';
  }));
  const requestedRole=new URLSearchParams(window.location.search).get('role');
  if(registration && role && (requestedRole==='CANDIDATE' || requestedRole==='RECRUITER')){role.value=requestedRole;if(roleValue)roleValue.value=requestedRole;}
  const initialRole=requestedRole==='CANDIDATE' || requestedRole==='RECRUITER' ? requestedRole : form.dataset.initialRole;
  const initialChoice=choices.find(choice=>choice.dataset.role===initialRole);
  initialChoice?.click();
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy || complete)return;
    if(registration && !form.reportValidity())return;
    if(!registration && !form.checkValidity()){
      showToast('Revisa los campos marcados antes de continuar.','warning');
      form.querySelectorAll<HTMLInputElement>('input').forEach(showFieldError);
      form.querySelector<HTMLElement>(':invalid')?.focus();
      return;
    }
    busy=true;submit.disabled=true;submit.textContent=registration?'Registrando…':'Iniciando sesión…';form.setAttribute('aria-busy','true');message.hidden=true;
    const data=Object.fromEntries(new FormData(form));
    try {
      if(registration){const selected=String(data.role) as Role;delete data.role;if(selected==='CANDIDATE')delete data.kind;
        const result=await auth.register(selected,data);complete=true;password.value='';show(result.message,'success');
        form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select').forEach(input=>input.disabled=true);
      }else{const session=await auth.login(data);password.value='';queueToast('Sesión iniciada correctamente.','success');location.assign(homeFor(session.user.role));}
    }catch(error){show(error instanceof Error?error.message:'No se pudo completar la operación. Intenta de nuevo.','error');}
    finally{busy=false;form.removeAttribute('aria-busy');submit.textContent=complete?'Cuenta registrada':registration?'Registrar':'Iniciar sesión';submit.disabled=complete;validate();}
  });
  validate();
}
