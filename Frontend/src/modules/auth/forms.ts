import { initRegistrationDropdowns } from './dropdown';
import { auth, homeFor, type Role } from './auth.service';
import { ApiError } from '../compartido/services/api';
export function initAuthForm() {
  const form=document.querySelector<HTMLFormElement>('[data-auth-form]');if(!form)return;
  const registration=form.dataset.authForm==='register';
  const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const message=form.querySelector<HTMLElement>('[data-message]')!;
  const password=form.elements.namedItem('password') as HTMLInputElement;
  const role=form.querySelector<HTMLInputElement>('#role');
  const roleValue=role;
  const confirmation=form.querySelector<HTMLInputElement>('#confirm_password');
  const kind=form.elements.namedItem('kind') as HTMLInputElement|null;
  const phone=form.elements.namedItem('phone') as HTMLInputElement|null;
  let busy=false, complete=false;
  const label=submit.querySelector<HTMLElement>('[data-submit-label]')!;
  const spinner=submit.querySelector<HTMLElement>('[data-submit-spinner]')!;
  const check=submit.querySelector<HTMLElement>('[data-submit-check]')!;
  const retry=form.querySelector<HTMLButtonElement>('[data-auth-retry]')!;
  const buttonState=(state:'idle'|'busy'|'success')=>{
    submit.dataset.state=state;spinner.hidden=state!=='busy';check.hidden=state!=='success';
    submit.disabled=state!=='idle';submit.setAttribute('aria-busy',String(state==='busy'));
    label.textContent=state==='busy'?(registration?'Creando cuenta…':'Iniciando sesión…'):state==='success'?(registration?'Cuenta registrada':'Acceso correcto'):(registration?'Crear cuenta':'Iniciar sesión');
  };
  const showError=(error:unknown)=>{
    const status=error instanceof ApiError?error.status:500;
    const credentials=!registration&&(status===401||status===400||status===404);
    const title=credentials?'Correo o contraseña incorrectos':status===0?'Sin conexión':status===429?'Demasiados intentos':registration?'No se pudo crear la cuenta':'No se pudo iniciar sesión';
    const detail=credentials?'Revisa tus datos y vuelve a intentarlo.':status===0?'Revisa tu conexión y vuelve a escribir la contraseña para reintentar.':status===429?'Espera un minuto antes de volver a intentarlo.':'Intenta nuevamente en unos momentos.';
    message.querySelector<HTMLElement>('[data-error-title]')!.textContent=title;
    const detailElement=message.querySelector<HTMLElement>('[data-error-detail]')!;
    detailElement.textContent=detail;detailElement.hidden=credentials;
    retry.hidden=!(status===0||status>=500);message.hidden=false;
  };
  retry.addEventListener('click',()=>{if(password.value)form.requestSubmit();else password.focus();});
  const validate=()=>{
    const recruiter=role?.value==='RECRUITER';
    const roleSummary=form.parentElement?.querySelector<HTMLElement>('[data-role-summary]');if(roleSummary)roleSummary.textContent=recruiter?'Reclutador':'Postulante';
    const group=form.querySelector<HTMLElement>('[data-recruiter]');if(group)group.hidden=!recruiter;
    if(kind)kind.disabled=!recruiter;
    if(roleValue && role)roleValue.value=role.value;
    const signinLink=form.querySelector<HTMLAnchorElement>('[data-signin-link]');
    if(signinLink && role)signinLink.href=`/login?role=${role.value}`;
    const needsPhone=!!recruiter && kind?.value==='INDIVIDUAL';
    const phoneGroup=form.querySelector<HTMLElement>('[data-phone-group]');
    if(phoneGroup)phoneGroup.hidden=!needsPhone;
    if(phone){phone.required=needsPhone;phone.disabled=!needsPhone;}
    if(confirmation)confirmation.setCustomValidity(confirmation.value && confirmation.value!==password.value?'Las contraseñas no coinciden.':'');
    form.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]').forEach(button=>button.disabled=complete);
    submit.disabled=busy || complete;

  };
  form.addEventListener('input',validate);form.addEventListener('change',validate);
  const showFieldError=(input:HTMLInputElement)=>{
    const error=document.getElementById(`${input.id}-error`);
    if(!error)return;
    const invalid=!input.validity.valid;
    const field=input.closest<HTMLElement>('[data-validation-field]');
    if(field)field.dataset.validation=invalid?'error':'';
    error.hidden=!invalid;
    error.textContent=!invalid?'':input.validity.customError?input.validationMessage:input.validity.valueMissing?'Completa este campo.':input.type==='email'?'Ingresa un correo válido, por ejemplo nombre@gmail.com.':`Revisa este campo${input.minLength>0?`; mínimo ${input.minLength} caracteres`:''}.`;
    input.setAttribute('aria-invalid',String(invalid));
  };
  form.addEventListener('focusout',event=>{
    if(event.target instanceof HTMLInputElement)showFieldError(event.target);
  });
  form.addEventListener('input',()=>{
    form.querySelectorAll<HTMLInputElement>('[aria-invalid="true"]').forEach(input=>{
      if(input.validity.valid)showFieldError(input);
    });
  });
  form.querySelectorAll<HTMLButtonElement>('[data-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=button.closest<HTMLElement>('[data-validation-field]')?.querySelector<HTMLInputElement>('input');
    if(!input)return;
    input.type=input.type==='password'?'text':'password';
    const visible=input.type==='text';
    const label=visible?'Ocultar contraseña':'Mostrar contraseña';
    const detail=input.id==='confirm_password'?' de confirmación':'';
    button.setAttribute('aria-pressed',String(visible));
    button.setAttribute('aria-label',label+detail);
    button.setAttribute('title',label+detail);
  }));
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
  if(registration)initRegistrationDropdowns(form);
  const initialRole=requestedRole==='CANDIDATE' || requestedRole==='RECRUITER' ? requestedRole : form.dataset.initialRole;
  const initialChoice=choices.find(choice=>choice.dataset.role===initialRole);
  initialChoice?.click();
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy || complete)return;
    validate();
    if(!form.checkValidity()){
      form.querySelectorAll<HTMLInputElement>('input').forEach(showFieldError);
      form.querySelector<HTMLElement>(':invalid')?.focus();
      return;
    }
    const data=Object.fromEntries(new FormData(form));
    busy=true;buttonState('busy');form.setAttribute('aria-busy','true');message.hidden=true;
    const controls=[...form.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button')];
    const wasDisabled=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);
    try {
      if(registration){
        const selected=String(data.role) as Role;delete data.role;delete data.confirm_password;if(selected==='CANDIDATE')delete data.kind;
        await auth.register(selected,data);complete=true;
      }else{
        const session=await auth.login(data);complete=true;buttonState('success');
        await new Promise(resolve=>setTimeout(resolve,300));
        location.assign(homeFor(session.user.role));
      }
      password.value='';if(confirmation)confirmation.value='';
      buttonState('success');
    }catch(error){
      password.value='';password.type='password';if(confirmation){confirmation.value='';confirmation.type='password';}
      form.querySelectorAll<HTMLButtonElement>('[data-password]').forEach(button=>{
        button.setAttribute('aria-pressed','false');const label='Mostrar contraseña'+(button.closest('[data-validation-field]')?.querySelector('input')?.id==='confirm_password'?' de confirmación':'');
        button.setAttribute('aria-label',label);button.title=label;
      });
      showError(error);
    }finally{
      busy=false;form.removeAttribute('aria-busy');
      if(!complete){controls.forEach((control,index)=>control.disabled=wasDisabled[index]!);buttonState('idle');validate();password.focus();}
      else buttonState('success');
    }
  });

  validate();
}
