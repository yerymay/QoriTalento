import es from './es.json';
import en from './en.json';
import qu from './qu.json';

export type Idioma = 'es' | 'en' | 'qu';
const diccionarios: Record<Idioma, Record<string, string>> = { es, en, qu };
const clave = 'qori-idioma';
let actual: Idioma = 'es';

export function idiomaActual(): Idioma {
  try {
    const guardado = localStorage.getItem(clave);
    if (guardado === 'es' || guardado === 'en' || guardado === 'qu') actual = guardado;
  } catch { /* Se conserva la preferencia de la página. */ }
  return actual;
}

export function traducir(claveTexto: string, idioma = idiomaActual()): string {
  return diccionarios[idioma][claveTexto] ?? diccionarios.es[claveTexto] ?? claveTexto;
}

export function aplicarIdioma(): void {
  const idioma = idiomaActual();
  document.documentElement.lang = idioma === 'qu' ? 'qu-PE' : idioma;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(elemento => {
    const claveTexto = elemento.dataset.i18n;
    if (!claveTexto) return;
    const texto = traducir(claveTexto, idioma);
    if (elemento.textContent !== texto) elemento.textContent = texto;
    elemento.lang = diccionarios[idioma][claveTexto] ? idioma : 'es';
  });
  document.querySelectorAll<HTMLSelectElement>('[data-idioma]').forEach(selector => {
    selector.value = idioma;
  });
  for (const atributo of ['aria-label', 'title', 'placeholder', 'alt']) {
    document.querySelectorAll<HTMLElement>(`[data-i18n-${atributo}]`).forEach(elemento => {
      const claveTexto = elemento.getAttribute(`data-i18n-${atributo}`);
      if (claveTexto) elemento.setAttribute(atributo, traducir(claveTexto, idioma));
    });
  }
}

export function configurarIdioma(idioma: Idioma): void {
  actual = idioma;
  try { localStorage.setItem(clave, idioma); } catch { /* Funciona durante la página actual. */ }
  aplicarIdioma();
  document.dispatchEvent(new CustomEvent('qori:idioma', { detail: idioma }));
}

export function iniciarIdiomas(): void {
  aplicarIdioma();
  // Algunos módulos crean vistas después de cargar datos desde la API.
  // Solo se traducen elementos marcados explícitamente, no datos del usuario.
  const observer = new MutationObserver(cambios => {
    if (cambios.some(cambio => Array.from(cambio.addedNodes).some(nodo =>
      nodo instanceof Element && (nodo.matches('[data-i18n], [data-i18n-aria-label], [data-i18n-title], [data-i18n-placeholder], [data-i18n-alt]') || nodo.querySelector('[data-i18n], [data-i18n-aria-label], [data-i18n-title], [data-i18n-placeholder], [data-i18n-alt]'))
    ))) aplicarIdioma();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll<HTMLSelectElement>('[data-idioma]').forEach(selector => {
    selector.addEventListener('change', () => {
      if (selector.value === 'es' || selector.value === 'en' || selector.value === 'qu') configurarIdioma(selector.value);
    });
  });
}
