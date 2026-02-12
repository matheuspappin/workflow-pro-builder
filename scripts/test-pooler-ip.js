import postgres from 'postgres';

// Usando o IP 35.160.209.8 que resolvemos para aws-0-us-west-2.pooler.supabase.com
const dbUrl = 'postgresql://postgres.drgibkczwshwjjsdauoj:Wanrltwaezakmi171@35.160.209.8:6543/postgres?pgbouncer=true';

console.log('Testando conexão via IP do Pooler (35.160.209.8)...');

try {
  const sql = postgres(dbUrl, { connect_timeout: 15 });
  const result = await sql`SELECT 1 as result`;
  console.log('✅ Conexão via IP do Pooler SUCESSO:', result);
  await sql.end();
} catch (err) {
  console.error('❌ Conexão via IP do Pooler FALHOU:', err.message);
}
