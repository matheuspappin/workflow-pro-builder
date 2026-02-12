import dns from 'dns';

const domains = [
  'google.com',
  'drgibkczwshwjjsdauoj.supabase.co',
  'db.drgibkczwshwjjsdauoj.supabase.co',
  'aws-0-sa-east-1.pooler.supabase.com'
];

console.log('Diagnóstico de DNS iniciando...');

const lookups = domains.map(domain => {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address, family) => {
      if (err) {
        console.error(`❌ Falha ao resolver ${domain}: ${err.message}`);
        resolve({ domain, success: false });
      } else {
        console.log(`✅ ${domain} resolvido para ${address} (IPv${family})`);
        resolve({ domain, success: true, address });
      }
    });
  });
});

await Promise.all(lookups);
console.log('Diagnóstico finalizado.');
