export function initMenus(scope:ParentNode=document){
  const cleanups:Array<()=>void>=[];
  scope.querySelectorAll<HTMLElement>('[data-ui-menu]').forEach(root=>{
    if(root.dataset.ready)return;root.dataset.ready='true';
    const controller=new AbortController(),options={signal:controller.signal};
    cleanups.push(()=>{controller.abort();delete root.dataset.ready;});
    const trigger=root.querySelector<HTMLButtonElement>('[data-ui-menu-trigger]')!,popup=root.querySelector<HTMLElement>('[role=menu]')!;
    const items=()=>Array.from(popup.querySelectorAll<HTMLElement>('[role^=menuitem]:not(:disabled):not([aria-disabled=true])')).filter(item=>!item.hidden);
    const close=(focus=false)=>{popup.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();};
    const open=(last=false)=>{popup.hidden=false;popup.style.left='0px';const rect=popup.getBoundingClientRect();if(rect.right>innerWidth-16)popup.style.left=(innerWidth-16-rect.right)+'px';trigger.setAttribute('aria-expanded','true');items().forEach(i=>i.tabIndex=-1);(last?items().at(-1):items()[0])?.focus();};
    trigger.addEventListener('click',()=>popup.hidden?open():close(true),options);
    trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();open(e.key==='ArrowUp');}},options);
    root.addEventListener('keydown',e=>{
      if(popup.hidden)return;const list=items(),index=list.indexOf(document.activeElement as HTMLElement);
      if(e.key==='Escape'){e.preventDefault();close(true);}
      if(e.key==='Tab')close();
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?list.length-1:(index+(e.key==='ArrowDown'?1:-1)+list.length)%list.length;list[next]?.focus();}
    },options);
    popup.addEventListener('click',e=>{if((e.target as HTMLElement).closest('[role^=menuitem]'))close(popup.contains(document.activeElement));},options);
    document.addEventListener('pointerdown',e=>{if(!root.contains(e.target as Node))close();},options);
    root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget as Node|null))close();},options);
  });
  return ()=>cleanups.forEach(cleanup=>cleanup());
}
