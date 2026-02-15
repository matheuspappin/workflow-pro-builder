import dns from 'dns';
import logger from '../lib/logger.js';

const domains = [
  'drgibkczwshwjjsdauoj.supabase.co',
  'db.drgibkczwshwjjsdauoj.supabase.co',
  'drgibkczwshwjjsdauoj.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com'
];

domains.forEach(domain => {
  dns.lookup(domain, (err, address) => {
    if (err) logger.error(`${domain}: ❌ ${err.message}`);
    else logger.info(`${domain}: ✅ ${address}`);
  });
});
