export function updateStepper(items: Iterable<HTMLElement>, current: number, base = 0) {
  for (const [index, item] of Array.from(items).entries()) {
    const position = index + base;
    const state = position === current ? 'current' : position < current ? 'complete' : 'pending';
    item.dataset.state = state;
    if (state === 'current') item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    const label = item.querySelector<HTMLElement>('[data-step-state]');
    if (label) label.textContent = state === 'current' ? 'Paso actual' : state === 'complete' ? 'Completado' : 'Pendiente';
  }
}
