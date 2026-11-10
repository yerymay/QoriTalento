export type TonoMultimodal = 'exito' | 'advertencia' | 'peligro';
const rutas: Record<TonoMultimodal, string> = {
  exito: '/audio/exito.mp3',
  advertencia: '/audio/advertencia.mp3',
  peligro: '/audio/error.mp3',
};
const audios: Partial<Record<TonoMultimodal, HTMLAudioElement>> = {};
let activo: HTMLAudioElement | undefined;

export function esTono(valor: unknown): valor is TonoMultimodal {
  return valor === 'exito' || valor === 'advertencia' || valor === 'peligro';
}

/** Prepara los archivos durante la interacción, sin reproducirlos. */
export function prepararAudio(): void {
  for (const tono of ['exito', 'advertencia', 'peligro'] as const) {
    if (audios[tono]) continue;
    try {
      const audio = new Audio(rutas[tono]);
      audio.preload = 'auto';
      audio.volume = 0.4;
      audio.load();
      audios[tono] = audio;
    } catch { /* El mensaje visual sigue disponible. */ }
  }
}

/** Quien llama debe mostrar también el resultado visual accesible. */
export function emitirRetroalimentacion(tono: TonoMultimodal, sonido: boolean, vibracion: boolean): void {
  if (vibracion && typeof navigator.vibrate === 'function') {
    const patrones: Record<TonoMultimodal, number | number[]> = { exito: 25, advertencia: [20, 50, 20], peligro: [35, 60, 35] };
    try { navigator.vibrate(patrones[tono]); } catch { /* Soporte opcional. */ }
  }
  if (!sonido) return;
  const audio = audios[tono];
  if (!audio) return;
  try {
    if (activo) { activo.pause(); activo.currentTime = 0; }
    audio.currentTime = 0;
    activo = audio;
    void audio.play().catch(() => {});
  } catch { /* El navegador puede rechazar audio; la operación continúa. */ }
}
