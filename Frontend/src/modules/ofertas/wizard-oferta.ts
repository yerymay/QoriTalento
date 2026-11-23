import type { JobInput } from './ofertas.service';

const titles=['Datos del puesto','Descripción y requisitos','Condiciones','Revisión'];
const help=['Define la información básica de la oportunidad.','Describe el puesto y el perfil que necesita tu equipo.','Añade la jornada y los beneficios que ofrece el puesto.','Revisa los datos de la oferta.'];

export function initWizardOferta(form:HTMLFormElement,read:()=>JobInput) {
  const panels=[...form.querySelectorAll<HTMLElement>('[data-wizard-step]')];
  const indicators=[...form.querySelectorAll<HTMLElement>('[data-wizard-indicator]')];
  const prev=form.querySelector<HTMLButtonElement>('[data-wizard-prev]')!;
  const next=form.querySelector<HTMLButtonElement>('[data-wizard-next]')!;
  const heading=form.querySelector<HTMLElement>('[data-wizard-heading]')!;
  const review=form.querySelector<HTMLElement>('[data-wizard-review]')!;
  const progress=form.querySelector<HTMLProgressElement>('[data-offer-progress]')!;
  let step=0,conditionsReviewed=false,saved=false;
  function sync(){
    const data=read();
    const listValid=(items:string[])=>items.length<=50&&items.every(text=>text.length<=1000);
    const complete=[!!data.title&&data.title.length<=180,!!data.description&&data.description.length<=10000&&data.requirements.length>0&&listValid(data.requirements.map(item=>item.description))&&listValid(data.responsibilities),conditionsReviewed&&listValid(data.benefits)&&(data.work_schedule?.length??0)<=120,saved];
    indicators.forEach((item,index)=>{
      item.dataset.complete=String(complete[index]);
      item.dataset.state=index===step?'current':complete[index]?'complete':'pending';
      if(index===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
      const state=item.querySelector<HTMLElement>('[data-step-state]')!;state.removeAttribute('data-i18n');
      state.textContent=index===step?(complete[index]?'Paso actual, completo':'Paso actual'):complete[index]?'Completado':'Pendiente';
    });
    const count=complete.filter(Boolean).length;progress.value=count;
    form.querySelector('[data-offer-progress-text]')!.textContent=count+' de 4 secciones completas';
  }
  function showReview(){
    const data=read();
    const entries:Array<[string,string]>=[['Cargo',data.title],['Área',data.area??''],['Ubicación',data.location??''],['Modalidad',data.modality??''],['Jornada',data.work_schedule??''],['Descripción del puesto',data.description],['Funciones principales',data.responsibilities.join('\n')],['Requisitos y habilidades',data.requirements.map(item=>item.description).join('\n')],['Experiencia requerida',data.experience_required??''],['Formación académica',data.education_required??''],['Lo que ofrecemos',data.benefits.join('\n')]];
    review.replaceChildren();
    for(const [label,value] of entries){
      const group=document.createElement('div');group.className='min-w-0 border-b border-slate-200 py-3 dark:border-slate-700';
      const term=document.createElement('dt');term.className='font-semibold';term.textContent=label;
      const content=document.createElement('dd');content.className='mt-2 whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-200';content.textContent=value||'No especificado';
      group.append(term,content);review.append(group);
    }
  }
  function show(index:number,focus=false){
    step=Math.max(0,Math.min(3,index));
    panels.forEach(panel=>panel.hidden=Number(panel.dataset.wizardStep)!==step);
    form.querySelector('[data-wizard-title]')!.textContent=titles[step]!;
    form.querySelector('[data-wizard-help]')!.textContent=help[step]!;
    prev.hidden=step===0;next.hidden=step===3;
    const save=form.querySelector<HTMLButtonElement>('[data-save-job]')!;
    save.classList.toggle('ui-button--primary',step===3);save.classList.toggle('ui-button--secondary',step!==3);
    if(step===3)showReview();sync();
    if(focus){heading.focus();heading.scrollIntoView({block:'start',behavior:'instant'});}
  }
  prev.addEventListener('click',()=>show(step-1,true));
  next.addEventListener('click',()=>{
    const cargo=form.querySelector<HTMLInputElement>('[name=title]')!;
    if(step===0&&!cargo.reportValidity()){cargo.focus();return;}
    if(step===2)conditionsReviewed=true;
    show(step+1,true);
  });
  form.addEventListener('input',()=>{saved=false;sync();});
  form.addEventListener('change',()=>{saved=false;sync();});
  form.addEventListener('invalid',event=>{
    const panel=(event.target as HTMLElement).closest<HTMLElement>('[data-wizard-step]');
    if(panel)show(Number(panel.dataset.wizardStep));
  },true);
  show(0);
  return {show,sync,reset:()=>{conditionsReviewed=false;saved=false;review.replaceChildren();show(0);},markSaved:()=>{saved=step===3;sync();}};
}
