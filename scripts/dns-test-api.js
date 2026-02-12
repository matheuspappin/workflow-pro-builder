import dns from 'dns';

const domain = 'drgibkczwshwjjsdauoj.supabase.co';

console.log(`Testando resolução de ${domain}...`);

dns.lookup(domain, (err, address) => {
  if (err) console.error(err);
  else console.log(`Sucesso: ${address}`);
});
