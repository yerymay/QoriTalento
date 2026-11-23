// API y reconocimiento simulados: no se graba audio ni se envían datos reales.
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.argv[2]??'http://127.0.0.1:4322';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 class Recognition{static current;start(){Recognition.current=this;this.onstart?.();}abort(){}}
 window.SpeechRecognition=Recognition;
 window.testSpeak=text=>Recognition.current?.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text,confidence:1}],{isFinal:true})]});
 window.testVoiceError=()=>Recognition.current?.onerror?.({error:'not-allowed'});
});
let empty=false,failed=false,slow=false,expired=false;const queries=[];
const job={id:'1',title:'Diseñador de producto',area:'Producto',location:'Abancay',description:'Diseña experiencias accesibles.',requirements:[],status:'PUBLISHED',published_at:'2026-11-22T12:00:00Z',experience_required:null,education_required:null};
const application={id:'7',job_id:'1',title:job.title,status:'PENDING',filename:'CV.pdf',created_at:'2026-11-22T12:00:00Z',submitted_at:null};
await page.route('**/api/v1/**',async route=>{
 const url=new URL(route.request().url()),path=url.pathname.replace('/api/v1/','');
 const send=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path==='me'||path==='auth/session/refresh')return expired?send(401,{error:{code:'SESSION_EXPIRED',message:'Tu sesión terminó.',request_id:'ui'}}):send(200,{user:{id:'1',name:'Ana Torres',email:'ana@example.test',role:'CANDIDATE',account_state:'ACTIVE',kind:null},expires_at:new Date(Date.now()+1800000).toISOString()});
 if(path==='jobs')queries.push(url.searchParams.get('q')??'');
 if(slow)await new Promise(r=>setTimeout(r,600));
 if(path==='jobs'||path==='applications'){
  if(failed)return send(503,{error:{code:'UNAVAILABLE',message:'No se pudo cargar la información. Reintenta.',request_id:'ui'}});
  return send(200,{items:empty?[]:[path==='jobs'?job:application],total:empty?0:1,page:1,page_size:20});
 }
 return send(404,{error:{code:'NOT_FOUND',message:'Ruta no usada',request_id:'ui'}});
});
try{
 await page.goto(base+'/postulante/ofertas');await expect(page.locator('[data-job-list] li')).toHaveCount(1);
 const input=page.locator('#job-search'),mic=page.locator('[data-search-mic]');
 await input.fill('Teclado');await expect.poll(()=>queries.at(-1)).toBe('Teclado');await expect(input).toBeFocused();
 await mic.click();await expect(mic).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>window.testSpeak('buscar diseñador en Lima'));
 await expect(input).toHaveValue('diseñador en Lima');await expect.poll(()=>queries.at(-1)).toBe('diseñador en Lima');
 await expect(mic).toHaveAttribute('aria-pressed','false');await page.locator('[data-voz-deshacer]').click();await expect(input).toHaveValue('Teclado');
 await mic.click();await input.fill('Consulta escrita');await page.evaluate(()=>window.testSpeak('buscar soporte'));
 await expect(page.locator('[data-voz-dialogo]')).toBeVisible();
 await page.locator('[data-voz-dialogo]').getByRole('button',{name:/Teclado:/}).click();await expect(input).toHaveValue('Consulta escrita');
 await mic.click();await page.evaluate(()=>window.testVoiceError());
 await expect(page.locator('[data-voz-estado]')).toContainText('No hay permiso');await expect(mic).toBeDisabled();
 await input.fill('Continúo escribiendo');await expect.poll(()=>queries.at(-1)).toBe('Continúo escribiendo');
 empty=true;await input.fill('Sin coincidencias');await expect(page.locator('[data-job-empty]')).toBeVisible();
 failed=true;await page.reload();await expect(page.locator('[data-job-list-error]')).toBeVisible();
 failed=false;empty=false;await page.locator('[data-job-list-retry]').click();await expect(page.locator('[data-job-list] li')).toHaveCount(1);
 await page.locator('[data-search-mic]').click();const count=queries.length;
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('qori:session-cleared')));
 await page.evaluate(()=>window.testSpeak('buscar no autorizado'));await page.waitForTimeout(450);assert.equal(queries.length,count);
 await page.goto(base+'/postulante/postulaciones');await expect(page.locator('[data-app-list] article')).toHaveCount(1);
 empty=true;await page.reload();await expect(page.locator('[data-app-empty]')).toBeVisible();await expect(page.locator('[data-app-empty] a')).toHaveAttribute('href','/postulante/ofertas');
 failed=true;await page.reload();await expect(page.locator('[data-app-notice]')).toContainText('Reintenta');
 failed=false;empty=false;slow=true;await page.locator('[data-app-retry]').click();await expect(page.locator('[data-app-loading]')).toBeVisible();await expect(page.locator('[data-app-list] article')).toHaveCount(1);slow=false;
 await page.locator('[data-ui-menu-trigger]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('qori:session-cleared')));await expect(page.locator('[data-app-list] article')).toHaveCount(0);await expect(page.locator('[data-card-menu]')).toHaveCount(0);
 expired=true;await page.reload();await expect(page.locator('[data-private]')).toBeHidden();
 assert.deepEqual(errors,[]);console.log('PASS: búsqueda automática/voz/deshacer/conflicto/permiso, teclado, vacío/error/reintento/carga, menú móvil y limpieza de sesión.');
}finally{await browser.close();}
