import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError } from '../../../shared/errors.js';
import type { CvProfile, Evidence, Extraction, ProfileField } from '../repositories/cv.repository.js';

export interface TextLine { text: string; page: number }
export const EXTRACTOR_VERSION = 'qori-reglas-1.0';
const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const clean = (s: string) => s.replace(/^[\s•●▪◦·–—-]+/, '').replace(/\s+/g, ' ').trim();
const headings: Array<[ProfileField | 'other', RegExp]> = [
  ['education', /^(formacion( academica| profesional)?|educacion|estudios( realizados| superiores)?|education|academic background)$/],
  ['experience', /^(experiencia( laboral| profesional)?|trayectoria( profesional)?|work experience|employment( history)?|professional experience)$/],
  ['skills', /^(habilidades( tecnicas| blandas)?|competencias( tecnicas)?|conocimientos( tecnicos)?|aptitudes|skills|technical skills|tecnologias|herramientas)$/],
  ['languages', /^(idiomas|lenguas|languages)$/],
  ['summary', /^(perfil( profesional)?|resumen( profesional)?|sobre mi|acerca de mi|objetivo( profesional)?|summary|profile|about me)$/],
  ['other', /^(referencias( personales| laborales)?|references|certificaciones|certificados|cursos|proyectos|publicaciones|intereses|datos personales|contacto|contact|personal information)$/],
];

// Preserva las líneas y separa columnas con una franja vertical libre de texto.
// No deduce empleadores ni títulos desde frases ambiguas: conserva cada entrada literal.
export async function readPdfLines(bytes: Buffer): Promise<TextLine[]> {
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, stopAtErrors: true, useSystemFonts: false });
  const lines: TextLine[] = [];
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 40) throw new AppError(400, 'CV_TOO_LONG', 'Usa un CV de hasta 40 páginas.');
    let length = 0;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber), content = await page.getTextContent();
      const items = content.items.filter(item => 'str' in item && item.str.trim()).map(item => {
        if (!('str' in item)) throw new Error('Texto no disponible');
        return { text: item.str, x: item.transform[4] as number, y: item.transform[5] as number, width: item.width, height: item.height };
      });
      const width = page.getViewport({ scale: 1 }).width;
      // Las cabeceras que atraviesan ambas columnas se leen antes del cuerpo.
      let split: number | undefined;
      for (let x = width * .28; x <= width * .65; x += 8) {
        const body = items.filter(i => i.y < page.getViewport({ scale: 1 }).height * .84);
        if (body.filter(i => i.x + i.width < x - 8).length >= 4 && body.filter(i => i.x > x + 8).length >= 4 && !body.some(i => i.x < x + 8 && i.x + i.width > x - 8)) { split = x; break; }
      }
      const groups = split === undefined ? [items] : [items.filter(i => i.x < split! && i.x + i.width > split!), items.filter(i => i.x + i.width <= split!), items.filter(i => i.x >= split!)];
      for (const group of groups) {
        group.sort((a, b) => Math.abs(a.y - b.y) <= 3 ? a.x - b.x : b.y - a.y);
        let y = NaN, text = '';
        const flush = () => { if (text.trim()) { lines.push({ text: clean(text), page: pageNumber }); length += text.length; } text = ''; };
        for (const item of group) {
          if (Math.abs(y - item.y) > 3) flush();
          text += (text ? ' ' : '') + item.text; y = item.y;
        }
        flush();
      }
      page.cleanup();
      if (length > 160_000) throw new AppError(400, 'CV_TOO_LONG', 'El CV contiene demasiado texto. Usa una versión resumida.');
    }
    if (!lines.length) throw new Error('Sin texto');
    return lines;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_PDF', 'El PDF debe abrirse correctamente, no estar protegido y contener texto seleccionable.');
  } finally { await task.destroy(); }
}

export function extractProfile(lines: TextLine[]): Extraction {
  const profile: CvProfile = { name: '', email: '', phone: '', location: '', summary: '', education: [], experience: [], skills: [], languages: [] };
  const evidence: Extraction['evidence'] = {}, warnings: string[] = [];
  const addEvidence = (key: ProfileField, line: TextLine) => { (evidence[key] ??= []).push({ page: line.page, text: line.text } satisfies Evidence); };
  const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];
  const candidates = (key: 'email' | 'phone', pattern: RegExp) => {
    const found = new Map<string, TextLine>();
    for (const line of lines) for (const match of line.text.matchAll(pattern)) {
      const value = match[0].trim().replace(/[.,;]+$/, '');
      if (key === 'phone' && (value.replace(/\D/g, '').length < 9 || /^(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}$/.test(value))) continue;
      found.set(value, line);
    }
    if (found.size === 1) { const [value, line] = [...found][0]!; profile[key] = value; addEvidence(key, line); }
    else if (found.size > 1) warnings.push(`Se encontraron varios ${key === 'email' ? 'correos' : 'teléfonos'}. Elige el de contacto en el formulario.`);
  };
  // Excluye referencias: no atribuir a la persona los contactos de sus referentes.
  const reference = lines.findIndex(l => /^(referencias( personales| laborales)?|references)\s*:?$/i.test(normalize(l.text)));
  const ownLines = reference < 0 ? lines : lines.slice(0, reference);
  const original = lines; lines = ownLines;
  candidates('email', /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+/gi);
  candidates('phone', /(?<!\d)(?:\+\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)[\s.-]*)?\d(?:[\s.-]?\d){8,11}(?!\d)/g);
  for (const line of lines) {
    const name = line.text.match(/^(?:nombre(?:s)?(?: y apellidos)?|nombre completo|full name)\s*:\s*(.+)$/i);
    const location = line.text.match(/^(?:ubicaci[oó]n|direcci[oó]n|domicilio|residencia|ciudad|location|address)\s*:\s*(.+)$/i);
    if (name && !profile.name) { profile.name = clean(name[1]!); addEvidence('name', line); }
    if (location && !profile.location) { profile.location = clean(location[1]!); addEvidence('location', line); }
  }
  if (!profile.name) {
    const line = lines.slice(0, 5).find(l => {
      const s = clean(l.text), n = normalize(s);
      return /^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*){1,5}$/u.test(s)
        && !/curriculum|vitae|ingenier|bachiller|licenciad|desarroll|analista|administr|experiencia|educacion|perfil|contact|universidad|resumen|habilidades|tecnic|developer|engineer/.test(n)
        && !headings.some(([, re]) => re.test(n));
    });
    if (line) { profile.name = line.text; addEvidence('name', line); warnings.push('Verifica el nombre: se obtuvo del encabezado del CV.'); }
  }
  let section: ProfileField | 'other' = 'other';
  const blocks: Partial<Record<ProfileField, TextLine[]>> = {};
  for (const line of lines) {
    const colon = line.text.indexOf(':');
    const label = colon >= 0 ? line.text.slice(0, colon) : line.text;
    const heading = headings.find(([, re]) => re.test(normalize(clean(label))));
    if (heading) { section = heading[0]; if (colon < 0 || !line.text.slice(colon + 1).trim()) continue; }
    if (section === 'other') continue;
    const entry = { ...line, text: heading ? clean(line.text.slice(colon + 1)) : line.text };
    (blocks[section] ??= []).push(entry); addEvidence(section, entry);
  }
  profile.summary = (blocks.summary ?? []).map(l => l.text).join('\n').slice(0, 4000);
  // Bloques literales editables conservan institución/cargo/fechas sin asociaciones inventadas.
  for (const key of ['education', 'experience'] as const) {
    const entries: string[] = [];
    for (const line of blocks[key] ?? []) {
      if (!entries.length || (/\b(?:19|20)\d{2}\b/.test(line.text) && /\b(?:19|20)\d{2}\b/.test(entries[entries.length - 1]!))) entries.push(line.text);
      else entries[entries.length - 1] += '\n' + line.text;
    }
    profile[key] = entries.map(s => s.slice(0, 4000)).slice(0, 30);
  }
  for (const key of ['skills', 'languages'] as const) profile[key] = unique((blocks[key] ?? []).flatMap(l => l.text.split(/[,;|•]/))).slice(0, 80).map(s => s.slice(0, 200));
  const missing = (Object.keys(profile) as ProfileField[]).filter(k => !profile[k].length);
  if (missing.length) warnings.push('Hay campos no detectados. Puedes completarlos o dejarlos vacíos si no corresponden.');
  return { version: EXTRACTOR_VERSION, profile, evidence, warnings, text: original.map(l => `[Página ${l.page}] ${l.text}`).join('\n') };
}

export async function extractPdf(bytes: Buffer): Promise<Extraction> { return extractProfile(await readPdfLines(bytes)); }
