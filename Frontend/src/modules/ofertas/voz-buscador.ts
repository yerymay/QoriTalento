import { sonidoHabilitado, vibracionHabilitada } from '../compartido/preferencias-senal';
import { crearMotorVoz, crearPanelVoz } from '../compartido/entrada-voz';
import { interpretarBusqueda, normalizar } from '../compartido/voz-comandos';

/** Buscador de ofertas del postulante: dictar o escribir, con las mismas garantías. */
export function initVozBuscador() {
  const raiz = document.querySelector<HTMLElement>('[data-voz-panel="buscador"]');
  const formularioBase = document.querySelector<HTMLFormElement>('[data-job-search]');
  const campoBase = formularioBase?.querySelector<HTMLInputElement>('#job-search');
  if (!raiz || !formularioBase || !campoBase) return;
  const formulario: HTMLFormElement = formularioBase;
  const campo: HTMLInputElement = campoBase;

  const panel = crearPanelVoz(raiz);
  const mic=formulario.querySelector<HTMLButtonElement>('[data-search-mic]')!;
  const feedback=raiz.querySelector<HTMLElement>('[data-voz-feedback]')!,status=raiz.querySelector<HTMLElement>('[data-voz-estado]')!;
  let active=false,epoch=0;
  const sync=()=>{const listening=panel.boton.dataset.escuchando==='true';mic.disabled=panel.boton.disabled||panel.boton.getAttribute('aria-disabled')==='true';mic.setAttribute('aria-pressed',String(listening));mic.setAttribute('aria-label',listening?'Detener búsqueda por voz':'Buscar por voz');feedback.hidden=!status.textContent;feedback.dataset.tone=status.dataset.tipo==='error'?'error':'info';};
  const observer=new MutationObserver(sync);observer.observe(raiz,{subtree:true,childList:true,attributes:true,attributeFilter:['data-tipo','data-escuchando','disabled','aria-disabled']});
  mic.addEventListener('click',()=>panel.boton.click());

  let valorAlIniciar = '';
  let tecleoDuranteVoz = false;
  let escuchando = false;

  // Un evento "de confianza" es una tecla real, no un cambio hecho por el código.
  campo.addEventListener('input', evento => { if (escuchando && evento.isTrusted) tecleoDuranteVoz = true; });

  const poner = (valor: string) => { campo.value = valor; campo.dispatchEvent(new Event('input', { bubbles: true })); };
  const buscar = () => formulario.requestSubmit();

  async function aplicar(dicho: string) {
    if(!active)return;const run=epoch;
    const orden = interpretarBusqueda(dicho);
    if (orden.tipo === 'vacio') { panel.responder('No entendí qué buscar. Intenta otra vez o escribe.', 'error'); campo.focus(); return; }
    if (orden.tipo === 'limpiar') {
      formulario.querySelector<HTMLButtonElement>('[data-reset-search]')?.click();
      panel.responder('Búsqueda limpiada.', 'exito');
      return;
    }
    const escrito = campo.value.trim();
    // Contradicción: dijo una cosa y, a la vez, escribió otra distinta en el buscador.
    if (tecleoDuranteVoz && escrito && escrito !== valorAlIniciar.trim() && normalizar(escrito) !== normalizar(orden.valor)) {
      const eleccion = await panel.preguntar('¿Qué quieres buscar?', 'Dijiste una cosa por voz y escribiste otra búsqueda. Elige cuál consultar.', [
        { etiqueta: `Voz: “${orden.valor}”`, valor: 'voz' },
        { etiqueta: `Teclado: “${escrito}”`, valor: 'teclado' },
      ]);
      if(!active||run!==epoch)return;
      if (eleccion === null) { panel.responder('No se cambió nada. Tu texto sigue en el buscador.', 'info'); campo.focus(); return; }
      if (eleccion === 'teclado') { panel.responder(`Buscando “${escrito}”.`, 'exito'); buscar(); return; }
    }
    const previo = valorAlIniciar;
    poner(orden.valor);
    panel.responder(`Buscando “${orden.valor}”…`, 'exito');
    panel.ofrecerDeshacer(() => { poner(previo); buscar(); });
    buscar();
  }

  const motor = crearMotorVoz({
    modo: 'una',
    alParcial: texto => panel.mostrarParcial(texto),
    alEstado: valor => {
      escuchando = valor;
      panel.marcarEscuchando(valor);
      if (valor) panel.responder('Escuchando… di, por ejemplo, “buscar diseñador en Lima”.', 'info');
    },
    alResultado: texto => { if(active)void aplicar(texto); },
    alFallo: fallo => {
      // Degradación grácil: no se borra nada y el teclado queda listo de inmediato.
      const guia = fallo.bloquear ? 'Sigue escribiendo en el buscador.' : fallo.repetido ? 'Si el problema continúa, usa el teclado.' : 'Intenta de nuevo o escribe tu búsqueda.';
      panel.responder(`${fallo.mensaje} ${guia} Lo que ya escribiste sigue aquí.`, 'error');
      if (fallo.bloquear) panel.bloquearVoz();
      campo.focus();
    },
  });

  panel.alPulsar(() => {
    if(!active)return;
    raiz.querySelector<HTMLInputElement>('[data-voz-sonido]')!.checked=sonidoHabilitado();
    raiz.querySelector<HTMLInputElement>('[data-voz-vibracion]')!.checked=vibracionHabilitada();
    if (motor.estaEscuchando()) { motor.detener(); return; }
    valorAlIniciar = campo.value;
    tecleoDuranteVoz = false;
    motor.iniciar();
  });
  document.addEventListener('qori:session',()=>{active=true;});
  document.addEventListener('qori:session-cleared',()=>{epoch++;active=false;motor.destruir();raiz.querySelector<HTMLDialogElement>('dialog')?.close();status.textContent='';raiz.querySelector<HTMLElement>('[data-voz-parcial]')!.textContent='';raiz.querySelector<HTMLElement>('[data-voz-deshacer]')!.hidden=true;feedback.hidden=true;});
  window.addEventListener('pagehide',()=>{motor.destruir();observer.disconnect();});

}
