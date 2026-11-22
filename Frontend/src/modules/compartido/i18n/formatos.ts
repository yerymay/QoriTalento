/** Formatos de presentación para Perú. Las fechas sin hora se conservan como fechas civiles. */
const zona = 'America/Lima';

function fechaValida(valor: string | Date): Date | null {
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(ano, mes - 1, dia));
    if (fecha.getUTCFullYear() !== ano || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
    return fecha;
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFecha(valor: string | Date): string {
  const fecha = fechaValida(valor);
  if (!fecha) return '';
  const civil = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor);
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: civil ? 'UTC' : zona
  }).format(fecha);
}

export function formatearHora(valor: string | Date, formato: 12 | 24 = 24): string {
  const fecha = fechaValida(valor);
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit', minute: '2-digit', hour12: formato === 12, timeZone: zona
  }).format(fecha);
}

export function formatearMoneda(valor: number): string {
  if (!Number.isFinite(valor)) return '';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', currencyDisplay: 'narrowSymbol'
  }).format(valor);
}
