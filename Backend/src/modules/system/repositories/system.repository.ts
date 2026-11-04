// Capa 3: contrato del repositorio. Nunca importar mysql2 aquí.
export interface SystemRepository {
  checkConnection(): Promise<void>;
}
