import { initRegistrationDropdowns } from './dropdown';
import { showToast, queueToast } from '../compartido/services/toast';
import { auth, homeFor, type Role } from './auth.service';
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
  const show=(text:string,tone:'error'|'success')=>{showToast(text,tone);};
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
    if(registration)submit.disabled=busy || complete || !form.checkValidity();
    const rules: Record<string, boolean> = {
      length: password.value.length>=8,
      lowercase: /[a-záéíóúñü]/.test(password.value),
      special: /[^\p{L}\p{N}\s]/u.test(password.value),
    };
    form.querySelectorAll<HTMLElement>('[data-password-rule]').forEach(item=>{
      const met=rules[item.dataset.passwordRule ?? ''] ?? false;
      item.classList.toggle('text-emerald-700',met);
      item.classList.toggle('dark:text-emerald-300',met);
      const status=item.querySelector<HTMLElement>('[data-rule-status]');
      if(status)status.textContent=met?'Cumplido':'Pendiente';
    });
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
    error.textContent=!invalid?'':input.validity.customError?input.validationMessage:input.validity.valueMissing?'Completa este campo.':input.type==='email'?'Ingresa un correo válido, por ejemplo nombre@gmail.com.':`Revisa este campo${input.minLength>0?`; mínimo ${input.minLength} caracteres`:''}.`;
    if(success)error.textContent='Formato de correo válido.';
    input.setAttribute('aria-invalid',String(invalid));
  };
  form.addEventListener('focusout',event=>{
    if(event.target instanceof HTMLInputElement)showFieldError(event.target);
  });
  form.addEventListener('input',event=>{
    if(event.target instanceof HTMLInputElement && event.target.hasAttribute('aria-invalid'))showFieldError(event.target);
    if(event.target===password && confirmation?.hasAttribute('aria-invalid'))showFieldError(confirmation);
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
      if(registration){const selected=String(data.role) as Role;delete data.role;delete data.confirm_password;if(selected==='CANDIDATE')delete data.kind;
        const result=await auth.register(selected,data);complete=true;password.value='';if(confirmation)confirmation.value='';show(result.message,'success');
        form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select').forEach(input=>input.disabled=true);
      }else{const session=await auth.login(data);password.value='';queueToast('Sesión iniciada correctamente.','success');location.assign(homeFor(session.user.role));}
    }catch(error){show(error instanceof Error?error.message:'No se pudo completar la operación. Intenta de nuevo.','error');}
    finally{busy=false;form.removeAttribute('aria-busy');submit.textContent=complete?'Cuenta registrada':registration?'Crear cuenta':'Iniciar sesión';submit.disabled=complete;validate();}
  });
  validate();
}
