import type { RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
const pool = getMysqlPool();
try {
  const [columns] = await pool.execute<RowDataPacket[]>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='jobs' AND COLUMN_NAME='process_finished_at'");
  if (!columns.length) await pool.query('ALTER TABLE jobs ADD COLUMN process_finished_at DATETIME(3) NULL');
  const [tables] = await pool.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cv_private_data'");
  if (!tables.length) await pool.query('CREATE TABLE cv_private_data (cv_document_id BIGINT UNSIGNED PRIMARY KEY, contents MEDIUMBLOB NOT NULL, CONSTRAINT fk_cv_private_document FOREIGN KEY (cv_document_id) REFERENCES cv_documents(id)) ENGINE=InnoDB');
  console.log('M03: estructura privada y fecha de finalización disponibles.');
} catch (error) {
  console.error('No se pudo aplicar M03. Comprueba la conexión y los permisos de migración. Código:', (error as {code?: string}).code ?? 'MIGRATION_NOT_APPLIED');
  process.exitCode = 1;
} finally { await pool.end(); }
