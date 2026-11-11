export type ToastTone = 'success' | 'error' | 'warning';
const flashKey = 'qori-toast';
let timer: ReturnType<typeof setTimeout> | undefined;
let exitTimer: ReturnType<typeof setTimeout> | undefined;

function hideToast(toast: HTMLElement) {
  if (timer) clearTimeout(timer);
  if (exitTimer) clearTimeout(exitTimer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { toast.hidden = true; return; }
  toast.dataset.state = 'exit';
  exitTimer = setTimeout(() => { toast.hidden = true; delete toast.dataset.state; }, 180);
}

export function showToast(message: string, tone: ToastTone) {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  const text = toast?.querySelector<HTMLElement>('[data-toast-message]');
  if (!toast || !text) return;
  if (timer) clearTimeout(timer);
  if (exitTimer) clearTimeout(exitTimer);
  delete toast.dataset.state;
  toast.hidden = true;
  toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  toast.querySelectorAll<HTMLElement>('[data-toast-icon]').forEach(icon => {
    icon.hidden = icon.dataset.toastIcon !== tone;
  });
  text.textContent = message;
  toast.hidden = false;
  void toast.offsetWidth;
  toast.dataset.state = 'enter';
  if (tone === 'success') timer = setTimeout(() => hideToast(toast), 7000);
}

export function queueToast(message: string, tone: ToastTone) {
  try { sessionStorage.setItem(flashKey, JSON.stringify({ message, tone })); } catch { /* La sesión funciona sin avisos persistentes. */ }
}

export function initToast() {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  toast?.querySelector<HTMLButtonElement>('[data-toast-close]')?.addEventListener('click', () => {
    hideToast(toast);
  });
  try {
    const value = sessionStorage.getItem(flashKey);
    sessionStorage.removeItem(flashKey);
    if (value) {
      const pending: unknown = JSON.parse(value);
      if (pending && typeof pending === 'object' && 'message' in pending && typeof pending.message === 'string' && 'tone' in pending && (pending.tone === 'success' || pending.tone === 'error' || pending.tone === 'warning')) showToast(pending.message, pending.tone);
    }
  } catch { /* La sesión funciona sin almacenamiento de avisos. */ }
}
