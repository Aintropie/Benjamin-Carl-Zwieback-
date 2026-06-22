import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!sqlHost || !sqlDbName || !user || !password) {
  console.warn("Drizzle-kit config: Environment variables for database are not setting up yet. This is normal during initial container setup.");
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    host: sqlHost || 'localhost',
    user: user || 'postgres',
    password: password || '',
    database: sqlDbName || 'gta_dortmund',
    ssl: false,
  },
  verbose: true,
});
