/**
 * Lógica pura (sin DOM) para interpretar lo que la persona dice.
 * Se puede probar con Node sin abrir el navegador.
 */
export type CampoTexto = 'title' | 'location' | 'description' | 'requirements' | 'experience_required' | 'education_required';
export type CampoLista = 'area' | 'modality';

export type OrdenBusqueda =
  | { tipo: 'limpiar' }
  | { tipo: 'buscar'; valor: string }
  | { tipo: 'vacio' };

export type Orden =
  | { tipo: 'texto'; campo: CampoTexto; valor: string }
  | { tipo: 'lista'; campo: CampoLista; valor: string }
  | { tipo: 'dictado'; valor: string; explicito: boolean }
  | { tipo: 'sin-valor'; campo: CampoTexto | CampoLista }
  | { tipo: 'incompleto'; dicho: string }
  | { tipo: 'vacio' };

export type Coincidencia =
  | { tipo: 'una'; opcion: string }
  | { tipo: 'varias'; opciones: string[] }
  | { tipo: 'ninguna' };

/** Minúsculas, sin tildes ni signos; «&» se lee como «y». */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Quita espacios repetidos y la puntuación final que agrega el reconocedor. */
export function limpiarDictado(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().replace(/[.,;:!?¡¿]+$/, '').trim();
}

export function interpretarBusqueda(texto: string): OrdenBusqueda {
  const limpio = limpiarDictado(texto);
  if (!limpio) return { tipo: 'vacio' };
  const n = normalizar(limpio);
  if (/^(limpiar|borrar|quitar|reiniciar) (la |los |mi )?(busqueda|filtros?|todo)$/.test(n)) return { tipo: 'limpiar' };
  const m = limpio.match(/^(?:buscar|busca|busco|encuentra)\s+(.+)$/i);
  let valor = limpiarDictado(m ? m[1] : limpio);
  valor = valor.replace(/^(?:ofertas?|trabajos?|empleos?)(?:\s+(?:de|en|como))?\s+/i, '');
  return valor ? { tipo: 'buscar', valor } : { tipo: 'vacio' };
}

export function coincidirOpcion(dicho: string, opciones: string[]): Coincidencia {
  const nd = normalizar(dicho);
  if (!nd) return { tipo: 'ninguna' };
  const normalizadas = opciones.map(o => ({ o, n: normalizar(o) }));
  const exacta = normalizadas.find(x => x.n === nd);
  if (exacta) return { tipo: 'una', opcion: exacta.o };
  // La frase contiene el nombre de una o más opciones: «remoto o híbrido».
  const contenidas = normalizadas.filter(x => ` ${nd} `.includes(` ${x.n} `));
  if (contenidas.length === 1) return { tipo: 'una', opcion: contenidas[0].o };
  if (contenidas.length > 1) return { tipo: 'varias', opciones: contenidas.map(x => x.o) };
  // Dijo solo una parte: «diseño» para «Producto & Diseño».
  if (nd.length >= 3) {
    const parciales = normalizadas.filter(x => x.n.split(' ').some(p => p === nd || (nd.length >= 4 && p.startsWith(nd))));
    if (parciales.length === 1) return { tipo: 'una', opcion: parciales[0].o };
    if (parciales.length > 1) return { tipo: 'varias', opciones: parciales.map(x => x.o) };
  }
  return { tipo: 'ninguna' };
}

const CLAVES: Array<[string[], CampoTexto | CampoLista]> = [
  [['cargo', 'puesto', 'titulo'], 'title'],
  [['ubicacion', 'ciudad', 'lugar'], 'location'],
  [['descripcion'], 'description'],
  [['requisito', 'requisitos', 'habilidad', 'habilidades'], 'requirements'],
  [['experiencia'], 'experience_required'],
  [['formacion', 'estudios'], 'education_required'],
  [['area'], 'area'],
  [['modalidad'], 'modality'],
];

const LISTAS: readonly string[] = ['area', 'modality'];

export function interpretarOferta(texto: string, opciones: Record<CampoLista, string[]>): Orden {
  const limpio = limpiarDictado(texto);
  if (!limpio) return { tipo: 'vacio' };
  const palabras = limpio.split(' ');
  const primera = normalizar(palabras[0]);

  // «escribir …» obliga a tratar todo lo demás como texto literal del campo activo.
  if (primera === 'escribir' || primera === 'dictar') {
    const valor = limpiarDictado(palabras.slice(1).join(' '));
    return valor ? { tipo: 'dictado', valor, explicito: true } : { tipo: 'vacio' };
  }

  // Un trozo suelto de una palabra clave («car», «ubi», «mod») es un corte del micrófono, no una orden:
  // nunca se escribe en ningún campo.
  if (palabras.length === 1 && primera.length >= 3 && CLAVES.some(([nombres]) => nombres.some(n => n !== primera && n.startsWith(primera)))) {
    return { tipo: 'incompleto', dicho: limpio };
  }

  const clave = CLAVES.find(([nombres]) => nombres.includes(primera));
  if (clave) {
    const campo = clave[1];
    let valor = palabras.slice(1).join(' ').replace(/^(?:es|será|sera|:)\s+/i, '');
    if (campo === 'experience_required') valor = valor.replace(/^requerid[oa]\s+/i, '');
    if (campo === 'education_required') valor = valor.replace(/^(?:acad[eé]mica\s+)/i, '');
    valor = limpiarDictado(valor);
    if (!valor) return { tipo: 'sin-valor', campo };
    return LISTAS.includes(campo)
      ? { tipo: 'lista', campo: campo as CampoLista, valor }
      : { tipo: 'texto', campo: campo as CampoTexto, valor };
  }

  // Decir solo «remoto» o «trabajo híbrido» también cuenta como elegir la modalidad.
  if (palabras.length <= 3 && coincidirOpcion(limpio.replace(/^trabajo\s+/i, ''), opciones.modality).tipo === 'una') {
    return { tipo: 'lista', campo: 'modality', valor: limpio.replace(/^trabajo\s+/i, '') };
  }
  return { tipo: 'dictado', valor: limpio, explicito: false };
}

const FUERTES = ['cargo', 'ubicacion', 'descripcion', 'requisito', 'requisitos', 'modalidad'];

/**
 * Si la persona habla de corrido («cargo diseñador ubicación Lima modalidad remoto…»), el navegador
 * entrega una sola frase. Aquí se corta en cada nombre de campo para tratarlas como órdenes separadas.
 * Las palabras ambiguas («experiencia», «área») solo cortan cuando no hay duda de que son un campo.
 */
export function dividirOrdenes(texto: string, opciones: Record<CampoLista, string[]>): string[] {
  const palabras = limpiarDictado(texto).split(' ').filter(Boolean);
  const cortes: number[] = [0];
  palabras.forEach((palabra, i) => {
    if (i === 0) return;
    const n = normalizar(palabra);
    const siguiente = normalizar(palabras[i + 1] ?? '');
    if (FUERTES.includes(n)) cortes.push(i);
    else if (n === 'experiencia' && siguiente === 'requerida') cortes.push(i);
    else if (n === 'formacion' && siguiente === 'academica') cortes.push(i);
    else if (n === 'area') {
      for (let k = 1; k <= 3; k++) {
        const frase = palabras.slice(i + 1, i + 1 + k).join(' ');
        if (frase && coincidirOpcion(frase, opciones.area).tipo === 'una') { cortes.push(i); break; }
      }
    }
  });
  return cortes
    .map((inicio, j) => palabras.slice(inicio, cortes[j + 1] ?? palabras.length).join(' '))
    .filter(Boolean);
}