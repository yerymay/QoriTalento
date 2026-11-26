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
const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'astro-dev-toolbar{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important}'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desbordamiento '+name);// Chrome puede omitir glifos en la primera captura fullPage tras cambiar tamaño/tema.
// La segunda captura tras estabilizar el repintado conserva el mismo DOM y CSS.
await page.screenshot({fullPage:true});await page.waitForTimeout(300);await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),fullPage:true});};
const contrast=async()=>{const primary=page.locator('a.ui-button--primary[href="/postulante/ofertas"]');await expect(primary).toHaveCount(1);await expect(primary).toBeVisible();await expect(primary).toHaveText('Explorar oportunidades');return page.evaluate(()=>{
 const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d',{willReadFrequently:true});
 const lum=arr=>arr.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const color=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data);};
 return [...document.querySelectorAll('[data-tracking-root] .tracking-muted,[data-tracking-root] .tracking-badge,[data-tracking-root] .tracking-step,[data-tracking-root] .q-input,a.ui-button--primary[href="/postulante/ofertas"]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>{
  const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);ctx.clearRect(0,0,1,1);ctx.fillStyle='white';ctx.fillRect(0,0,1,1);for(const p of chain){ctx.fillStyle=getComputedStyle(p).backgroundColor;ctx.fillRect(0,0,1,1);}
  const a=lum(Array.from(ctx.getImageData(0,0,1,1).data)),b=lum(color(getComputedStyle(e).color));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });
});};
let minContrast=Infinity;
try{
 await go();await expect(page.locator('[data-app-list] article')).toHaveCount(4);await shot('m08-list-desktop');
 await page.setViewportSize({width:390,height:844});await shot('m08-list-mobile');await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-open="1"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#tracking-detail-title')).toBeFocused();await expect(page.locator('[data-tracking-detail-content]')).toContainText('Historial de mi postulación');
 await expect(page.locator('.tracking-progress [aria-current="step"]')).toContainText('Preselección');
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===1440?1000:844});for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');localStorage.setItem('qori-theme',t);},theme);const ratios=await contrast();minContrast=Math.min(minContrast,...ratios);assert(ratios.every(r=>r>=4.5),'Contraste mínimo');await shot('m08-'+width+'-'+theme);}}
 await page.locator('[data-tracking-close]').click();await expect(page.locator('[data-open="1"]')).toBeFocused();
 await open('3');await expect(page.locator('.tracking-progress [data-visited="false"]')).toHaveCount(2);await expect(page.locator('.tracking-progress [aria-current="step"]')).toContainText('Resultado');await expect(page.getByRole('link',{name:'Reemplazar CV'})).toHaveCount(0);
 await page.locator('[data-tracking-close]').click();await open('2');await expect(page.getByRole('link',{name:'Reemplazar CV'})).toHaveAttribute('href','/postulante/postular?application=2');
 await page.locator('[data-tracking-close]').click();await open('4');await expect(page.locator('[data-tracking-detail-content]')).toContainText('Historial parcial');await expect(page.locator('[data-tracking-detail-content]')).toContainText('No hay una decisión individual final registrada.');
 await page.locator('[data-tracking-close]').click();await page.locator('[data-tracking-search]').fill('Frontend');await expect(page.locator('[data-app-list] article')).toHaveCount(1);await expect(page.locator('[data-app-list]')).toContainText('Desarrollador/a Frontend');
 await page.locator('[data-tracking-search]').fill('No existe');await expect(page.locator('[data-app-empty]')).toBeVisible();await page.locator('[data-tracking-clear]').click();await expect(page.locator('[data-tracking-search]')).toBeFocused();
 await page.locator('[data-tracking-filter]').selectOption('NOT_ADVANCES');await expect(page.locator('[data-app-list] article')).toHaveCount(1);await page.locator('[data-tracking-filter]').selectOption('');
 paged=true;await go();await expect(page.locator('[data-app-list] article')).toHaveCount(20);await page.locator('[data-tracking-next]').click();await expect(page.locator('[data-app-list] article')).toHaveCount(2);await expect(page.locator('[data-tracking-count]')).toContainText('21–22');await page.locator('[data-tracking-prev]').click();await expect(page.locator('[data-app-list] article')).toHaveCount(20);paged=false;
 empty=true;await go();await expect(page.locator('[data-app-empty]')).toBeVisible();empty=false;failList=true;await go();await expect(page.locator('[data-app-notice]')).toContainText('Reintenta');failList=false;slow=true;await page.locator('[data-app-retry]').click();await expect(page.locator('[data-app-list] article')).toHaveCount(4);slow=false;
 await open('1');failList=true;failDetail=true;await page.locator('[data-tracking-refresh]').click();await expect(page.locator('[data-app-notice]')).toContainText('desactualizada');await expect(page.locator('[data-tracking-detail-error]')).toContainText('última consulta correcta');await expect(page.locator('[data-tracking-detail-content]')).toContainText('Preseleccionado');
 failList=false;failDetail=false;await page.locator('[data-app-retry]').click();await expect(page.locator('[data-tracking-detail-error]')).toBeHidden();await expect(page.locator('[data-app-notice]')).toBeHidden();
 await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await expect(page.locator('[data-app-notice]')).toContainText('Sin conexión');await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('[data-app-notice]')).toBeHidden();
 await page.locator('[data-focus="detail-cv"]').focus();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(page.locator('[data-focus="detail-cv"]')).toBeFocused();
 await page.locator('[data-tracking-close]').click();await page.setViewportSize({width:1440,height:1000});
 slowFirst=true;await page.locator('[data-open="1"]').click();await page.locator('[data-open="2"]').click();await expect(page.locator('[data-tracking-detail-content]')).toContainText('Desarrollador/a Frontend');await page.waitForTimeout(800);await expect(page.locator('[data-tracking-detail-content]')).not.toContainText('Diseñador/a de Producto');slowFirst=false;
 await go('?application=999');await expect(page.locator('[data-tracking-detail-error]')).toContainText('no está disponible');await page.locator('[data-tracking-close]').click();await expect(page.locator('[data-tracking-search]')).toBeFocused();
 await go('?application=1');await expect(page.locator('[data-tracking-detail-content]')).toContainText('Preseleccionado');
 const before=listReads;items[0].status='ADVANCES';items[0].final=true;histories['1'].push({status:'ADVANCES',at:'2026-11-25T16:00:00Z'});
 await expect(page.locator('[data-tracking-detail-content]')).toContainText('Decisión registrada',{timeout:35000});assert(listReads>before,'Actualización periódica');
 expired=true;await page.locator('[data-tracking-refresh]').click();await expect(page.locator('[data-private]')).toBeHidden();await expect(page.locator('[data-app-list]')).toBeEmpty();await expect(page.locator('[data-tracking-detail-content]')).toBeEmpty();
 assert.deepEqual(errors,[]);const result={result:'ok',screenshots:6,minContrast,checks:'1440/390 claro/oscuro, teclado/foco, progreso sin etapas inventadas, historial parcial, proceso finalizado sin decisión, filtros, paginación, cinco estados, reintento, desconexión/reconexión, respuestas tardías, actualización periódica de 30 s y limpieza de sesión'};await writeFile(new URL('m08-browser-result.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
