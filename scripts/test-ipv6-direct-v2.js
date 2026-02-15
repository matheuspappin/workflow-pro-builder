import postgres from 'postgres';
import logger from '../lib/logger.js';

logger.info('Testando conexão via IPv6 Direto (host separado)...');

try {
  const sql = postgres({
    host: '2600:1f13:838:6e04:2b6a:47e1:baae:9818',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: 'Wanrltwaezakmi171',
    connect_timeout: 10
  });
  const result = await sql`SELECT 1 as result`;
  logger.info('✅ Conexão via IPv6 SUCESSO:', result);
  await sql.end();
} catch (err) {
  logger.error('❌ Conexão via IPv6 FALHOU:', err.message);
}
