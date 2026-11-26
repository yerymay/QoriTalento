import { MySqlSeleccionRepository } from './modules/seleccion/persistence/mysql-seleccion.repository.js';
import { MySqlEvaluacionRepository } from './modules/evaluacion/persistence/mysql-evaluacion.repository.js';
import { OllamaEvaluationAssistant } from './modules/evaluacion/persistence/ollama-evaluation.assistant.js';
import { MySqlExamenesRepository } from './modules/examenes/persistence/mysql-examenes.repository.js';
import { ExamenesService } from './modules/examenes/services/examenes.service.js';
import { startExamExpiryWorker } from './modules/examenes/services/expiry-worker.js';
import { MySqlPostulacionesRepository } from './modules/postulaciones/persistence/mysql-postulaciones.repository.js';
import { MySqlCvRepository } from './modules/cv/persistence/mysql-cv.repository.js';
import { MySqlOfertasRepository } from './modules/ofertas/persistence/mysql-ofertas.repository.js';
import { MySqlAuthRepository } from './modules/auth/persistence/mysql-auth.repository.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { getMysqlPool } from './shared/mysql.js';
import { MySqlSystemRepository } from './modules/system/persistence/mysql-system.repository.js';

// Punto de composición: la persistencia IMPLEMENTA el contrato y se inyecta al negocio.
const repo = new MySqlSystemRepository(getMysqlPool());
const exams = new MySqlExamenesRepository(getMysqlPool());
startExamExpiryWorker(new ExamenesService(exams), () => console.error('No se pudo ejecutar el cierre de exámenes; se reintentará.'));
createApp(repo, new MySqlAuthRepository(getMysqlPool()), new MySqlOfertasRepository(getMysqlPool()), new MySqlPostulacionesRepository(getMysqlPool()), new MySqlCvRepository(getMysqlPool()), exams, new MySqlEvaluacionRepository(getMysqlPool()), new OllamaEvaluationAssistant(), new MySqlSeleccionRepository(getMysqlPool())).listen(env.port, '127.0.0.1', () => {
  console.log(`Qori Talento API disponible localmente en http://127.0.0.1:${env.port}`);
});
