import 'dotenv/config';

function integerEnvironment(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Variable ${name} debe ser un puerto válido`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: integerEnvironment('PORT', 3001),
  dbHost: process.env.DB_HOST ?? '127.0.0.1',
  dbPort: integerEnvironment('DB_PORT', 3306),
  dbUser: process.env.DB_USER ?? 'qori_app',
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbName: process.env.DB_NAME ?? 'qori_talento',
};
