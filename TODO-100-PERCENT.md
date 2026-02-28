# To-Do para chegar o mais perto possível de 100%

## ✅ Concluído (sessão atual)

1. **Build 100% funcional**
   - Dependências: `@testing-library/jest-dom`, `@types/jest` instalados
   - Register: correção `studioName!` para tipo

2. **Validação Zod em rotas críticas**
   - `lib/schemas/auth.ts`: `loginSchema`, `registerSchema`
   - Login e Register: validação via `safeParse` antes do processamento

3. **checkStudioAccess em rotas agroflowai**
   - engenheiros, laudos, configuracoes, tecnicos, documentos, propriedades/[id]
   - GET, PATCH, POST, DELETE conforme aplicável

4. **Substituir console.\* por logger**
   - fire-protection: internal/vincular, technicians, studio/client-invite-code, customers, engineer/vincular
   - support/tickets, support/tickets/[id], support/tickets/[id]/messages
   - agroflowai/satellite-image, finance/employee-payments
   - dashboard/live-classes (warn)

5. **Rate limiting em login/registro**
   - `lib/rate-limit.ts`: limiter em memória (10 req/min por IP)
   - Login e Register: retorno 429 + header Retry-After quando excedido

## 🟡 Prioridade Média

6. ~~**toast.success/error** – Padronizar: sonner vs useToast~~ ✅ useToast delega para sonner
7. **TODOs/FIXMEs** – Único em app: `lib/actions/appointments.ts` (não crítico)
8. ~~**Tratamento de erros** – Padrão AppError, evitar vazamento de stack traces~~ ✅ verify-phone usa AppError

## 🟢 Prioridade Baixa

9. ~~**Logs sensíveis** – Revisar logger.info que pode vazar emails/IDs~~ ✅ lib/sanitize-logs.ts, auth, ecosystem
10. **Naming** – Padronizar pt vs en em rotas e variáveis
11. **Traduções** – Completar keys EN para todas as seções PT
12. ~~**Rate limit em produção** – Considerar Redis/Upstash para multi-instância~~ ✅ lib/rate-limit.ts com Upstash
    - Variáveis em produção: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Comandos úteis

```bash
# Encontrar erros TypeScript
npm run build

# Encontrar console.log
rg "console\.(log|warn|error)" app/ lib/ --type ts

# Encontrar TODO/FIXME
rg "TODO|FIXME" app/ lib/ --type ts
```

## Estimativa para 100%

- **Build limpo**: ~2–4h (corrigir erros restantes)
- **Segurança**: ~4–8h (Zod, checkStudioAccess, rate limit)
- **Qualidade**: ~2–4h (console→logger, tratamento de erros)
- **Total**: ~8–16h de trabalho focado
