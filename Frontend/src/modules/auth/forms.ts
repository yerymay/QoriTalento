import { auth, homeFor, type Role } from './auth.service';
export function initAuthForm() {
  const form=document.querySelector<HTMLFormElement>('[data-auth-form]');if(!form)return;
  const registration=form.dataset.authForm==='register';
  const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const message=form.querySelector<HTMLElement>('[data-message]')!;
  const password=form.elements.namedItem('password') as HTMLInputElement;
  const role=form.elements.namedItem('role') as HTMLSelectElement|null;
  const kind=form.elements.namedItem('kind') as HTMLSelectElement|null;
  const phone=form.elements.namedItem('phone') as HTMLInputElement|null;
  let busy=false, complete=false;
  const show=(text:string,tone:'error'|'success')=>{message.textContent=text;message.dataset.tone=tone;message.hidden=false;message.focus();};
  const validate=()=>{
    const recruiter=role?.value==='RECRUITER';
    const group=form.querySelector<HTMLElement>('[data-recruiter]');if(group)group.hidden=!recruiter;
    if(kind)kind.disabled=!recruiter;
    if(phone)phone.required=!!recruiter && kind?.value==='INDIVIDUAL';
    if(registration)submit.disabled=busy || complete || !form.checkValidity();
    const strength=form.querySelector<HTMLElement>('[data-strength]');
    if(strength)strength.textContent=password.value.length<8?'Fortaleza: escribe al menos 8 caracteres.':password.value.length<12?'Fortaleza: básica. Una frase más larga protege mejor tu cuenta.':'Fortaleza: buena longitud. Evita frases conocidas o datos personales.';
  };
  form.addEventListener('input',validate);form.addEventListener('change',validate);
  form.addEventListener('focusout',event=>{
    if(!(event.target instanceof HTMLInputElement))return;
    const input=event.target, error=document.getElementById(`${input.id}-error`);
    if(error){error.hidden=input.validity.valid;error.textContent=input.validity.valid?'':input.validity.valueMissing?'Completa este campo.':input.type==='email'?'Ingresa un correo válido.':`Revisa este campo${input.minLength>0?`; mínimo ${input.minLength} caracteres`:''}.`;input.setAttribute('aria-invalid',String(!input.validity.valid));}
  });
  form.querySelector<HTMLButtonElement>('[data-password]')?.addEventListener('click',event=>{
    const button=event.currentTarget as HTMLButtonElement;password.type=password.type==='password'?'text':'password';button.setAttribute('aria-pressed',String(password.type==='text'));
    // Mantener el icono de Figma sin reconstruir el control.
    const image=button.querySelector('img');button.textContent=password.type==='text'?'Ocultar contraseña':'Mostrar contraseña';if(image)button.prepend(image);
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy || complete || !form.reportValidity())return;
    busy=true;submit.disabled=true;submit.textContent=registration?'Registrando…':'Iniciando sesión…';form.setAttribute('aria-busy','true');message.hidden=true;
    const data=Object.fromEntries(new FormData(form));
    try {
      if(registration){const selected=String(data.role) as Role;delete data.role;if(selected==='CANDIDATE')delete data.kind;
        const result=await auth.register(selected,data);complete=true;password.value='';show(result.message,'success');
        form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select').forEach(input=>input.disabled=true);
      }else{const session=await auth.login(data);password.value='';location.assign(homeFor(session.user.role));}
    }catch(error){show(error instanceof Error?error.message:'No se pudo completar la operación. Intenta de nuevo.','error');}
    finally{busy=false;form.removeAttribute('aria-busy');submit.textContent=complete?'Cuenta registrada':registration?'Registrar':'Iniciar sesión';submit.disabled=complete;validate();}
  });
  validate();
}
