
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require'
});

async function applyMigration() {
  const fileName = process.argv[2] || '13_fix_rls_policies.sql';
  const migrationFile = path.resolve(__dirname, '../database/migrations/', fileName);
  
  if (!fs.existsSync(migrationFile)) {
    logger.error(`❌ Arquivo de migração não encontrado: ${migrationFile}`);
    process.exit(1);
  }

  logger.info(`🚀 Aplicando migração ${fileName}...`);
  
  try {
    // Executa o SQL diretamente
    // Nota: postgres.js não suporta múltiplos comandos em uma única chamada sql`` se não for em transaction block ou script file
    // Vamos usar `sql.file` se possível, ou dividir
    
    // Na verdade, postgres.js tem sql.file(path)
    await sql.file(migrationFile);
    
    logger.info('✅ Migração aplicada com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao aplicar migração:', error);
  } finally {
    await sql.end();
  }
}

applyMigration();
