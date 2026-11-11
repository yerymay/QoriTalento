import { Drawer } from 'flowbite';

export function initSidebar(root: HTMLElement) {
  const aside = root.querySelector<HTMLElement>('#account-sidebar')!;
  const open = root.querySelector<HTMLButtonElement>('[data-menu]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-menu-close]')!;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const drawer = new Drawer(aside, {
    placement: 'left',
    onShow: () => {
      aside.inert = false;
      open.setAttribute('aria-expanded', 'true');
      close.focus();
    },
    onHide: () => {
      open.setAttribute('aria-expanded', 'false');
      aside.inert = !desktop.matches;
      if (desktop.matches) aside.removeAttribute('aria-hidden');
      else open.focus();
    },
  });
  const sync = () => {
    if (desktop.matches && drawer.isVisible()) drawer.hide();
    aside.inert = !desktop.matches && !drawer.isVisible();
    if (aside.inert) aside.setAttribute('aria-hidden', 'true');
    else aside.removeAttribute('aria-hidden');
  };
  open.addEventListener('click', () => drawer.show());
  close.addEventListener('click', () => drawer.hide());
  desktop.addEventListener('change', sync);
  aside.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !drawer.isVisible()) return;
    const items = [...aside.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')].filter(item => item.getClientRects().length > 0);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  sync();
}
