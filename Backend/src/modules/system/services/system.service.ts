import type { SystemRepository } from '../repositories/system.repository.js';

// Capa 2: servicios reciben un contrato, no una conexión SQL.
export class SystemService {
  constructor(private readonly repository: SystemRepository) {}

  public getHealth() {
    return { status: 'ok', service: 'qori-talento-api' } as const;
  }

  public async getDatabaseStatus() {
    await this.repository.checkConnection();
    return { connected: true } as const;
  }
}
