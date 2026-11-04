import { readFile } from 'node:fs/promises';
import { getMysqlPool } from '../src/shared/mysql.js';
const pool=getMysqlPool();
try {
  const script=await readFile(new URL('../../database/02_auth_sessions.sql',import.meta.url),'utf8');
  for(const statement of script.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)) await pool.query(statement);
  console.log('Migración M01 aplicada: auth_sessions disponible.');
} catch (error) { console.error('Codigo:', (error as {code?:string}).code); console.error('No se pudo aplicar la migración. Revisa los permisos de CREATE y la conexión local.');process.exitCode=1; }
finally { await pool.end(); }
