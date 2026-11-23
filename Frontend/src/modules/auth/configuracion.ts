import {configurarTema,configurarContraste,temaActual,type Tema} from '../compartido/apariencia';
export function initConfiguracion(){
 const root=document.querySelector<HTMLElement>('[data-settings]');if(!root)return;
 const links=[...root.querySelectorAll<HTMLAnchorElement>('[data-settings-link]')],panels=[...root.querySelectorAll<HTMLElement>('[data-settings-panel]')];
 const select=()=>{const id=location.hash.slice(1)||'apariencia';const current=panels.some(p=>p.id===id)?id:'apariencia';panels.forEach(panel=>panel.hidden=panel.id!==current);links.forEach(link=>{if(link.hash==='#'+current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});};
 window.addEventListener('hashchange',select);select();
 const themeInputs=root.querySelectorAll<HTMLInputElement>('[name=settings-theme]');
 const contrast=root.querySelector<HTMLInputElement>('[data-config-contrast]')!;
 const sync=()=>{themeInputs.forEach(input=>input.checked=input.value===temaActual());contrast.checked=document.documentElement.dataset.contraste==='alto';};
 sync();document.addEventListener('qori:apariencia',sync);
 themeInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)configurarTema(input.value as Tema);}));
 contrast.addEventListener('change',()=>configurarContraste(contrast.checked));
}
