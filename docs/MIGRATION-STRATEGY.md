# Estratégia de Consolidação de Migrations

## Problema Atual

Com 120+ migrations sequenciais, provisionar um banco do zero (novos devs, DR, staging)
executa todas elas em sequência. A partir de ~150 migrations isso começa a demorar >5 min
e torna-se propenso a falhas de estado intermediário.

## Solução: Schema Snapshot

### Quando fazer (critério)

Consolidar a cada 50 migrations ou quando o tempo de provision exceder 3 minutos.

### Como criar o snapshot

```bash
# 1. Gerar o schema atual completo (excluindo dados e funções de seed)
supabase db dump --schema public --no-data > database/schema-snapshot.sql

# 2. Adicionar cabeçalho de controle no topo do arquivo
# -- SNAPSHOT: gerado em <data> após migration <N>
# -- Para ambientes novos: aplicar schema-snapshot.sql + migrations <N+1> em diante

# 3. Atualizar database/README.md para documentar o snapshot atual
```

### Fluxo de provision com snapshot

```bash
# Ambientes novos e DR:
psql $DATABASE_URL -f database/schema-snapshot.sql
# Depois aplica apenas as migrations após o snapshot:
for f in database/migrations/121_*.sql database/migrations/122_*.sql ...; do
  psql $DATABASE_URL -f $f
done

# Ambientes existentes (produção):
# Apenas migrations novas — nunca rodar o snapshot em banco existente
```

### O que o snapshot NÃO substitui

- Migrations são o histórico auditável de mudanças — manter todos os arquivos no git
- O snapshot é apenas um atalho de provision, não um substituto para migrations
- Sempre manter a regra: uma migration por mudança de schema, nunca editar migrations já aplicadas

## Próximo snapshot previsto

Após migration 150 (aproximadamente 30 migrations a partir de agora).

## Referência

- [Supabase CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Schema-only dump](https://www.postgresql.org/docs/current/app-pgdump.html)
