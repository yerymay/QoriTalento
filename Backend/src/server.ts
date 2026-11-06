import { MySqlPostulacionesRepository } from './modules/postulaciones/persistence/mysql-postulaciones.repository.js';
import { MySqlOfertasRepository } from './modules/ofertas/persistence/mysql-ofertas.repository.js';
import { MySqlAuthRepository } from './modules/auth/persistence/mysql-auth.repository.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { getMysqlPool } from './shared/mysql.js';
import { MySqlSystemRepository } from './modules/system/persistence/mysql-system.repository.js';

// Punto de composición: la persistencia IMPLEMENTA el contrato y se inyecta al negocio.
const repo = new MySqlSystemRepository(getMysqlPool());
createApp(repo, new MySqlAuthRepository(getMysqlPool()), new MySqlOfertasRepository(getMysqlPool()), new MySqlPostulacionesRepository(getMysqlPool())).listen(env.port, '127.0.0.1', () => {
  console.log(`Qori Talento API disponible localmente en http://127.0.0.1:${env.port}`);
});
