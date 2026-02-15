import dns from 'dns';
import logger from '../lib/logger.js';

const domain = 'drgibkczwshwjjsdauoj.supabase.co';

logger.info(`Testando resolução de ${domain}...`);

dns.lookup(domain, (err, address) => {
  if (err) logger.error(err);
  else logger.info(`Sucesso: ${address}`);
});
