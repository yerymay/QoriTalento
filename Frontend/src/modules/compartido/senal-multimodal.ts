export type EstadoSenal = 'exito' | 'error' | 'cancelacion' | 'progreso';
export interface OpcionesSenal { sonido?: boolean; vibracion?: boolean; volumen?: number; alFallarAudio?: () => void }
export const estadosSenal: readonly EstadoSenal[] = ['exito', 'error', 'cancelacion', 'progreso'];
const rutas: Record<EstadoSenal, string> = { exito: '/audio/material/material-exito.ogg', error: '/audio/material/material-error.ogg', cancelacion: '/audio/material/material-cancelacion.ogg', progreso: '/audio/material/material-progreso.ogg' };
const patrones: Record<EstadoSenal, number[]> = { exito: [90], error: [180, 100, 180, 100, 180], cancelacion: [90, 140, 90], progreso: [45, 155, 45, 155, 45] };
let activo: HTMLAudioElement | undefined;
let limite: ReturnType<typeof setTimeout> | undefined;
export function esEstadoSenal(valor: unknown): valor is EstadoSenal { return typeof valor === 'string' && estadosSenal.includes(valor as EstadoSenal); }
export function detenerSenal(): void {
  if (limite !== undefined) clearTimeout(limite);
  limite = undefined;
  if (activo) { activo.pause(); activo.currentTime = 0; activo = undefined; }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(0);
}
export function ajustarVolumenSenal(volumen: number): void {
  if (activo) activo.volume = Number.isFinite(volumen) ? Math.max(0, Math.min(1, volumen)) : 0;
}
/** Debe llamarse desde una interacción del usuario y acompañarse de texto accesible. */
export function emitirSenal(estado: EstadoSenal, opciones: OpcionesSenal = {}): void {
  detenerSenal();
  if (opciones.vibracion && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(patrones[estado]);
  const volumen = Number.isFinite(opciones.volumen) ? Math.max(0, Math.min(1, opciones.volumen!)) : 0.35;
  if (!opciones.sonido || volumen === 0 || typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(rutas[estado]); activo = audio; audio.volume = volumen;
    void audio.play().catch(() => { if (activo === audio) opciones.alFallarAudio?.(); });
    limite = setTimeout(() => { if (activo === audio) { audio.pause(); audio.currentTime = 0; activo = undefined; } }, 1900);
  } catch { opciones.alFallarAudio?.(); }
}
