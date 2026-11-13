export type EstadoSenal = 'exito' | 'error' | 'cancelacion' | 'progreso';
export interface OpcionesSenal { sonido?: boolean; vibracion?: boolean; volumen?: number; alFallarAudio?: () => void; alFinalizar?: () => void }
export const estadosSenal: readonly EstadoSenal[] = ['exito', 'error', 'cancelacion', 'progreso'];
const rutas: Record<EstadoSenal, string> = { exito: '/audio/material/material-exito.ogg', error: '/audio/material/material-error.ogg', cancelacion: '/audio/material/material-cancelacion.ogg', progreso: '/audio/material/material-progreso.ogg' };
const patrones: Record<EstadoSenal, number[]> = { exito: [90], error: [180, 100, 180, 100, 180], cancelacion: [90, 140, 90], progreso: [45, 155, 45, 155, 45] };
let activo: HTMLAudioElement | undefined;
let limite: ReturnType<typeof setTimeout> | undefined;
let alTerminar: (() => void) | undefined;
export function esEstadoSenal(valor: unknown): valor is EstadoSenal { return typeof valor === 'string' && estadosSenal.includes(valor as EstadoSenal); }
export function detenerSenal(): void {
  if (limite !== undefined) clearTimeout(limite);
  limite = undefined;
  if (activo) { activo.onended = null; activo.onerror = null; activo.pause(); activo.currentTime = 0; activo = undefined; }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') { try { navigator.vibrate(0); } catch { /* Vibración opcional. */ } }
  const finalizar = alTerminar; alTerminar = undefined; finalizar?.();
}
export function ajustarVolumenSenal(volumen: number): void {
  if (activo) activo.volume = Number.isFinite(volumen) ? Math.max(0, Math.min(1, volumen)) : 0;
}
/** Debe llamarse desde una interacción del usuario y acompañarse de texto accesible. */
export function emitirSenal(estado: EstadoSenal, opciones: OpcionesSenal = {}): void {
  detenerSenal();
  if (opciones.vibracion && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') { try { navigator.vibrate(patrones[estado]); } catch { /* Vibración opcional. */ } }
  const volumen = Number.isFinite(opciones.volumen) ? Math.max(0, Math.min(1, opciones.volumen!)) : 0.35;
  if (!opciones.sonido || volumen === 0 || typeof Audio === 'undefined') { opciones.alFinalizar?.(); return; }
  try {
    const audio = new Audio(rutas[estado]); activo = audio; alTerminar = opciones.alFinalizar; audio.volume = volumen;
    const finalizar = () => { if (activo === audio) detenerSenal(); };
    const fallar = () => { if (activo === audio) { try { opciones.alFallarAudio?.(); } finally { finalizar(); } } };
    audio.onended = finalizar; audio.onerror = fallar;
    limite = setTimeout(finalizar, 1900);
    void audio.play().catch(fallar);
  } catch { try { opciones.alFallarAudio?.(); } finally { if (activo) detenerSenal(); else opciones.alFinalizar?.(); } }
}
