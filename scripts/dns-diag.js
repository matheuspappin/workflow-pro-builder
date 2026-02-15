import dns from 'dns';
import logger from '../lib/logger.js';

const domains = [
  'google.com',
  'drgibkczwshwjjsdauoj.supabase.co',
  'db.drgibkczwshwjjsdauoj.supabase.co',
  'aws-0-sa-east-1.pooler.supabase.com'
];

logger.info('Diagnóstico de DNS iniciando...');

const lookups = domains.map(domain => {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address, family) => {
      if (err) {
        logger.error(`❌ Falha ao resolver ${domain}: ${err.message}`);
        resolve({ domain, success: false });
      } else {
        logger.info(`✅ ${domain} resolvido para ${address} (IPv${family})`);
        resolve({ domain, success: true, address });
      }
    });
  });
});

await Promise.all(lookups);
logger.info('Diagnóstico finalizado.');
