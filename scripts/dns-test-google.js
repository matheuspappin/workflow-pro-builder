import dns from 'dns';
import logger from '../lib/logger.js';

const domain = 'db.drgibkczwshwjjsdauoj.supabase.co';
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8']);

logger.info(`Testando resolução de ${domain} via 8.8.8.8...`);

resolver.resolve4(domain, (err, addresses) => {
  if (err) {
    logger.error(`❌ Falha: ${err.message}`);
  } else {
    logger.info(`✅ Sucesso: ${addresses.join(', ')}`);
  }
});
