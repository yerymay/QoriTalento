import { emitirSenal, detenerSenal, ajustarVolumenSenal, type EstadoSenal } from './senal-multimodal';

const clave = 'qori-login-sonido';
export function sonidoHabilitado(): boolean {
  try { return localStorage.getItem(clave) !== 'false'; } catch { return true; }
}
export function configurarSonido(habilitado: boolean): void {
  if (!habilitado) detenerSenal();
  try { localStorage.setItem(clave, String(habilitado)); } catch { /* Almacenamiento opcional. */ }
}
export function vibracionHabilitada(): boolean {
  try { return localStorage.getItem('qori-vibracion') === 'true'; } catch { return false; }
}
export function configurarVibracion(habilitado: boolean): void {
  if (!habilitado) detenerSenal();
  try { localStorage.setItem('qori-vibracion', String(habilitado)); } catch { /* Almacenamiento opcional. */ }
}
export function volumenSenal(): number {
  try {
    const guardado = localStorage.getItem('qori-volumen');
    if (guardado !== null && guardado.trim() !== '') {
      const valor = Number(guardado);
      if (Number.isFinite(valor)) return Math.max(0, Math.min(1, valor));
    }
  } catch { /* Almacenamiento opcional. */ }
  return 0.35;
}
export function configurarVolumen(valor: number): void {
  if (!Number.isFinite(valor)) return;
  const volumen = Math.max(0, Math.min(1, valor));
  ajustarVolumenSenal(volumen);
  try { localStorage.setItem('qori-volumen', String(volumen)); } catch { /* Almacenamiento opcional. */ }
}
export function senalDeAccion(estado: EstadoSenal): void {
  emitirSenal(estado, { sonido: sonidoHabilitado(), vibracion: vibracionHabilitada(), volumen: volumenSenal() });
}
