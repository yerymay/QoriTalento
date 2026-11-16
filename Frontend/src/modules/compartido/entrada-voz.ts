import { emitirSenal } from './senal-multimodal';

/* ------------------------------------------------------------------ */
/*  Motor de voz: Web Speech API con degradación grácil                */
/* ------------------------------------------------------------------ */
export type TipoFallo = 'sin-soporte' | 'permiso' | 'sin-microfono' | 'sin-voz' | 'baja-confianza' | 'red' | 'otro';
export interface FalloVoz {
  tipo: TipoFallo;
  mensaje: string;
  /** El micrófono no se puede usar en esta sesión: hay que seguir solo con teclado. */
  bloquear: boolean;
  /** Es el segundo fallo seguido: conviene sugerir el teclado con más énfasis. */
  repetido: boolean;
}
export interface OpcionesMotor {
  idioma?: string;
  /** Confianza mínima (0-1) para aceptar lo que se entendió. */
  umbral?: number;
  /** «una»: se apaga tras la primera frase (buscador). «continuo»: sigue escuchando varias órdenes (formulario). */
  modo?: 'una' | 'continuo';
  /** Milisegundos sin oír nada antes de apagar el micrófono. */
  inactividadMs?: number;
  alResultado: (texto: string, confianza: number) => void;
  /** Texto provisional mientras la persona todavía habla (solo para mostrarlo). */
  alParcial?: (texto: string) => void;
  alEstado: (escuchando: boolean) => void;
  alFallo: (fallo: FalloVoz) => void;
}
export interface MotorVoz {
  iniciar(): void;
  detener(): void;
  estaEscuchando(): boolean;
  destruir(): void;
}

const MENSAJES: Record<Exclude<TipoFallo, 'baja-confianza'>, string> = {
  'sin-soporte': 'Tu navegador no permite dictar por voz.',
  permiso: 'No hay permiso para usar el micrófono. Puedes activarlo en el candado de la barra de direcciones.',
  'sin-microfono': 'No se detecta ningún micrófono.',
  'sin-voz': 'No se oyó nada o hay demasiado ruido.',
  red: 'El servicio de voz no responde. Revisa tu conexión.',
  otro: 'El dictado falló.',
};
const ERRORES: Record<string, Exclude<TipoFallo, 'baja-confianza'>> = {
  'not-allowed': 'permiso', 'service-not-allowed': 'permiso', 'audio-capture': 'sin-microfono',
  network: 'red', 'language-not-supported': 'sin-soporte',
};
const BLOQUEANTES: TipoFallo[] = ['sin-soporte', 'permiso', 'sin-microfono'];

export function crearMotorVoz(opciones: OpcionesMotor): MotorVoz {
  const Reconocedor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  const umbral = opciones.umbral ?? 0.5;
  const inactividadMs = opciones.inactividadMs ?? 20000;
  const unaSola = (opciones.modo ?? 'una') === 'una';
  let reconocedor: any = null;
  let desea = false, anunciado = false, fallosSeguidos = 0, ultimaActividad = 0;
  let vigilante: ReturnType<typeof setInterval> | undefined;
  let reinicios: number[] = [];

  const fallar = (tipo: TipoFallo, mensaje: string) => {
    fallosSeguidos++;
    opciones.alFallo({ tipo, mensaje, bloquear: BLOQUEANTES.includes(tipo), repetido: fallosSeguidos >= 2 });
  };
  const terminar = () => {
    desea = false;
    clearInterval(vigilante); vigilante = undefined;
    const r = reconocedor; reconocedor = null;
    if (r) { r.onstart = r.onresult = r.onerror = r.onend = null; try { r.abort(); } catch { /* ya estaba detenido */ } }
    if (anunciado) { anunciado = false; opciones.alEstado(false); }
  };

  // El navegador corta la escucha por sí solo tras una pausa: mientras la persona no pulse «Detener»,
  // se vuelve a abrir en silencio para que no se pierdan las frases largas.
  const arrancar = () => {
    if (!desea) return;
    const ahora = Date.now();
    reinicios = reinicios.filter(t => ahora - t < 3000); reinicios.push(ahora);
    if (reinicios.length > 6) { fallar('otro', MENSAJES.otro); terminar(); return; }
    try {
      const r = new Reconocedor();
      r.lang = opciones.idioma ?? 'es-PE';
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onstart = () => { ultimaActividad = Date.now(); if (!anunciado) { anunciado = true; opciones.alEstado(true); } };
      r.onresult = (evento: any) => {
        ultimaActividad = Date.now();
        for (let i = evento.resultIndex; i < evento.results.length; i++) {
          const resultado = evento.results[i];
          const texto = String(resultado[0]?.transcript ?? '').trim();
          if (!texto) continue;
          if (!resultado.isFinal) { opciones.alParcial?.(texto); continue; }
          opciones.alParcial?.('');
          // Algunos navegadores devuelven 0 cuando no informan confianza: se trata como desconocida.
          const confianza = typeof resultado[0].confidence === 'number' && resultado[0].confidence > 0 ? resultado[0].confidence : 1;
          if (confianza < umbral) { fallar('baja-confianza', `Escuché “${texto}” pero con poca seguridad.`); continue; }
          fallosSeguidos = 0;
          opciones.alResultado(texto, confianza);
          if (unaSola) { terminar(); return; }
        }
      };
      r.onerror = (evento: any) => {
        if (evento.error === 'aborted' || evento.error === 'no-speech') return; // el silencio lo maneja la inactividad
        const tipo = ERRORES[evento.error] ?? 'otro';
        fallar(tipo, MENSAJES[tipo]);
        terminar();
      };
      r.onend = () => { if (desea) setTimeout(arrancar, 250); };
      reconocedor = r;
      r.start();
    } catch { fallar('otro', MENSAJES.otro); terminar(); }
  };

  return {
    iniciar() {
      if (!Reconocedor) { fallar('sin-soporte', MENSAJES['sin-soporte']); return; }
      if (desea) return;
      desea = true; ultimaActividad = Date.now(); reinicios = [];
      vigilante = setInterval(() => {
        if (desea && Date.now() - ultimaActividad > inactividadMs) { fallar('sin-voz', MENSAJES['sin-voz']); terminar(); }
      }, 1000);
      arrancar();
    },
    detener: terminar,
    estaEscuchando: () => desea,
    destruir: terminar,
  };
}

/* ------------------------------------------------------------------ */
/*  Panel de voz: estado visible, sonido/vibración, deshacer y tarjeta */
/*  de aclaración cuando dos órdenes se contradicen                    */
/* ------------------------------------------------------------------ */
export type TipoRespuesta = 'info' | 'exito' | 'error' | 'aviso';
export interface OpcionAclaracion { etiqueta: string; valor: string }
export interface PanelVoz {
  boton: HTMLButtonElement;
  alPulsar(manejador: () => void): void;
  responder(mensaje: string, tipo?: TipoRespuesta): void;
  preguntar(titulo: string, texto: string, opciones: OpcionAclaracion[]): Promise<string | null>;
  ofrecerDeshacer(accion: () => void): void;
  marcarEscuchando(valor: boolean): void;
  mostrarParcial(texto: string): void;
  bloquearVoz(): void;
}

const SENAL = { exito: 'exito', error: 'error', aviso: 'cancelacion' } as const;

export function crearPanelVoz(raiz: HTMLElement): PanelVoz {
  const q = <T extends HTMLElement>(selector: string) => raiz.querySelector<T>(selector)!;
  const boton = q<HTMLButtonElement>('[data-voz-boton]');
  const estado = q('[data-voz-estado]');
  const deshacer = q<HTMLButtonElement>('[data-voz-deshacer]');
  const sonido = q<HTMLInputElement>('[data-voz-sonido]');
  const vibracion = q<HTMLInputElement>('[data-voz-vibracion]');
  const botonTexto = q('[data-voz-boton-texto]');
  const etiquetaBoton = botonTexto.textContent ?? 'Hablar';
  const parcial = q('[data-voz-parcial]');
  const dialogo = q<HTMLDialogElement>('[data-voz-dialogo]');
  const dialogoTitulo = q('[data-voz-dialogo-titulo]');
  const dialogoTexto = q('[data-voz-dialogo-texto]');
  const dialogoOpciones = q('[data-voz-dialogo-opciones]');
  let bloqueada = false;
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const responder = (mensaje: string, tipo: TipoRespuesta = 'info') => {
    estado.textContent = mensaje;          // respuesta 1: visual (texto + color) y anuncio al lector de pantalla
    estado.dataset.tipo = tipo;
    if (tipo !== 'info') emitirSenal(SENAL[tipo], { sonido: sonido.checked, vibracion: vibracion.checked }); // respuestas 2 y 3: sonido + vibración
  };

  deshacer.hidden = true;

  // Atajo de teclado para quien no puede usar el mouse: Alt + V.
  document.addEventListener('keydown', evento => {
    if (evento.altKey && !evento.ctrlKey && !evento.metaKey && evento.code === 'KeyV') { evento.preventDefault(); boton.click(); }
  });

  return {
    boton,
    alPulsar(manejador) {
      boton.addEventListener('click', () => {
        if (bloqueada) { responder('El dictado no está disponible ahora. Usa el teclado: todo sigue funcionando.', 'aviso'); return; }
        manejador();
      });
    },
    responder,
    preguntar(titulo, texto, opciones) {
      return new Promise(resolver => {
        if (dialogo.open) dialogo.close();
        let elegido: string | null = null;
        dialogoTitulo.textContent = titulo;
        dialogoTexto.textContent = texto;
        dialogoOpciones.replaceChildren(...opciones.map(opcion => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'q-primary w-full text-left'; b.textContent = opcion.etiqueta;
          b.addEventListener('click', () => { elegido = opcion.valor; dialogo.close(); });
          return b;
        }));
        q<HTMLButtonElement>('[data-voz-dialogo-cancelar]').onclick = () => dialogo.close();
        dialogo.addEventListener('close', () => resolver(elegido), { once: true });
        responder('Recibí dos órdenes distintas. Elige una para continuar.', 'aviso');
        dialogo.showModal();
      });
    },
    ofrecerDeshacer(accion) {
      clearTimeout(temporizador);
      deshacer.hidden = false;
      deshacer.onclick = () => { deshacer.hidden = true; clearTimeout(temporizador); accion(); responder('Cambio deshecho.', 'exito'); };
      temporizador = setTimeout(() => { deshacer.hidden = true; }, 15000);
    },
    marcarEscuchando(valor) {
      boton.dataset.escuchando = String(valor);
      botonTexto.textContent = valor ? 'Detener' : etiquetaBoton;
      if (!valor) parcial.textContent = '';
    },
    mostrarParcial(texto) { parcial.textContent = texto ? `Te escucho: “${texto}”` : ''; },
    bloquearVoz() { bloqueada = true; boton.setAttribute('aria-disabled', 'true'); },
  };
}