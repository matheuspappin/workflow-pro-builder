# Configuração do Módulo Fiscal (NF-e)

## Variáveis de Ambiente

Adicione ao `.env`:

```env
# Emissor Fiscal NF-e
FISCAL_WORKER_URL=http://localhost:8000
CERT_ENCRYPTION_KEY=<64 caracteres hex>
FISCAL_AMBIENTE=2
```

### Gerar CERT_ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use o script:

```bash
pnpm run fiscal:generate-key
```

### Valores

| Variável | Descrição |
|----------|-----------|
| `FISCAL_WORKER_URL` | URL do microserviço PHP. Em Docker: `http://fiscal-worker:80` |
| `CERT_ENCRYPTION_KEY` | Chave AES-256 (32 bytes em hex) para criptografar certificados |
| `FISCAL_AMBIENTE` | `1` = Produção, `2` = Homologação |

## Migration

Execute a migration 107 no Supabase:

```sql
-- Conteúdo de database/migrations/107_add_fiscal_module.sql
```

## Docker

```bash
docker compose up -d fiscal-worker
```

## Fluxo

1. **Upload**: Configurações → Emissor Fiscal → Upload do .pfx
2. **Emissão**: ERP → Pedidos → Emitir NF-e em lote
3. **Worker**: PHP recebe certificado + dados, assina e transmite à SEFAZ
