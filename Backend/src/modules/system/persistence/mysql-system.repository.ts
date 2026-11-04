import type { Pool } from 'mysql2/promise';
import type { SystemRepository } from '../repositories/system.repository.js';

// Capa 4: única implementación que conoce el almacenamiento SQL.
export class MySqlSystemRepository implements SystemRepository {
  constructor(private readonly pool: Pool) {}

  async checkConnection(): Promise<void> {
    // No entrega datos personales, credenciales ni detalles de esquema.
    await this.pool.query('SELECT 1 AS ok');
  }
}
