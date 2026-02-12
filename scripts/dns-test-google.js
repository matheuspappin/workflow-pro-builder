import dns from 'dns';

const domain = 'db.drgibkczwshwjjsdauoj.supabase.co';
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8']);

console.log(`Testando resolução de ${domain} via 8.8.8.8...`);

resolver.resolve4(domain, (err, addresses) => {
  if (err) {
    console.error(`❌ Falha: ${err.message}`);
  } else {
    console.log(`✅ Sucesso: ${addresses.join(', ')}`);
  }
});
