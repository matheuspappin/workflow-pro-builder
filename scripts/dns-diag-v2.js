import dns from 'dns';

const domains = [
  'drgibkczwshwjjsdauoj.supabase.co',
  'db.drgibkczwshwjjsdauoj.supabase.co',
  'drgibkczwshwjjsdauoj.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com'
];

domains.forEach(domain => {
  dns.lookup(domain, (err, address) => {
    if (err) console.log(`${domain}: ❌ ${err.message}`);
    else console.log(`${domain}: ✅ ${address}`);
  });
});
