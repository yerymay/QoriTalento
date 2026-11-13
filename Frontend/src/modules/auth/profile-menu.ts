import { Dropdown } from 'flowbite';

export function initProfileMenu(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-profile-trigger]')!;
  const menu = root.querySelector<HTMLElement>('[data-profile-menu]')!;
  const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"]')];
  const themeButton = root.querySelector<HTMLButtonElement>('[data-theme]')!;
  const themeLabel = menu.querySelector<HTMLElement>('[data-profile-theme-label]')!;
  const updateThemeLabel = () => {
    themeLabel.textContent = document.documentElement.classList.contains('dark') ? 'Activar modo claro' : 'Activar modo oscuro';
  };
  const dropdown = new Dropdown(menu, trigger, {
    placement: 'bottom-end',
    onShow: () => { trigger.setAttribute('aria-expanded', 'true'); updateThemeLabel(); items[0]?.focus(); },
    onHide: () => trigger.setAttribute('aria-expanded', 'false'),
  });
  const close = (restoreFocus = false) => {
    if (dropdown.isVisible()) dropdown.hide();
    if (restoreFocus && !trigger.disabled) trigger.focus();
  };
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!dropdown.isVisible()) dropdown.show();
      (event.key === 'ArrowUp' ? items[items.length - 1] : items[0])?.focus();
    }
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (event.key === 'Tab') { close(); return; }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  });
  menu.querySelector<HTMLButtonElement>('[data-profile-theme]')!.addEventListener('click', () => {
    themeButton.click();
    updateThemeLabel();
    close(true);
  });
  menu.querySelector<HTMLButtonElement>('[data-profile-logout]')!.addEventListener('click', () => close(true));
  return { close };
}
