import type { ExamenesService } from './examenes.service.js';
// La fecha límite permanece válida aunque el proceso se reinicie. La primera pasada recupera vencidos.
export function startExamExpiryWorker(service: Pick<ExamenesService, 'expireDue'>, onFailure: () => void) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await service.expireDue(); } catch { onFailure(); } finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), 1000);
  timer.unref();
  return () => clearInterval(timer);
}
