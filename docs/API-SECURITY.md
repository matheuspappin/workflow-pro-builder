# Contrato de Segurança das Rotas API

> Documento de referência para o padrão de segurança multi-tenant do AKAAI CORE.
> Atualizado em: Março 2026

---

## Regras fundamentais

### 1. Toda rota que usa `supabaseAdmin` + `studioId` DEVE chamar `checkStudioAccess`

`supabaseAdmin` ignora RLS. Se uma rota aceita `studioId` do request e usa `supabaseAdmin` sem verificação, qualquer usuário autenticado pode acessar dados de qualquer tenant.

**Padrão obrigatório:**
```ts
const access = await checkStudioAccess(request, studioId)
if (!access.authorized) return access.response
// só aqui usar supabaseAdmin com studioId
```

### 2. Role NUNCA vem do cookie

O cookie `user-role` é apenas cache de redirect no proxy. Nunca use para autorização de dados.

**Fonte correta de role:**
```ts
const { data: { user } } = await supabase.auth.getUser()
const role = user?.user_metadata?.role || user?.app_metadata?.role
```

### 3. Secrets são exclusivos por domínio

| Secret | Uso exclusivo |
|--------|---------------|
| `INTERNAL_AI_SECRET` | Chamadas internas webhook → AI (`X-Internal-AI-Key`) |
| `WEBHOOK_WHATSAPP_SECRET` / `EVOLUTION_WEBHOOK_SECRET` | Validação de webhooks WhatsApp (HMAC) |
| `STRIPE_WEBHOOK_SECRET` | Validação de webhooks Stripe |
| `FISCAL_SERVICE_KEY` | Autenticação no microserviço fiscal PHP |
| `CRON_SECRET` | Autenticação de CRONs Vercel |

---

## Categorias de rotas

### Rotas públicas (sem auth)
- `/api/auth/*` — login, register, verify-email
- `/api/webhooks/*` — validados por assinatura (Stripe HMAC, WhatsApp HMAC)
- `/api/cron/*` — validados por `CRON_SECRET`

### Rotas protegidas por usuário + tenant
- Requerem `checkStudioAccess(request, studioId)` antes de qualquer operação com `supabaseAdmin`
- O `studioId` deve vir do request (query param ou body)
- Sempre filtrar queries com `.eq('studio_id', studioId)`

### Rotas admin
- `/api/admin/*` — exigem usuário autenticado + role `super_admin`
- Verificado via `requireStudioAccessWithValidation` para operações críticas

### Rotas internas (webhook → AI)
- Validadas via `allowInternalAiCall(request)` (header `X-Internal-AI-Key`)
- Requerem `INTERNAL_AI_SECRET` configurado

---

## Auditoria

Rodar periodicamente:
```bash
npx tsx scripts/audit-routes.ts
```

O script sinaliza com `exit 1` se encontrar rotas com `supabaseAdmin` + `studioId` sem `checkStudioAccess`.

Para relatório detalhado em JSON:
```bash
npx tsx scripts/audit-routes.ts --fix-report
```

---

## Variáveis de ambiente obrigatórias em produção

| Variável | Finalidade | Obrigatória em prod |
|----------|-----------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin Supabase (RLS bypass) | Sim |
| `STRIPE_SECRET_KEY` | Stripe API | Se usar Stripe |
| `STRIPE_WEBHOOK_SECRET` | Validar webhooks Stripe | Se usar Stripe |
| `WEBHOOK_WHATSAPP_SECRET` | Validar webhooks WhatsApp | Se usar WhatsApp |
| `INTERNAL_AI_SECRET` | Chamadas internas webhook→AI | Se usar AI via WhatsApp |
| `FISCAL_SERVICE_KEY` | Autenticar no microserviço fiscal | Se usar NF-e |
| `FISCAL_WORKER_URL` | URL do microserviço fiscal | Se usar NF-e |
| `UPSTASH_REDIS_REST_URL` | Rate limit + dedup WhatsApp | Fortemente recomendado |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit + dedup WhatsApp | Fortemente recomendado |
| `CRON_SECRET` | Proteger endpoints CRON | Sim |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | Sim |

---

## Padrão de resposta de erro de autorização

```ts
// 401 — não autenticado
{ error: 'Não autenticado' }

// 402 — subscription expirada / trial encerrado
{ error: 'Sua assinatura expirou ou o estúdio foi desativado.' }
{ error: 'Seu período de teste expirou. Assine um plano para continuar.' }

// 403 — autenticado mas sem acesso ao tenant
{ error: 'Acesso negado a este studio' }

// 404 — studio não existe
{ error: 'Studio não encontrado' }
```

---

## Adicionando um novo nicho (verticalização)

1. Adicionar entrada em `config/verticalizations.ts` com `key`, `basePath`, `subdomains`, `loginPath`, `protectedPaths`, `roleRedirects` e `pathRoles`.
2. Criar as rotas em `app/solutions/<basePath>/`.
3. Certificar que toda rota de API usa `checkStudioAccess`.
4. Rodar `npx tsx scripts/audit-routes.ts` para validar.
