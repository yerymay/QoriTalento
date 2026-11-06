// CV sintético: nunca contiene datos de postulantes reales.
export function makePdf(pages: Array<Array<{ text: string; x?: number; y?: number }>>): Buffer {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const kids: string[] = [];
  for (const lines of pages) {
    const pageId = objects.length + 1, streamId = pageId + 1;
    kids.push(`${pageId} 0 R`);
    const stream = lines.map((l, i) => `BT /F1 12 Tf ${l.x ?? 40} ${l.y ?? 740 - i * 22} Td (${l.text.replace(/([\\()])/g, '\\$1')}) Tj ET`).join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  let result = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(result, 'latin1')); result += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(result, 'latin1');
  result += `xref\n0 ${offsets.length}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(result + `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`, 'latin1');
}
export const sampleLines = ['Nombre: Ana Torres', 'ana@example.test', '+51 987 654 321', 'Ubicación: Abancay, Perú', 'Perfil profesional', 'Desarrolladora de sistemas de información.', 'Formación académica', 'UNAMBA, Ingeniería Informática, 2018 - 2023', 'Experiencia laboral', 'Desarrolladora en Empresa Demo, 2023 - Actualidad', 'Implementación de aplicaciones web.', 'Habilidades: TypeScript, SQL, Git', 'Idiomas: Español nativo, Inglés intermedio'];
export const samplePdf = () => makePdf([sampleLines.map(text => ({ text }))]);
