import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta carregar .env.local primeiro, depois .env
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env');
} else {
  console.warn('No .env file found');
}

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    const fileName = process.argv[2] || 'migrations/29_create_payments_and_fix_os.sql';
    // If it's schema.sql, it's directly in database/
    let migrationPath = path.join(__dirname, '../database/', fileName);
    
    if (!fs.existsSync(migrationPath)) {
       // Try checking inside migrations/ if not found directly
       migrationPath = path.join(__dirname, '../database/migrations/', fileName);
    }

    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration ${fileName}...`);
    await sql.unsafe(migrationSql);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
