import postgres from 'postgres';
import logger from '../lib/logger.js';

const dbUrl = 'postgresql://postgres:Wanrltwaezakmi171@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

logger.info('Testando conexão via Pooler (us-west-2) com user postgres...');

try {
  const sql = postgres(dbUrl, { connect_timeout: 10 });
  const result = await sql`SELECT 1 as result`;
  logger.info('✅ Conexão via Pooler SUCESSO:', result);
  await sql.end();
} catch (err) {
  logger.error('❌ Conexão via Pooler FALHOU:', err.message);
}
