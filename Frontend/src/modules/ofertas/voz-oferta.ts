import { sonidoHabilitado, vibracionHabilitada } from '../compartido/preferencias-senal';
import { crearMotorVoz, crearPanelVoz } from '../compartido/entrada-voz';
import { coincidirOpcion, dividirOrdenes, interpretarOferta, normalizar, type CampoLista, type CampoTexto } from '../compartido/voz-comandos';

const VENTANA_MS = 5000; // tiempo en que un clic se considera "a la vez" que la voz
type CampoOferta = CampoTexto | 'work_schedule' | 'responsibilities' | 'other_benefits';
const TEXTO: Record<CampoOferta, { nombre: string; modo: 'reemplazar' | 'agregar' | 'linea' }> = {
  work_schedule: { nombre: 'Jornada', modo: 'reemplazar' },
  responsibilities: { nombre: 'Funciones', modo: 'linea' },
  other_benefits: { nombre: 'Otros beneficios', modo: 'linea' },
  title: { nombre: 'Cargo', modo: 'reemplazar' },
  location: { nombre: 'Ubicación', modo: 'reemplazar' },
  description: { nombre: 'Descripción', modo: 'agregar' },
  requirements: { nombre: 'Requisitos', modo: 'linea' },
  experience_required: { nombre: 'Experiencia requerida', modo: 'agregar' },
  education_required: { nombre: 'Formación académica', modo: 'agregar' },
};
const LISTA: Record<CampoLista, string> = { area: 'Área', modality: 'Modalidad' };
const CAMPOS = Object.keys(TEXTO) as CampoOferta[];
const LISTAS = Object.keys(LISTA) as CampoLista[];

/** Formulario "Nueva oferta" / "Gestionar oferta": completar por voz o por teclado y clic. */
export function initVozOferta() {
  const raiz = document.querySelector<HTMLElement>('[data-voz-panel="oferta"]');
  const form = document.querySelector<HTMLFormElement>('[data-job-form]');
  if (!raiz || !form) return;

  const panel = crearPanelVoz(raiz);
  const microphones=[...form.querySelectorAll<HTMLButtonElement>('[data-field-voice]')];
  const feedback=raiz.querySelector<HTMLElement>('[data-voz-feedback]')!,status=raiz.querySelector<HTMLElement>('[data-voz-estado]')!;
  let voiceEpoch=0;
  let active=false,targeted=false,activeField='',listField:CampoLista|null=null;
  const sync=()=>{
    microphones.forEach(button=>{
      const listening=panel.boton.dataset.escuchando==='true'&&button.dataset.fieldVoice===activeField;
      button.dataset.escuchando=String(listening);button.setAttribute('aria-pressed',String(listening));
      const label=button.title.replace(/^Detener dictado: /,'').replace(/^Dictar /,'');
      button.setAttribute('aria-label',listening?'Detener dictado: '+label:'Dictar '+label);
    });
    feedback.hidden=!status.textContent;
    feedback.dataset.tone=status.dataset.tipo==='error'?'error':status.dataset.tipo==='aviso'?'warning':'info';
  };
  raiz.querySelector<HTMLInputElement>('[data-voz-sonido]')!.checked=sonidoHabilitado();
  raiz.querySelector<HTMLInputElement>('[data-voz-vibracion]')!.checked=vibracionHabilitada();
  new MutationObserver(sync).observe(raiz,{subtree:true,attributes:true,attributeFilter:['data-escuchando','data-tipo'],childList:true});

  const texto = (campo: CampoOferta) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>('#' + campo)!;
  const lista = (campo: CampoLista) => form.querySelector<HTMLSelectElement>('#' + campo)!;
  const opcionesDe = (campo: CampoLista) => Array.from(lista(campo).options).filter(o => o.value).map(o => o.value);
  const etiquetaOpcion = (campo: CampoLista, valor: string) => Array.from(lista(campo).options).find(o => o.value === valor)?.text || 'Sin selección';
  const ocupado = () => !!form.querySelector<HTMLFieldSetElement>('[data-job-fields]')?.disabled;

  let ultimoCampo: CampoOferta | null = null;
  let aplicando = false; // evita tratar como "clic del usuario" los cambios que hace este código
  let foto: Record<string, string> = {};
  const intenciones: Partial<Record<CampoLista, { valor: string; en: number }>> = {};

  form.addEventListener('focusin', evento => {
    const id = (evento.target as HTMLElement).id;
    if ((CAMPOS as string[]).includes(id)) ultimoCampo = id as CampoOferta;
  });

  const tomarFoto = () => {
    foto = { title: texto('title').value, location: texto('location').value, area: lista('area').value, modality: lista('modality').value };
  };
  const enfocarTeclado = () => (ultimoCampo ? texto(ultimoCampo) : texto('title')).focus();

  function ponerTexto(campo: CampoOferta, valor: string) {
    const el = texto(campo);
    el.value = valor;
    el.dispatchEvent(new Event('input', { bubbles: true })); // el formulario recalcula "cambios sin guardar"
  }
  function fijarLista(campo: CampoLista, valor: string) {
    const select = lista(campo);
    const item = select.closest('[data-editor-dropdown]')?.querySelector<HTMLElement>(`[data-editor-dropdown-menu] [data-value="${CSS.escape(valor)}"]`);
    aplicando = true;
    try {
      if (item) item.click(); // mismo camino que un clic real: actualiza etiqueta y estado del menú
      else { select.value = valor; select.dispatchEvent(new Event('change', { bubbles: true })); }
    } finally { aplicando = false; }
  }

  async function aplicarTexto(campo: CampoOferta, dicho: string) {
    const el = texto(campo);
    const { nombre, modo } = TEXTO[campo];
    const actual = el.value;
    const final = modo === 'reemplazar' || !actual.trim() ? dicho : actual.replace(/\s+$/, '') + (modo === 'linea' ? '\n' : ' ') + dicho;
    // Contradicción: en un campo corto, la persona escribió algo distinto mientras hablaba.
    if (modo === 'reemplazar' && campo in foto && actual !== foto[campo] && actual.trim() && normalizar(actual) !== normalizar(dicho)) {
      const eleccion = await panel.preguntar(`¿Qué ${nombre.toLowerCase()} quieres?`, 'Dijiste una cosa por voz y escribiste otra en el mismo campo. Todavía no cambié nada.', [
        { etiqueta: `Voz: “${dicho}”`, valor: 'voz' },
        { etiqueta: `Teclado: “${actual.trim()}”`, valor: 'teclado' },
      ]);
      if (eleccion === null) { panel.responder('No se cambió nada. Tu texto sigue en el formulario.', 'info'); el.focus(); return; }
      if (eleccion === 'teclado') { foto[campo] = actual; panel.responder(`Se conservó lo que escribiste en ${nombre}.`, 'exito'); return; }
    }
    if (el.maxLength > 0 && final.length > el.maxLength) {
      panel.responder(`El texto supera el límite de ${el.maxLength} caracteres en ${nombre}. No se agregó nada.`, 'error');
      el.focus(); return;
    }
    ponerTexto(campo, final);
    if (campo in foto) foto[campo] = final; // lo que la voz ya aplicó deja de contar como "escrito por la persona"
    panel.responder(`${nombre}: ${modo === 'reemplazar' ? 'se escribió' : 'se agregó'} “${dicho}”.`, 'exito');
    panel.ofrecerDeshacer(() => { ponerTexto(campo, actual); if (campo in foto) foto[campo] = actual; });
  }

  async function aplicarLista(campo: CampoLista, dicho: string) {
    const nombre = LISTA[campo];
    const select = lista(campo);
    const opciones = opcionesDe(campo);
    const encontrada = coincidirOpcion(dicho, opciones);
    if (encontrada.tipo === 'ninguna') {
      panel.responder(`No encontré “${dicho}” en ${nombre}. Opciones: ${opciones.join(', ')}.`, 'error');
      select.closest('[data-editor-dropdown]')?.querySelector<HTMLButtonElement>('[data-editor-dropdown-trigger]')?.focus();
      return;
    }
    let valor = '';
    if (encontrada.tipo === 'varias') { // Contradicción dentro de la misma frase: «remoto o híbrido».
      const eleccion = await panel.preguntar(`¿Qué ${nombre.toLowerCase()} quieres?`, 'Mencionaste más de una opción.', encontrada.opciones.map(o => ({ etiqueta: o, valor: o })));
      if (eleccion === null) { panel.responder('No se cambió nada.', 'info'); return; }
      valor = eleccion;
    } else valor = encontrada.opcion;

    const previo = select.value;
    // Contradicción: la persona ya hizo clic en otra opción mientras el micrófono escuchaba.
    if (campo in foto && previo !== foto[campo] && previo !== valor) {
      const eleccion = await panel.preguntar(`¿Qué ${nombre.toLowerCase()} quieres?`, 'Dijiste una opción por voz y tocaste otra. Todavía no apliqué ninguna.', [
        { etiqueta: `Voz: ${valor}`, valor },
        { etiqueta: `Clic: ${etiquetaOpcion(campo, previo)}`, valor: previo },
      ]);
      if (eleccion === null) { panel.responder('No se cambió nada. Se mantuvo tu clic.', 'info'); return; }
      valor = eleccion;
    }
    if (select.value !== valor) fijarLista(campo, valor);
    foto[campo] = valor;
    intenciones[campo] = { valor, en: Date.now() };
    panel.responder(`${nombre}: ${etiquetaOpcion(campo, valor)}.`, 'exito');
    panel.ofrecerDeshacer(() => { delete intenciones[campo]; fijarLista(campo, previo); foto[campo] = previo; });
  }

  // Contradicción inversa: primero habló y justo después hizo clic en otra opción.
  for (const campo of LISTAS) {
    lista(campo).addEventListener('change', async () => {
      if (aplicando) return;
      const intento = intenciones[campo];
      const clic = lista(campo).value;
      if (!intento || Date.now() - intento.en > VENTANA_MS || intento.valor === clic) return;
      delete intenciones[campo];
      fijarLista(campo, intento.valor); // no se ejecuta la opción equivocada hasta que la persona confirme
      const eleccion = await panel.preguntar(`¿Qué ${LISTA[campo].toLowerCase()} quieres?`, 'Dijiste una opción por voz y tocaste otra. No apliqué la que podía estar equivocada.', [
        { etiqueta: `Voz: ${etiquetaOpcion(campo, intento.valor)}`, valor: intento.valor },
        { etiqueta: `Clic: ${etiquetaOpcion(campo, clic)}`, valor: clic },
      ]);
      if (eleccion === null) { panel.responder('Se mantuvo la opción dicha por voz.', 'info'); return; }
      if (eleccion !== intento.valor) fijarLista(campo, eleccion);
      foto[campo] = eleccion;
      panel.responder(`${LISTA[campo]}: ${etiquetaOpcion(campo, eleccion)}.`, 'exito');
    });
  }

  async function procesar(dicho: string) {
    if(!active)return;
    if (ocupado()) { panel.responder('El formulario se está guardando. Intenta de nuevo en un momento.', 'aviso'); return; }
    if(targeted&&activeField){
      // El micrófono pertenece al campo: sus palabras nunca cambian otro campo.
      const literal=dicho.replace(/^(?:escribir|dictar)\s+/i,'').trim();
      if(!literal)return;
      if(listField)await aplicarLista(listField,literal);
      else await aplicarTexto(activeField as CampoOferta,literal);
      return;
    }
    const orden = interpretarOferta(dicho, { area: opcionesDe('area'), modality: opcionesDe('modality') });
    switch (orden.tipo) {
      case 'texto': await aplicarTexto(orden.campo, orden.valor); return;
      case 'lista': await aplicarLista(orden.campo, orden.valor); return;
      case 'dictado': {
        if(listField){await aplicarLista(listField,orden.valor);return;}
        const permitido = ultimoCampo && (targeted || orden.explicito || TEXTO[ultimoCampo].modo !== 'reemplazar');
        if (!ultimoCampo || !permitido) {
          panel.responder(`No reconocí el campo, así que no escribí nada. Empieza con su nombre: “cargo …”, “ubicación …”, “modalidad …”.`, 'error');
          return;
        }
        await aplicarTexto(ultimoCampo, orden.valor); return;
      }
      case 'incompleto': panel.responder(`Escuché “${orden.dicho}”, parece una palabra cortada. No escribí nada. Dila completa, por ejemplo “cargo diseñador de producto”.`, 'error'); return;
      case 'sin-valor': panel.responder('Dijiste el nombre del campo, pero no su contenido. Inténtalo de nuevo.', 'error'); return;
      default: panel.responder('No entendí. Intenta otra vez o escribe en el formulario.', 'error'); enfocarTeclado();
    }
  }

  // Las órdenes se procesan de una en una: si hay una tarjeta de aclaración abierta, la siguiente espera.
  let cola: Promise<void> = Promise.resolve();
  const motor = crearMotorVoz({
    modo: 'continuo',
    alParcial: dicho => panel.mostrarParcial(dicho),
    alEstado: valor => {
      panel.marcarEscuchando(valor);
      if (valor) panel.responder('Escuchando. Dicta el contenido del campo; pulsa de nuevo el micrófono para detener.', 'info');
    },
    alResultado: dicho => {
      if(!active)return;
      const run=voiceEpoch;
      cola = cola.then(async () => {
        if(!active||run!==voiceEpoch)return;
        // Una frase de corrido puede traer varias órdenes: se separan y se aplican una por una.
        const ordenes = targeted ? [dicho] : dividirOrdenes(dicho, { area: opcionesDe('area'), modality: opcionesDe('modality') });
        for (const orden of ordenes) await procesar(orden);
      }).catch(() => undefined);
    },
    alFallo: fallo => {
      const guia = fallo.bloquear ? 'Sigue con el teclado y el mouse.' : fallo.repetido ? 'Si el problema continúa, usa el teclado.' : 'Intenta de nuevo o escribe en el formulario.';
      panel.responder(`${fallo.mensaje} ${guia} Lo que ya llenaste sigue aquí.`, 'error');
      if (fallo.bloquear) panel.bloquearVoz();
      enfocarTeclado(); // el teclado queda activo de inmediato
    },
  });

  panel.alPulsar(() => {
    if(!active||ocupado())return;
    raiz.querySelector<HTMLInputElement>('[data-voz-sonido]')!.checked=sonidoHabilitado();
    raiz.querySelector<HTMLInputElement>('[data-voz-vibracion]')!.checked=vibracionHabilitada();
    if (motor.estaEscuchando()) { motor.detener(); return; }
    tomarFoto();
    motor.iniciar();
  });
  microphones.forEach(button=>button.addEventListener('click',()=>{
    if(!active||ocupado())return;
    const field=button.dataset.fieldVoice!;
    if(motor.estaEscuchando()&&activeField===field){motor.detener();sync();return;}
    if(motor.estaEscuchando())motor.detener();
    activeField=field;targeted=true;listField=LISTAS.includes(field as CampoLista)?field as CampoLista:null;
    if(CAMPOS.includes(field as CampoOferta))ultimoCampo=field as CampoOferta;
    (form.querySelector<HTMLElement>('#'+field)??button).focus();
    panel.boton.click();sync();
  }));
  form.addEventListener('input',()=>{
    if((form.querySelector<HTMLElement>('[data-wizard-step]:not([hidden])')&&!microphones.find(button=>button.dataset.fieldVoice===activeField)?.getClientRects().length)&&motor.estaEscuchando())motor.detener();
  });
  const stopOnSave=new MutationObserver(()=>{if(ocupado())motor.detener();});
  stopOnSave.observe(form.querySelector('[data-job-fields]')!,{attributes:true,attributeFilter:['disabled']});
  const stopOnStep=new MutationObserver(()=>{if(motor.estaEscuchando()&&!microphones.find(button=>button.dataset.fieldVoice===activeField)?.getClientRects().length)motor.detener();});
  form.querySelectorAll('[data-wizard-step]').forEach(step=>stopOnStep.observe(step,{attributes:true,attributeFilter:['hidden']}));
  document.addEventListener('qori:session',()=>{active=true;});
  document.addEventListener('qori:session-cleared',()=>{
    voiceEpoch++;active=false;motor.destruir();ultimoCampo=null;activeField='';listField=null;foto={};for(const key of LISTAS)delete intenciones[key];
    raiz.querySelector<HTMLDialogElement>('dialog')?.close();
    raiz.querySelectorAll('[data-voz-estado],[data-voz-parcial],[data-voz-dialogo-opciones],[data-voz-dialogo-texto]').forEach(el=>el.textContent='');
    raiz.querySelector<HTMLElement>('[data-voz-deshacer]')!.hidden=true;feedback.hidden=true;
  });
  window.addEventListener('pagehide',()=>{motor.destruir();stopOnSave.disconnect();stopOnStep.disconnect();});

}
