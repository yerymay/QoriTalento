import { Dropdown } from 'flowbite';

export function initRegistrationDropdowns(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-select-dropdown]').forEach(root => {
    const input = root.querySelector<HTMLInputElement>('input[type="hidden"]')!;
    const trigger = root.querySelector<HTMLButtonElement>('[data-dropdown-trigger]')!;
    const menu = root.querySelector<HTMLElement>('[data-dropdown-menu]')!;
    const label = root.querySelector<HTMLElement>('[data-dropdown-label]')!;
    const options = [...menu.querySelectorAll<HTMLButtonElement>('[data-dropdown-value]')];
    const sync = () => {
      const selected = options.find(option => option.dataset.dropdownValue === input.value);
      if (selected) label.textContent = selected.textContent;
      options.forEach(option => option.setAttribute('aria-checked', String(option === selected)));
    };
    const dropdown = new Dropdown(menu, trigger, {
      placement: 'bottom-start',
      onShow: () => {
        trigger.setAttribute('aria-expanded', 'true');
        (options.find(option => option.dataset.dropdownValue === input.value) ?? options[0])?.focus();
      },
      onHide: () => trigger.setAttribute('aria-expanded', 'false'),
    });
    options.forEach(option => option.addEventListener('click', () => {
      input.value = option.dataset.dropdownValue!;
      sync();
      input.dispatchEvent(new Event('change', {bubbles: true}));
      dropdown.hide();
      trigger.focus();
    }));
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        dropdown.show();
        (options.find(option => option.dataset.dropdownValue === input.value) ?? options[0])?.focus();
      }
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dropdown.hide(); trigger.focus(); return; }
      if (event.key === 'Tab') { dropdown.hide(); return; }
      if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next]?.focus();
    });
    sync();
  });
}
