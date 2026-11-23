export type Tema = 'light' | 'dark' | 'system';

let tema: Tema = 'system';
let contraste: 'high' | 'normal' | null = null;
let iniciado = false;
const mediaTema = () => matchMedia('(prefers-color-scheme: dark)');

export function temaActual(): Tema {
  try {
    const value = localStorage.getItem('qori-theme');
    if (value === 'light' || value === 'dark' || value === 'system') tema = value;
  } catch { /* La preferencia funciona durante esta página. */ }
  return tema;
}

function pintar() {
  const preferencia = temaActual();
  document.documentElement.classList.toggle('dark',
    preferencia === 'dark' || (preferencia === 'system' && mediaTema().matches));
  const alto = contraste === 'high' ||
    (contraste === null && matchMedia('(prefers-contrast: more)').matches);
  if (alto) document.documentElement.dataset.contraste = 'alto';
  else delete document.documentElement.dataset.contraste;
}

export function configurarTema(value: Tema) {
  tema = value;
  try { localStorage.setItem('qori-theme', value); } catch { /* Persistencia opcional. */ }
  pintar();
}

export function configurarContraste(value: boolean) {
  contraste = value ? 'high' : 'normal';
  try { localStorage.setItem('qori-contrast', contraste); } catch { /* Persistencia opcional. */ }
  pintar();
}

function leerContraste() {
  try {
    const value = localStorage.getItem('qori-contrast');
    contraste = value === 'high' || value === 'normal' ? value : null;
  } catch { /* Se conserva la preferencia en memoria. */ }
}

export function iniciarApariencia() {
  if (iniciado) return;
  iniciado = true;
  leerContraste();
  pintar();
  mediaTema().addEventListener('change', pintar);
  matchMedia('(prefers-contrast: more)').addEventListener('change', pintar);
  window.addEventListener('storage', event => {
    if (event.key !== 'qori-theme' && event.key !== 'qori-contrast' && event.key !== null) return;
    tema = 'system';
    leerContraste();
    pintar();
    document.dispatchEvent(new Event('qori:apariencia'));
  });
}
