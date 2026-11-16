import { ApiError } from '../compartido/services/api';
export const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const paths = {
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  check: 'm5 12 4 4L19 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5zM12 15v2',
  alert: 'M12 8v5m0 3h.01M12 3 2 21h20L12 3Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
} as const;
export const icon = (name: keyof typeof paths) => '<svg class="ex-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + paths[name] + '"/></svg>';
export function failure(error: unknown, target: HTMLElement) {
  target.textContent = error instanceof Error ? error.message : 'No se pudo completar la acción. Intenta de nuevo.';
  target.dataset.tone = 'error'; target.hidden = false;
  if (error instanceof ApiError && [401,403].includes(error.status)) document.dispatchEvent(new CustomEvent('qori:auth-error', { detail: error }));
}
export function confirmAction(root: HTMLElement, title: string, text: string, action: string): Promise<boolean> {
  const dialog = root.querySelector<HTMLDialogElement>('[data-ex-confirm]')!;
  dialog.querySelector('[data-ex-confirm-title]')!.textContent = title;
  dialog.querySelector('[data-ex-confirm-copy]')!.textContent = text;
  dialog.querySelector('[data-ex-confirm-action]')!.textContent = action;
  dialog.returnValue = 'cancel'; dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true }));
}
