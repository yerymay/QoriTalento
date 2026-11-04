import { readFile } from 'node:fs/promises';
import type { RowDataPacket } from 'mysql2/promise';
import { getMysqlPool } from '../src/shared/mysql.js';
const pool = getMysqlPool();
try {
  const [rows] = await pool.execute<RowDataPacket[]>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='jobs' AND COLUMN_NAME IN ('area','location')");
  if (rows.length === 2) console.log('M02: campos descriptivos ya disponibles; no se ejecutó ALTER.');
  else if (rows.length !== 0) throw new Error('PARTIAL_MIGRATION');
  else {
    const script = await readFile(new URL('../../database/03_job_details.sql', import.meta.url), 'utf8');
    // Se aplica en la base configurada, sin cambiar de base por la sentencia USE del archivo.
    for (const statement of script.replace(/^--.*$/gm, '').split(';').map(value => value.trim()).filter(value => value && !/^USE\s/i.test(value))) await pool.query(statement);
    console.log('M02: migración de área y ubicación aplicada.');
  }
} catch (error) {
  console.error('No se pudo aplicar M02. Comprueba conexión, permiso ALTER y que la migración no esté parcial.');
  console.error('Código:', (error as {code?: string}).code ?? 'MIGRATION_NOT_APPLIED');
  process.exitCode = 1;
} finally { await pool.end(); }
