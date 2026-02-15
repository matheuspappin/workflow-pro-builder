import postgres from 'postgres';
import logger from '../lib/logger.js';

// Formato Transaction Mode do Supabase Pooler
const dbUrl = 'postgresql://postgres.drgibkczwshwjjsdauoj:Wanrltwaezakmi171@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

logger.info('Testando conexão via Pooler (Transaction Mode, porta 6543)...');

try {
  const sql = postgres(dbUrl, { connect_timeout: 15 });
  const result = await sql`SELECT 1 as result`;
  logger.info('✅ Conexão via Pooler SUCESSO:', result);
  await sql.end();
} catch (err) {
  logger.error('❌ Conexão via Pooler FALHOU:', err.message);
}
