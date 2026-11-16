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
  let valorAlIniciar = '';
  let tecleoDuranteVoz = false;
  let escuchando = false;

  // Un evento "de confianza" es una tecla real, no un cambio hecho por el código.
  campo.addEventListener('input', evento => { if (escuchando && evento.isTrusted) tecleoDuranteVoz = true; });

  const poner = (valor: string) => { campo.value = valor; campo.dispatchEvent(new Event('input', { bubbles: true })); };
  const buscar = () => formulario.requestSubmit();

  async function aplicar(dicho: string) {
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
      const eleccion = await panel.preguntar('¿Qué quieres buscar?', 'Dijiste una cosa por voz y escribiste otra. Todavía no busqué nada.', [
        { etiqueta: `Voz: “${orden.valor}”`, valor: 'voz' },
        { etiqueta: `Teclado: “${escrito}”`, valor: 'teclado' },
      ]);
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
    alResultado: texto => { void aplicar(texto); },
    alFallo: fallo => {
      // Degradación grácil: no se borra nada y el teclado queda listo de inmediato.
      const guia = fallo.bloquear ? 'Sigue escribiendo en el buscador.' : fallo.repetido ? 'Si el problema continúa, usa el teclado.' : 'Intenta de nuevo o escribe tu búsqueda.';
      panel.responder(`${fallo.mensaje} ${guia} Lo que ya escribiste sigue aquí.`, 'error');
      if (fallo.bloquear) panel.bloquearVoz();
      campo.focus();
    },
  });

  panel.alPulsar(() => {
    if (motor.estaEscuchando()) { motor.detener(); return; }
    valorAlIniciar = campo.value;
    tecleoDuranteVoz = false;
    motor.iniciar();
  });
}