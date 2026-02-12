
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require'
});

async function applyMigration() {
  const migrationFile = path.resolve(__dirname, '../database/migrations/13_fix_rls_policies.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Arquivo de migração não encontrado: ${migrationFile}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

  console.log('🚀 Aplicando migração RLS...');
  
  try {
    // Executa o SQL diretamente
    // Nota: postgres.js não suporta múltiplos comandos em uma única chamada sql`` se não for em transaction block ou script file
    // Vamos usar `sql.file` se possível, ou dividir
    
    // Na verdade, postgres.js tem sql.file(path)
    await sql.file(migrationFile);
    
    console.log('✅ Migração aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
  } finally {
    await sql.end();
  }
}

applyMigration();
