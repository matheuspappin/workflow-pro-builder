# Configuração de Connection Pooling (PgBouncer)

## Por que isso importa

Cada função serverless da Vercel abre uma conexão nova com o Supabase PostgreSQL.
Com 192 rotas de API e picos de tráfego, você pode saturar o `max_connections` do banco
antes de qualquer timeout do Vercel. O sintoma é "504 Gateway Timeout aleatório".

O Supabase inclui PgBouncer **no mesmo projeto**, sem custo adicional.

## Como ativar

### 1. No Supabase Dashboard

1. Acesse **Project Settings → Database → Connection Pooling**
2. Ative "Connection Pooling"
3. Em **Pool Mode**, selecione **Transaction** (correto para serverless — cada request é uma transação)
4. Copie a **Connection string** do pool (porta 6543, não 5432)

### 2. Atualizar variáveis de ambiente

No `.env.local` e nas variáveis da Vercel, adicione:

```env
# String de conexão direta (usar apenas em migrations e scripts CLI)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# String via PgBouncer Transaction Mode (usar em serverless functions)
DATABASE_POOL_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 3. Importante: Incompatibilidades com Transaction Mode

O modo Transaction do PgBouncer **não suporta**:
- `SET LOCAL` e variáveis de sessão
- Prepared statements com nome (o Supabase JS SDK usa unnamed — ok)
- `LISTEN/NOTIFY` (use Supabase Realtime em vez disso)
- `pg_advisory_lock` por sessão

O Supabase JS SDK (`@supabase/supabase-js`) é compatível com Transaction Mode por padrão.

### 4. Verificação

Após ativar, monitore no Supabase Dashboard:
- **Database → Connection Pooler** → "Active Connections" deve ser << `max_connections`
- Tipicamente: 200 funções Vercel → ~10-20 conexões reais no banco via pooling

## Referência

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Transaction Mode](https://www.pgbouncer.org/features.html)
