import { Dropdown } from 'flowbite';

function keyboardMenu(trigger: HTMLButtonElement, menu: HTMLElement, dropdown: Dropdown, allItems: HTMLElement[]) {
  const visibleItems = () => allItems.filter(item => !item.hidden);
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!dropdown.isVisible()) dropdown.show();
      const items = visibleItems();
      (event.key === 'ArrowUp' ? items[items.length - 1] : items[0])?.focus();
    }
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dropdown.hide(); trigger.focus(); return; }
    if (event.key === 'Tab') { dropdown.hide(); return; }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const items = visibleItems();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  });
}
function createDropdown(trigger: HTMLButtonElement, menu: HTMLElement, placement: 'bottom-start'|'bottom-end') {
  const items = [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
  const dropdown = new Dropdown(menu, trigger, {
    placement,
    onShow: () => { trigger.setAttribute('aria-expanded', 'true'); items.find(item => !item.hidden)?.focus(); },
    onHide: () => trigger.setAttribute('aria-expanded', 'false'),
  });
  keyboardMenu(trigger, menu, dropdown, items);
  return {dropdown, items};
}
export function initJobStatusFilter(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-status-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-status-menu]');
  const input = root.querySelector<HTMLInputElement>('#job-status-filter');
  const label = root.querySelector<HTMLElement>('[data-status-label]');
  if (!trigger || !menu || !input || !label) return;
  const {dropdown,items} = createDropdown(trigger,menu,'bottom-start');
  const sync = () => {
    const selected = items.find(item => item.dataset.statusValue === input.value);
    label.textContent = selected?.textContent?.trim() ?? 'Todos los estados';
    items.forEach(item => item.setAttribute('aria-checked', String(item === selected)));
  };
  items.forEach(item => item.addEventListener('click', () => {
    input.value = item.dataset.statusValue ?? '';
    sync(); dropdown.hide(); trigger.focus();
  }));
  sync();
  return {reset: () => { input.value = ''; sync(); }};
}
export function initJobActions(trigger: HTMLButtonElement, menu: HTMLElement) {
  const {dropdown} = createDropdown(trigger,menu,'bottom-end');
  return {
    close: () => { if (dropdown.isVisible()) dropdown.hide(); },
    destroy: () => { if (dropdown.isVisible()) dropdown.hide(); dropdown.destroyAndRemoveInstance(); },
  };
}
