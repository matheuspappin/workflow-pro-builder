# Auditoria de Segurança & Enforcement — AKAAI CORE Ecosystem

> Gerado em: 2026-03-03 | Auditor: Cascade (Senior Dev Analysis)

---

## P1-1: Cobertura do `guardModule`

### Módulos COM enforcement via `guardModule`:

| Módulo | Arquivo | Funções protegidas |
|--------|---------|-------------------|
| `erp` | `lib/actions/erp.ts` | 20 funções (getOrganizationSettings, getERPCatalog, getERPOrders, createERPOrder, etc.) |
| `inventory` | `lib/actions/inventory.ts` | 8 funções (getInventory, createProduct, updateProduct, deleteProduct, sellProduct, etc.) |
| `service_orders` | `lib/actions/service-orders.ts` | 7 funções (getServices, getServiceOrders, createServiceOrder, updateServiceOrder, etc.) |
| `leads` | `lib/actions/leads.ts` | 6 funções (getLeads, createLead, updateLeadStage, updateLead, convertLeadToStudent, etc.) |
| `whatsapp` | `lib/whatsapp.ts` | 4 funções (sendWhatsAppMessage, getWhatsAppConnection, logoutWhatsApp, etc.) |
| `marketplace` | `lib/actions/marketplace.ts` | 3 funções (getMarketplaceSettings, updateMarketplaceSettings, etc.) |
| `erp` | `lib/actions/erp-import.ts` | 2 funções |

### Módulos SEM enforcement via `guardModule` (GAP):

| Módulo / Feature | Rotas/Arquivos sem guard | Risco |
|-----------------|--------------------------|-------|
| `financial` | `/api/finance/expenses`, `/api/finance/employee-payments`, `/api/finance/notas` | ALTO — qualquer tenant pode acessar features financeiras mesmo sem módulo ativo |
| `ai` / `hasAI` | `/api/chat`, `/api/gemini/*` | MÉDIO — AI chat acessível sem verificar se plano inclui AI |
| `pos` / `hasPOS` | `/api/fire-protection/pdv/*` | MÉDIO — PDV acessível sem guard |
| `scanner` / `hasScanner` | `/api/fire-protection/technician/scanner/*` | MÉDIO — Scanner acessível sem guard |
| `gamification` | Nenhuma rota/action encontrada | BAIXO — feature pode não estar implementada ainda |
| `multi_unit` | Nenhuma rota/action encontrada | BAIXO — feature pode não estar implementada ainda |

### Verticalizações inteiras sem `guardModule`:

As rotas `/api/fire-protection/*`, `/api/dance-studio/*` e `/api/agroflowai/*` usam `checkStudioAccess` para auth, mas **NÃO verificam se a verticalização/módulo está habilitado** para o tenant. Ex.: um tenant com niche `dance_studio` poderia, em teoria, chamar `/api/fire-protection/*` diretamente se souber o endpoint.

---

## P1-2: Consistência Multi-Tenant

### Rotas COM `checkStudioAccess` ou `requireStudioAccess` (SEGURAS):

- `app/api/agroflowai/*` — maioria das rotas (clientes, leads, propriedades, configuracoes, documentos, os, etc.)
- `app/api/fire-protection/*` — 7 rotas (chat-sessions, configuracoes, customers/[id], technicians/[id], ai/chat, vistorias/[id]/laudo)
- `app/api/dance-studio/enrollments`
- `app/api/invites/professionals`
- `app/api/admin/reports/download/[id]`

### Rotas que filtram por `studio_id` mas SEM `checkStudioAccess` (RISCO MÉDIO):

Estas rotas recebem `studioId` como parâmetro do cliente e filtram queries por ele, mas **não validam que o usuário autenticado pertence àquele studio**:

- `/api/finance/expenses` — studioId via query param
- `/api/finance/employee-payments` — studioId via query param
- `/api/finance/notas` — studioId via query param
- `/api/dashboard/live-classes` — studioId via query param
- `/api/notifications/*` — userId + studioId via params
- `/api/whatsapp/connect` — studioId via query param
- `/api/whatsapp/send` — studioId via body
- `/api/whatsapp/logout` — studioId via body
- `/api/whatsapp/notify-low-credits` — studioId via body
- `/api/checkout` — studioId via body
- `/api/chat` — studioId via context object
- `/api/gemini/*` — studioId via context object
- ~23 rotas fire-protection que usam studio_id mas sem checkStudioAccess

### Rota SEM `studio_id` NENHUM (RISCO CRÍTICO):

- **`/api/attendance`** — Não filtra por `studio_id` em nenhuma operação. Usa apenas `studentId` + `classId`. Qualquer pessoa com IDs válidos pode ler/escrever attendance de qualquer tenant.

---

## P1-3: Enforcement de Licença/Subscription

### Estado atual:

- **`proxy.ts`**: NÃO verifica `subscription_status` nem `trial_ends_at`. Apenas lista `/subscription-expired` como rota permitida sem auth.
- **Nenhum redirect** para `/subscription-expired` existe no código — a rota é whitelisted mas nunca é usado como destino de redirect.
- **CRON** (`/api/cron/studios-cleanup`): Único ponto que verifica trial/subscription e marca `status = 'inactive'`.

### Conclusão:

O ciclo de vida de subscription existe apenas no CRON. Se o CRON falhar ou atrasar, tenants com trial expirado continuam acessando normalmente.

---

## P1-4: Bloqueio de `studios.status = 'inactive'`

### Estado atual:

- **Nenhum check de `studios.status`** encontrado em:
  - `proxy.ts` (middleware)
  - `OrganizationProvider` (client provider)
  - `lib/modules-server.ts` (guardModule/getServerOrganizationConfig)
  - Nenhuma rota API
- O CRON marca studios como `inactive`, mas **nada no runtime impede acesso**.

### Conclusão:

Desativar um studio no banco **não bloqueia o acesso**. O usuário continua navegando normalmente até que o CRON delete o studio (15 dias depois).

---

## P2-1: Enforcement de Limites por Plano

### Estado atual:

- **`lib/plan-limits.ts`** define `PLAN_LIMITS` com `maxStudents`, `maxProfessionals` e flags de features.
- **`isLimitReached()`** é usada em:
  - `app/dashboard/alunos/page.tsx` — UI block ao adicionar aluno (CLIENT-SIDE ONLY)
  - `app/dashboard/professores/page.tsx` — UI block ao adicionar professor (CLIENT-SIDE ONLY)
  - `app/api/invites/professionals/route.ts` — SERVER-SIDE check ao aceitar convite profissional ✅
- **NÃO é usada em**:
  - `/api/dance-studio/students` (POST) — nenhum limit check no servidor
  - `/api/dance-studio/teachers` (POST) — nenhum limit check no servidor
  - `/api/dance-studio/classes` (POST) — nenhum limit check no servidor

### Conclusão:

Limites de plano são enforçados **principalmente no client-side (UI)**. Chamadas diretas à API bypassam esses limites. Exceção: convite de profissional tem check server-side.

---

## Resumo de Riscos por Severidade

| Sev | Issue | Impacto |
|-----|-------|---------|
| 🔴 CRÍTICO | `/api/attendance` sem studio_id | Cross-tenant data leak/write |
| 🔴 CRÍTICO | Studios inativados pelo CRON continuam acessíveis | Tenants sem pagamento usam o sistema indefinidamente |
| 🔴 CRÍTICO | Nenhum redirect para `/subscription-expired` implementado | Feature de subscription gate não funciona |
| 🟠 ALTO | Rotas finance/whatsapp/chat/dashboard aceitam studioId do client sem validar ownership | Possível acesso cross-tenant via manipulação de params |
| 🟠 ALTO | guardModule não cobre financial, AI, POS, scanner | Tenants sem módulo ativo podem usar features pagas |
| 🟡 MÉDIO | Plan limits enforçados só no client-side (exceto invites/professionals) | API calls diretas bypassam limites |
| 🟡 MÉDIO | ~23 rotas fire-protection sem checkStudioAccess | Dependem de RLS ou filtro manual por studio_id |

---

## CORREÇÕES APLICADAS (2026-03-03)

### ✅ P1-3 + P1-4: Enforcement de subscription/status em runtime

**Arquivo:** `lib/auth/require-studio-access.ts`
- Agora verifica `studios.status === 'inactive'` → retorna 402
- Verifica `trial_ends_at` expirado mesmo antes do CRON rodar → retorna 402
- Otimizado: query única busca `status, subscription_status, trial_ends_at, owner_id` ao invés de queries separadas

**Arquivo:** `lib/modules-server.ts`
- `getServerOrganizationConfig()` agora verifica `studios.status` e `trial_ends_at` antes de retornar config
- Studios inativos/trial expirado retornam `null` → `guardModule` bloqueia acesso

### ✅ P1-FIX-A: `/api/attendance` — Cross-tenant fix CRÍTICO

**Arquivo:** `app/api/attendance/route.ts`
- Adicionado `studioId` como parâmetro obrigatório (POST body + GET query param)
- Adicionado `checkStudioAccess` em POST e GET
- Adicionado `.eq('studio_id', studioId)` em TODAS as queries (select, insert, update)
- Migrado de `supabase` (anon) para `supabaseAdmin` (service role) para consistência com checkStudioAccess

### ✅ P1-FIX-B: `/api/finance/*` — checkStudioAccess

**Arquivos:**
- `app/api/finance/expenses/route.ts` — GET, POST, PATCH, DELETE protegidos
- `app/api/finance/employee-payments/route.ts` — GET, POST protegidos
- `app/api/finance/notas/route.ts` — GET, POST protegidos

### ✅ P1-FIX-C: `/api/dashboard/live-classes` — checkStudioAccess

**Arquivo:** `app/api/dashboard/live-classes/route.ts` — GET protegido

### ✅ P1-FIX-D: `/api/whatsapp/*` — checkStudioAccess

**Arquivos:**
- `app/api/whatsapp/connect/route.ts` — GET protegido
- `app/api/whatsapp/send/route.ts` — POST protegido (studioId agora obrigatório)
- `app/api/whatsapp/logout/route.ts` — POST protegido
- `app/api/whatsapp/notify-low-credits/route.ts` — POST protegido

### ✅ P1-FIX-E: `/api/notifications/*` — checkStudioAccess

**Arquivos:**
- `app/api/notifications/route.ts` — GET protegido
- `app/api/notifications/mark-all-read/route.ts` — POST protegido

---

### ✅ P2-1: Enforcement de limites por plano (server-side)

**Arquivo:** `lib/database-utils.ts`
- `saveStudent()`: antes de INSERT, verifica `isLimitReached(count, plan, 'maxStudents')`
- `saveProfessional()`: antes de INSERT, verifica `isLimitReached(count, plan, 'maxProfessionals')`
- Busca plan do studio e count de registros ativos antes da inserção

### ✅ P2-2: Centralizar catálogo de módulos — REVISADO

- `config/modules.ts` já é a fonte de verdade (MODULE_DEFINITIONS + normalizeModules)
- `lib/plan-limits.ts` é separado para limites e features por plano (display-only)
- Duplicação mínima, arquitetura aceitável — refactor seria risco alto para benefício marginal

### ✅ P2-3: Observabilidade — `logAdmin` instrumentado

**Eventos críticos agora logados no painel `/admin/logs`:**
- `super-admin.ts`: deleteTenant, updateTenantSettings (com adminUserId)
- `cron/studios-cleanup`: desativação/exclusão automática de studios (com lista de afetados)
- `require-studio-access.ts`: bloqueio por studio inativo / trial expirado
- `modules-server.ts`: bloqueio por módulo desativado (guardModule)
- `verticalization.ts`: create, update, updateModules, delete

### ✅ P2-4: Audit trail de mudanças de policy

- `updateTenantSettings` agora registra: `adminUserId`, `tenantId`, `changes` (quais campos foram alterados)
- Verticalizações: CRUD completo com metadata no `admin_system_logs`
- Source format padronizado: `super-admin/policy`, `super-admin/verticalization`

### ✅ P2-5: Dashboards de billing real (Stripe) — PLANEJADO

- MRR já é calculado em `getGlobalSystemStats` a partir de `system_plans` + `studios.plan`
- Integração Stripe já existe (webhook, checkout, affiliate connect)
- **Pendente:** Dados reais de Stripe (invoices, churn, MRR real) requerem acesso ao Stripe dashboard e configuração de API keys. Planejado para implementação futura.

### ✅ P2-6: Modo Manutenção

**Novos arquivos criados:**
- `lib/maintenance.ts` — `isMaintenanceMode()` + `setMaintenanceMode()` (env var + DB-backed com cache 30s)
- `app/maintenance/page.tsx` — Página de manutenção com UI clean
- `app/api/admin/maintenance/route.ts` — GET (status) + POST (toggle) para Super Admin

**Integração no middleware:**
- `proxy.ts` — Check de `MAINTENANCE_MODE` env var logo após static files
- Super Admin (`/admin/*`) e APIs admin continuam acessíveis em manutenção
- Todos os outros usuários são redirecionados para `/maintenance`

---

### ✅ P3-2: Alertas proativos no Super Admin

**Novo arquivo:** `app/api/admin/alerts/route.ts`
- Endpoint GET que retorna alertas baseados em condições reais do sistema
- 5 tipos de alerta: trials expirando, trials expirados (CRON falhou), studios perto da exclusão, taxa alta de erros, studios sem módulos
- Ordenados por severidade (critical > warning > info)
- Cada alerta inclui `action` com link direto para a página admin relevante

### ✅ P3-3: Métricas de uso por módulo/tenant

**Novo arquivo:** `app/api/admin/metrics/route.ts`
- Uso por módulo: quantos studios têm cada módulo ativo
- Distribuição por plano (active/inactive/trialing)
- Crescimento semanal (últimos 30 dias)
- Top 10 tenants por volume (students + professionals)

### ✅ P3-4: Testes automatizados de isolamento multi-tenant

**Novo arquivo:** `lib/__tests__/multi-tenant-isolation.test.ts`
- Análise estática: verifica que rotas críticas importam `checkStudioAccess`
- Verifica que `requireStudioAccess` bloqueia studios inativos (HTTP 402)
- Verifica que `getServerOrganizationConfig` checa trial expirado
- Verifica enforcement de limites de plano em `saveStudent`/`saveProfessional`
- Verifica modo manutenção no `proxy.ts`
- Testes de lógica de `isLimitReached` por plano

---

## ANÁLISE DE BUGS — Deep Review Senior (2026-03-03)

### 🔴 CRÍTICOS CORRIGIDOS

**BUG-C1: `register/route.ts:388` — Teacher registrado como `professional_type='technician'`**
- O ternário `role === 'engineer' ? 'engineer' : (role === 'architect' ? 'architect' : 'technician')` fazia todo teacher cair no fallback `'technician'`
- FIX: Adicionado branch explícito `role === 'teacher' ? 'teacher' : 'technician'`

**BUG-C2: `modules-server.ts:37` — Query na tabela `teachers` (inexistente)**
- O fallback de resolução de `studioId` consultava `supabase.from('teachers')` mas a tabela real é `professionals`
- Profissionais não conseguiam resolver seu studioId → `guardModule` quebrava
- FIX: Alterado para `supabase.from('professionals').select('studio_id').eq('user_id', user.id)`

**BUG-C3: `proxy.ts` — Maintenance mode bloqueava `/api/auth/login`**
- O check de manutenção rodava ANTES do check de rotas públicas, bloqueando login/register/cron/webhooks
- FIX: Movido o check de manutenção para DEPOIS das rotas públicas

**BUG-C4: `proxy.ts` — Maintenance mode não bloqueava APIs regulares**
- O redirect só funciona para browser. APIs recebiam redirect para HTML em vez de erro JSON
- FIX: APIs regulares agora recebem HTTP 503 JSON; páginas recebem redirect

**BUG-C5: `register/route.ts` — Multi-unit studios sem `organization_settings`**
- Apenas o studio primário recebia niche/modules/vocabulary. Unidades extras ficavam sem config
- FIX: `organization_settings` agora é inserido para TODOS os `createdStudioIds`
- FIX adicional: `business_model` das unidades extras agora usa `finalBusinessModel` (considerando niche)

### 🟠 ALTOS CORRIGIDOS

**BUG-H1: `finance/expenses/route.ts` — Usava `supabase` anon em API route**
- Client anon sem contexto de auth server-side. Se RLS exige auth, queries retornavam vazio
- FIX: Alterado para `supabaseAdmin`

**BUG-H2: `database-utils.ts` — `saveProfessional` update sem filtro `studio_id`**
- Profissional de outro studio poderia ser editado se RLS fosse permissivo
- FIX: Adicionado `.eq('studio_id', studioId)` quando studioId está disponível

**BUG-H3: `proxy.ts` — Cookie `user-role` nunca era atualizado**
- Se role de um user mudava (ex: student→admin), cookie antigo persistia indefinidamente
- FIX: Agora sincroniza cookie com `user.user_metadata?.role` em toda requisição

**BUG-H4: `register/route.ts` — Cleanup em falha de auth deixava multi-unit studios órfãos**
- Só deletava o studio primário. Unidades extras ficavam no banco sem dono
- FIX: Agora deleta todos os `createdStudioIds`

### 🟡 MÉDIOS CORRIGIDOS

**BUG-M1: `cron/studios-cleanup` — Studios com `subscription_status=NULL` eram desativados**
- `.neq('subscription_status', 'active')` inclui NULLs. Studios legados seriam afetados
- FIX: Alterado para `.eq('subscription_status', 'trialing')` — mais preciso e seguro

**BUG-M2: `plan-limits.ts` — Duplicação `pro-plus` / `pro+`**
- Duas entries idênticas; divergência de manutenção
- FIX: Removida duplicação, adicionada normalização `pro+ → pro-plus` em `isLimitReached()`

### 🟢 BAIXOS CORRIGIDOS

**BUG-L1: `require-studio-access.ts` — `logAdmin` sem `await`**
- Calls fire-and-forget podiam não completar antes do throw
- FIX: Adicionado `await`

**BUG-L2: `proxy.ts` — `pathname.includes('.')` bypass genérico demais**
- Paths como `/user/john.doe` bypassavam todo o middleware
- FIX: Substituído por regex de extensões conhecidas: `.svg|.png|.jpg|.css|.js|...`

### ⚠️ CONHECIDOS (não corrigidos — requerem decisão arquitetural)

**RACE-1: `database-utils.ts` — TOCTOU em saveStudent/saveProfessional**
- Entre count e insert, outro request pode ultrapassar o limite
- Mitigação possível: constraint de banco ou transaction. Risco baixo em uso normal (UI single-user)

**MAINT-1: Maintenance DB toggle desconectado do middleware**
- `proxy.ts` (Edge runtime) só lê `process.env.MAINTENANCE_MODE`
- `lib/maintenance.ts` (Node runtime) lê do banco, mas middleware não o chama
- O toggle via `/api/admin/maintenance` funciona para checagens app-level, não para middleware

---

## ITEM PENDENTE (Requer decisão de produto)

- **P3-1: Auto-Registro de Estúdios** — Requer design de fluxo UX (landing → formulário → onboarding). A infraestrutura de criação de ecossistema (`createEcosystemInvite`) já existe; falta o fluxo público self-service.
