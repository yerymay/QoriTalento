import { idiomaActual } from '../compartido/i18n';
const english = {
 title:'What people trying it say',region:'Testimonials',carousel:'carousel',of:'of',stars:'out of 5 stars',
 roles:['Recruiter · Company','Candidate','Teacher evaluator','Candidate'],
 texts:['Posting a job and checking each application status now happens in one place.','I could review my résumé information before submitting my application.','The step-by-step flow is clear and easy to follow.','The technical test shows the remaining time throughout.']
};
export function iniciarTestimonios() {
 const root=document.querySelector<HTMLElement>('[data-reviews]');if(!root)return;
 const track=root.querySelector<HTMLElement>('[data-track]')!;
 const original=[...track.querySelectorAll<HTMLElement>('[data-review]')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const clone=original.map(card=>{const copy=card.cloneNode(true) as HTMLElement;copy.setAttribute('aria-hidden','true');copy.setAttribute('inert','');copy.dataset.clone='';return copy;});
 clone.forEach(card=>track.append(card));
 let hover=false,focus=false,visible=false,touching=false,last=0,frame=0,carry=0;
 const running=()=>!reduce.matches&&!hover&&!focus&&!touching&&visible&&!document.hidden;
 const animate=(now:number)=>{
  track.style.scrollSnapType=running()?'none':'x proximity';
  if(running()){
   if(last){const width=original[0]?.offsetWidth??0;const gap=parseFloat(getComputedStyle(track).columnGap)||0;const cycle=(width+gap)*original.length;if(cycle>0){carry+=(now-last)*0.035;const pixels=Math.floor(carry);if(pixels){track.scrollLeft=(track.scrollLeft+pixels)%cycle;carry-=pixels;}}}
   last=now;
  }else {last=0;carry=0;}
  frame=requestAnimationFrame(animate);
 };
 const translate=()=>{
  const en=idiomaActual()==='en';root.lang=en?'en':'es';
  root.setAttribute('aria-label',en?english.region:'Opiniones');root.setAttribute('aria-roledescription',en?english.carousel:'carrusel');track.setAttribute('aria-label',en?english.region:'Opiniones');
  root.querySelector<HTMLElement>('[data-review-text=title]')!.textContent=en?english.title:'Lo que dicen quienes la prueban';
  [...original,...clone].forEach((card,i)=>{const index=i%original.length;card.setAttribute('aria-label',en?(index+1)+' '+english.of+' '+original.length:(index+1)+' de '+original.length);const star=card.querySelector<HTMLElement>('[data-stars]');if(star)star.setAttribute('aria-label',en?star.dataset.stars+' '+english.stars:star.dataset.stars+' de 5 estrellas');const body=card.querySelector<HTMLElement>('[data-review-body]')!,role=card.querySelector<HTMLElement>('[data-review-role]')!;if(!body.dataset.original){body.dataset.original=body.textContent??'';role.dataset.original=role.textContent??'';}body.textContent=en?english.texts[index]!:(body.dataset.original??'');role.textContent=en?english.roles[index]!:(role.dataset.original??'');});
 };
 root.addEventListener('mouseenter',()=>{hover=true;last=0});root.addEventListener('mouseleave',()=>{hover=false;last=0});
 root.addEventListener('focusin',()=>{focus=true;last=0});root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget as Node|null)){focus=false;last=0}});
 track.addEventListener('touchstart',()=>{touching=true;last=0},{passive:true});track.addEventListener('touchend',()=>{touching=false;last=0},{passive:true});track.addEventListener('touchcancel',()=>{touching=false;last=0},{passive:true});
 track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();track.scrollBy({left:(original[0]?.offsetWidth??0)*(e.key==='ArrowRight'?1:-1),behavior:reduce.matches?'instant':'smooth'});}});
 document.addEventListener('visibilitychange',()=>{last=0});document.addEventListener('qori:idioma',translate);reduce.addEventListener('change',()=>{last=0});
 const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);last=0},{threshold:.1}):undefined;
 observer?.observe(root);if(!observer)visible=true;
 window.addEventListener('pagehide',()=>{observer?.disconnect();cancelAnimationFrame(frame)},{once:true});
 translate();frame=requestAnimationFrame(animate);
}
