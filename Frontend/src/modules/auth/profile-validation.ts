export function initProfileValidation(form: HTMLFormElement) {
  const fields = [...form.querySelectorAll<HTMLInputElement>('input[name]')];
  const touched = new Set<HTMLInputElement>();
  const check = (input: HTMLInputElement, show: boolean) => {
    const value = input.value.trim();
    let message = '';
    if (input.required && !value) message = 'Completa este campo.';
    else if (input.name === 'name' && value && value.length < 2) message = 'Ingresa al menos 2 caracteres.';
    else if (input.name === 'email' && value && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || input.validity.typeMismatch)) message = 'Ingresa un correo electrónico válido.';
    else if (input.name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (!/^\+?\d[\d ()-]*$/.test(value) || digits.length < 7 || digits.length > 15 || (/[()]/.test(value) && !/^[^()]*\(\d{1,4}\)[^()]*$/.test(value))) message = 'Ingresa un teléfono con entre 7 y 15 dígitos.';
    } else if (input.name === 'dni' && value && !/^\d{8}$/.test(value)) message = 'El DNI debe tener 8 dígitos.';
    input.setCustomValidity(message);
    if (show) {
      const error = document.getElementById(`${input.id}-error`);
      if (error) { error.textContent = message; error.hidden = !message; }
      input.setAttribute('aria-invalid', String(!!message));
    }
    return !message;
  };
  form.addEventListener('focusout', event => {
    if (event.target instanceof HTMLInputElement && fields.includes(event.target)) { touched.add(event.target); check(event.target, true); }
  });
  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement && fields.includes(event.target)) check(event.target, touched.has(event.target));
  });
  return {
    validate() {
      const results = fields.map(input => { touched.add(input); return check(input, true); });
      if (results.some(valid => !valid)) fields.find(input => !input.validity.valid)?.focus();
      return results.every(Boolean);
    },
    reset() {
      touched.clear();
      fields.forEach(input => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); const error=document.getElementById(`${input.id}-error`); if(error){error.textContent='';error.hidden=true;} });
    },
  };
}
