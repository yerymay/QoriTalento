import mysql, { type Pool } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: Pool | undefined;

export function getMysqlPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
      waitForConnections: true,
      connectionLimit: 5,
      timezone: 'Z',
    });
  }
  return pool;
}
