// API sintética para UI; la integración real M07→M08 se verifica por separado en MariaDB.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:3009',out=new URL('../../.impeccable/review/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let failList=false,failDetail=false,empty=false,expired=false,slow=false,paged=false,slowFirst=false;
const titles=['Diseñador/a de Producto','Desarrollador/a Frontend','Analista de Datos','Asistente de Recursos Humanos'];
const items=titles.map((title,i)=>({id:String(i+1),job_id:String(10+i),title,status:['SHORTLISTED','PENDING','NOT_ADVANCES','IN_REVIEW'][i],job_status:i===3?'CLOSED':'PUBLISHED',registered_at:'2026-11-21T14:30:00Z',process_finished_at:i===3?'2026-11-25T15:00:00Z':null,filename:'CV_Valeria_Quispe.pdf',status_at:i===3?null:i===1?'2026-11-21T14:30:00Z':'2026-11-25T15:00:00Z',final:i===2,can_replace_cv:i===1}));
const histories={
'1':[{status:'IN_REVIEW',at:'2026-11-23T14:30:00Z'},{status:'SHORTLISTED',at:'2026-11-25T15:00:00Z'}],
'2':[],'3':[{status:'NOT_ADVANCES',at:'2026-11-25T15:00:00Z'}],'4':[]};
let listReads=0;
await page.route('**/api/v1/**',async route=>{
 const u=new URL(route.request().url()),path=u.pathname.replace('/api/v1/',''),send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)}),error=(status,message)=>send(status,{error:{code:'FIXTURE',message,request_id:'fixture'}});
 if(expired)return error(401,'Tu sesión terminó.');
 if(path==='me'||path==='auth/session/refresh')return send(200,{user:{id:'1',name:'Valeria Quispe',email:'valeria@example.test',role:'CANDIDATE',kind:null,account_state:'ACTIVE'},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(slow)await new Promise(r=>setTimeout(r,500));
 if(path==='candidate/applications/tracking'){
  listReads++;if(failList)return error(503,'No se pudieron consultar tus postulaciones. Reintenta.');
  const all=paged?Array.from({length:22},(_,i)=>({...items[0],id:String(i+1),title:'Oferta de producto '+(i+1)})):items;
  const filtered=empty?[]:all.filter(a=>a.title.toLowerCase().includes((u.searchParams.get('search')??'').toLowerCase())&&(!u.searchParams.get('status')||a.status===u.searchParams.get('status')));
  const n=Number(u.searchParams.get('page')??1);return send(200,{items:filtered.slice((n-1)*20,n*20),total:filtered.length,page:n,page_size:20,checked_at:new Date().toISOString()});
 }
 const match=path.match(/^candidate\/applications\/(\d+)\/tracking$/);
 if(match){if(failDetail)return error(503,'No se pudo cargar el historial.');const a=items.find(a=>a.id===match[1]);if(!a)return error(404,'La postulación no está disponible para tu cuenta.');
  const data={application:a,history:histories[a.id],history_complete:a.id!=='4',checked_at:new Date().toISOString()};
  if(slowFirst&&a.id==='1')await new Promise(r=>setTimeout(r,700));return send(200,data);
 }
 return error(404,'Ruta no simulada.');
});
const go=async(query='')=>{await page.goto(base+'/postulante/postulaciones'+query,{waitUntil:'domcontentloaded'});await expect(page.locator('[data-private]')).toBeVisible();await expect(page.locator('[data-app-loading]')).toBeHidden();};
const open=async(id)=>{await page.locator('[data-open="'+id+'"]').click();await expect(page.locator('[data-tracking-detail-loading]')).toBeHidden();};
const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'astro-dev-toolbar{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important}'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento '+name);await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),fullPage:true});};
const contrast=async()=>{const primary=page.locator('a.ui-button--primary[href="/postulante/ofertas"]');await expect(primary).toHaveCount(1);await expect(primary).toBeVisible();await expect(primary).toHaveText('Explorar oportunidades');return page.evaluate(()=>{
 const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d',{willReadFrequently:true});
 const lum=arr=>arr.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const color=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data);};
 return [...document.querySelectorAll('[data-tracking-root] .tracking-muted,[data-tracking-root] .tracking-badge,[data-tracking-root] .tracking-step,[data-tracking-root] .q-input,a.ui-button--primary[href="/postulante/ofertas"]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>{
  const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);ctx.clearRect(0,0,1,1);ctx.fillStyle='white';ctx.fillRect(0,0,1,1);for(const p of chain){ctx.fillStyle=getComputedStyle(p).backgroundColor;ctx.fillRect(0,0,1,1);}
  const a=lum(Array.from(ctx.getImageData(0,0,1,1).data)),b=lum(color(getComputedStyle(e).color));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });
});};
try{
await go('?application=1');await expect(page.locator('[data-tracking-detail-content]')).toContainText('Preseleccionado');
await page.setViewportSize({width:390,height:844});
await page.evaluate(()=>document.documentElement.classList.add('dark'));
await contrast();await shot('m08-debug-immediate');
console.log(await page.locator('a.ui-button--primary[href="/postulante/ofertas"]').evaluate(e=>{const s=getComputedStyle(e),r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,html:e.outerHTML,color:s.color,fill:s.webkitTextFillColor,opacity:s.opacity,visibility:s.visibility,textRect:r.getBoundingClientRect().toJSON(),rect:e.getBoundingClientRect().toJSON(),background:s.backgroundColor};}));
await page.waitForTimeout(300);
await shot('m08-debug-settled');
await page.reload();await expect(page.locator('[data-tracking-detail-content]')).toContainText('Preseleccionado');await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.waitForTimeout(300);await shot('m08-debug-reload');
}finally{await browser.close();}
