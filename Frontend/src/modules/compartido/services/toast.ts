export type ToastTone = 'success' | 'error' | 'warning';
type ToastOptions = { title?: string; action?: { label: string; run: () => void } };
const flashKey = 'qori-toast';
const removers = new Map<HTMLElement, () => void>();
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
};

/** Los avisos ocupan espacio debajo de la cabecera: nunca flotan sobre controles. */
export function initToast() {
  const region = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!region || region.dataset.ready) return;
  region.dataset.ready = 'true';
  document.addEventListener('qori:session-cleared', () => { for(const remove of [...removers.values()]) remove(); });
  const header = document.querySelector<HTMLElement>('[data-workspace] > .min-w-0 > header, [data-ui-topbar], body > header');
  if (header) {
    header.after(region);
    const resize = new ResizeObserver(() => region.style.setProperty('--ui-toast-offset', header.offsetHeight + 'px'));
    resize.observe(header);
  } else document.body.prepend(region);
  try {
    const value = sessionStorage.getItem(flashKey);
    sessionStorage.removeItem(flashKey);
    const pending = value ? JSON.parse(value) : null;
    if (pending && typeof pending.message === 'string' && ['success', 'error', 'warning'].includes(pending.tone)) showToast(pending.message, pending.tone);
  } catch { /* El almacenamiento de avisos es opcional. */ }
}

export function showToast(message: string, tone: ToastTone, options: ToastOptions = {}) {
  initToast();
  const region = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!region) return;
  while (region.children.length >= 3) removers.get(region.firstElementChild as HTMLElement)?.();
  const previousFocus = document.activeElement;
  const toast = node('div', 'ui-toast');
  toast.dataset.tone = tone;
  const icon = node('span', 'ui-toast-icon');
  icon.setAttribute('aria-hidden', 'true');
  const copy = node('div', 'min-w-0');
  copy.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  copy.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
  copy.setAttribute('aria-atomic', 'true');
  const title = options.title ?? (tone === 'success' ? 'Acción completada' : tone === 'error' ? 'No se pudo completar' : 'Revisa esta información');
  const heading = node('strong', 'block', title);
  const detail = node('p', 'ui-toast-detail mt-1 text-sm', message);
  detail.title = message;
  const close = node('button', 'ui-button ui-button--icon');
  close.type = 'button';
  close.setAttribute('aria-label', 'Cerrar notificación: ' + title);
  close.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
  toast.append(icon, copy, close);
  region.append(toast);
  // Insertar el texto después de montar la región permite anunciar cada aviso.
  copy.append(heading, detail);
  let tick: ReturnType<typeof setInterval> | undefined;
  const remove = () => { const restore=toast.contains(document.activeElement); if (tick) clearInterval(tick); removers.delete(toast); toast.remove(); if(restore && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({preventScroll:true}); };
  removers.set(toast, remove);
  close.addEventListener('click', remove);
  if (options.action) {
    const action = options.action;
    const button = node('button', 'ui-button ui-button--secondary mt-2', action.label);
    button.type = 'button';
    button.addEventListener('click', () => { action.run(); remove(); });
    copy.append(button);
  }
  const bounds=region.getBoundingClientRect();
  if(bounds.top < 0 || bounds.bottom > innerHeight) region.scrollIntoView({block:'start',behavior:'instant'});
  if (tone === 'success') {
    const progress = node('progress', '');
    progress.max = 5000; progress.value = 5000; progress.setAttribute('aria-hidden', 'true');
    toast.append(progress);
    let left = 5000, previous = performance.now(), hovered = false;
    toast.addEventListener('mouseenter', () => { hovered = true; });
    toast.addEventListener('mouseleave', () => { hovered = false; });
    tick = setInterval(() => {
      const now = performance.now();
      if (!hovered && !toast.contains(document.activeElement) && !document.hidden) left -= now - previous;
      previous = now;
      progress.value = Math.max(0, left);
      if (left <= 0) remove();
    }, 100);
  }
}
export function queueToast(message: string, tone: ToastTone) {
  try { sessionStorage.setItem(flashKey, JSON.stringify({ message, tone })); } catch { /* El almacenamiento es opcional. */ }
}
