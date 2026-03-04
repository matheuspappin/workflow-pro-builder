# AKAAI CORE — O QUE FALTA EM CADA DETALHE

**Data:** 2026-03-03 | **Versão:** 0.1.1  
**Método:** Análise arquivo-por-arquivo de todo o codebase

---

## 1. 💳 BILLING / STRIPE (O maior gap do ecossistema)

### O que EXISTE:
- `lib/stripe.ts` — Inicialização lazy do Stripe SDK ✅
- `lib/actions/stripe.ts` — `createCheckoutSession()` para pagamentos one-time ✅
- `lib/actions/billing.ts` — `activateModule()` para upsell (apenas toggle no DB, SEM cobrança real) ⚠️
- `app/api/stripe/create-checkout-session/route.ts` — Checkout para vendas ERP/loja (mode: 'payment') ✅
- `app/api/admin/checkout/route.ts` — Checkout para upgrade de plano do studio ✅
- `app/api/admin/checkout/verify/route.ts` — Verificação manual do pagamento (fallback) ✅
- `app/api/webhooks/stripe/route.ts` — Webhook com 4 tipos: service_order, package, pos_sale, mensalidade ✅
- `lib/plan-limits.ts` — 4 planos com limites definidos (Gratuito/Pro/Pro+/Enterprise) ✅
- `config/module-pricing.ts` — 15 módulos com preços individuais ✅
- `app/subscription-expired/page.tsx` — Página de assinatura expirada ✅

### O que FALTA:

| # | Item faltante | Detalhe técnico | Criticidade |
|---|---------------|-----------------|-------------|
| B1 | **Stripe Subscription (mode: 'subscription')** | Todos os checkouts usam `mode: 'payment'` (pagamento único). Não existe NENHUMA assinatura recorrente. O plano Pro/Pro+/Enterprise deveria ser `mode: 'subscription'` com `price` criado no Stripe Dashboard. | 🔴 CRÍTICO |
| B2 | **Webhook `invoice.payment_succeeded`** | O webhook só trata `checkout.session.completed`. Para subscriptions, precisa tratar: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` | 🔴 CRÍTICO |
| B3 | **Webhook `customer.subscription.deleted`** | Quando o usuário cancela, precisa desativar o studio. Hoje NÃO existe. | 🔴 CRÍTICO |
| B4 | **Webhook `invoice.payment_failed`** | Quando o cartão falha, precisa mudar `subscription_status` para `past_due` e avisar o admin. NÃO existe. | 🔴 CRÍTICO |
| B5 | **`stripe_customer_id` no registro** | Schema tem o campo, mas o register NÃO cria o Stripe Customer. Deveria criar em `POST /api/auth/register` ao criar studio. | 🟡 ALTO |
| B6 | **`stripe_subscription_id` no studio** | Schema tem o campo, mas NUNCA é preenchido (nenhuma subscription é criada). | 🟡 ALTO |
| B7 | **Customer Portal Stripe** | Não existe rota `/api/stripe/customer-portal` para o dono do estúdio gerenciar cartão, ver faturas, cancelar. Stripe tem isso nativo com `stripe.billingPortal.sessions.create()`. | 🟡 ALTO |
| B8 | **Upgrade/Downgrade de plano** | Não existe UI nem API para trocar de plano. O `activateModule()` em billing.ts apenas faz toggle no DB sem cobrar. | 🟡 ALTO |
| B9 | **Página de Preços pública** | Não existe `/pricing` ou similar com CTA de compra. O funil de conversão pára no register. | 🟡 MÉDIO |
| B10 | **RPC `create_studio_invoice` e `mark_studio_invoice_as_paid`** | O checkout do admin chama essas RPCs, mas elas NÃO existem no schema.sql nem nas migrations. Precisa criar no Supabase. | 🔴 CRÍTICO |
| B11 | **Tabela `studio_invoices`** | O verify/route.ts consulta `studio_invoices`, mas essa tabela NÃO existe no schema.sql nem nas migrations. | 🔴 CRÍTICO |
| B12 | **PIX / Boleto** | Nenhum gateway brasileiro (ex: Asaas, Pagar.me) para gerar boleto/PIX. Apenas cartão Stripe. Para Brasil = perda de mercado. | 🟡 FUTURO |
| B13 | **Trial → Paid flow** | O trial expira e o CRON desativa, mas NÃO existe CTA ou redirect automático para o checkout antes de expirar. A `subscription-expired/page.tsx` tem um botão "Renovar" que NÃO faz nada (sem onClick real). | 🟡 ALTO |

---

## 2. 🔐 AUTENTICAÇÃO & SEGURANÇA

### O que EXISTE:
- `app/api/auth/register/route.ts` — Registro robusto (542 linhas), multi-role, validação CPF/CNPJ, auto-login ✅
- `app/api/auth/login/route.ts` — Login com auto-repair de perfil, detecção multi-tabela, sync metadata ✅
- `app/forgot-password/page.tsx` — Formulário de reset via `supabase.auth.resetPasswordForEmail()` ✅
- `app/reset-password/page.tsx` — Formulário de nova senha via token Supabase ✅
- `app/auth/set-password/page.tsx` — Set password para convites ✅
- `lib/rate-limit.ts` — Rate limiting com Upstash Redis ✅
- `lib/auth/require-studio-access.ts` — Guard multi-tenant completo (trial, status, role chain) ✅
- `proxy.ts` — Middleware 397 linhas com redirect por role e verticalização ✅
- `lib/schemas/auth.ts` — Validação Zod para login e register ✅

### O que FALTA:

| # | Item faltante | Detalhe técnico | Criticidade |
|---|---------------|-----------------|-------------|
| A1 | **Verificação de e-mail REAL** | No `register/route.ts` linha 67: `logger.info('✅ E-mail verificado (Simulado para testes)')`. O Supabase auth auto-confirma com `email_confirm: true` no admin.createUser. Em produção deveria enviar e-mail real de confirmação. | 🔴 CRÍTICO |
| A2 | **RLS Policies reais** | As policies no schema.sql são `USING (studio_id IS NOT NULL)` — isso permite QUALQUER usuário acessar QUALQUER studio via Supabase client-side. Precisa de `USING (studio_id IN (SELECT studio_id FROM users_internal WHERE id = auth.uid()))` ou equivalente. | 🔴 CRÍTICO |
| A3 | **2FA / MFA** | Nenhuma implementação de autenticação dois fatores. Supabase tem suporte nativo com TOTP. | 🟡 FUTURO |
| A4 | **Logout API não limpa todos os cookies** | `app/api/auth/logout/` — precisa verificar se limpa `sb-auth-token`, `user-role`, `user-plan` e os cookies Supabase SSR (`sb-*`). | 🟡 MÉDIO |
| A5 | **Session refresh** | Não existe lógica de refresh token no client-side. Se o token expira, o user é forçado a re-logar sem aviso. | 🟡 MÉDIO |
| A6 | **Convite de equipe** | `lib/actions/auth-invite.ts` existe, mas o fluxo completo (admin convida → e-mail → set-password → join) precisa ser validado end-to-end. | 🟡 MÉDIO |
| A7 | **Reset password sem session check** | Em `reset-password/page.tsx` linhas 28-38: O `checkSession()` está comentado. Se o link expirar, o user vê o formulário mas o submit vai falhar. | 🟡 BAIXO |
| A8 | **`danceflow_user` no localStorage** | TODO o sistema depende de `localStorage.getItem("danceflow_user")` para dados do usuário client-side. Isso é: (a) nome legado do DanceFlow, (b) não synca automaticamente se metadata mudar, (c) pode ser manipulado pelo usuário. | 🟡 MÉDIO |

---

## 3. 🔥 FIRE PROTECTION (Verticalização Mais Completa)

### Frontend: 44 páginas TSX ✅
- **Dashboard:** 19 páginas (home, OS, OS nova, clientes, extintores, financeiro, vistorias, vistorias nova, leads, chat, WhatsApp, relatórios, tecnicos, engenheiros, arquitetos, vendas, portal-vendedor, configurações)
- **Portais:** engineer (5p), architect (5p), technician (6p), client (5p)
- **Auth:** login, register, landing

### APIs: 31 routes ✅
- AI chat, assets (+ bulk), catalog, chat-sessions, clientes, configurações, OS (CRUD), PDV (+ histórico), reminders, studio invite-code, technician (7 sub-routes), vistorias (CRUD + laudo)

### O que FALTA:

| # | Item | Detalhe | Criticidade |
|---|------|---------|-------------|
| FP1 | **PDF de Laudo de Vistoria** | A rota `/api/fire-protection/vistorias/[id]/laudo` existe mas precisa verificar se gera PDF real com jsPDF ou apenas retorna JSON. Laudos precisam de assinatura digital, header da empresa, QR Code de verificação. | 🟡 ALTO |
| FP2 | **PDF de Relatório PPCI** | Projetos PPCI do engenheiro/arquiteto precisam gerar documentos PDF com plantas e especificações técnicas. | 🟡 ALTO |
| FP3 | **Integração NF-e** | Módulo de vendas/PDV existe mas NÃO emite nota fiscal eletrônica. Para Brasil é obrigatório para empresas reais. | 🟡 FUTURO |
| FP4 | **Mapa de clientes/ativos** | Não existe visualização geográfica dos clientes e seus extintores. Leaflet já está nas deps. | 🟡 MÉDIO |
| FP5 | **CRON de alertas de vencimento de extintores** | `fire-protection-reminders/route.ts` existe, mas precisa verificar se busca `assets` com `next_inspection_date` próxima. | 🟡 MÉDIO |
| FP6 | **Dashboard KPIs reais** | Verificar se os KPIs do dashboard (receita, OS abertas, clientes ativos) buscam dados reais via API ou usam mock data. | 🟡 MÉDIO |
| FP7 | **Portal do Vendedor com comissões** | `/dashboard/portal-vendedor` existe como page, mas precisa de cálculo de comissão por venda rastreada. | 🟡 BAIXO |
| FP8 | **Onboarding wizard Fire Protection** | Novo dono não tem guia de configuração (cadastrar primeiro cliente, primeiro extintor, primeiro técnico). | 🟡 ALTO |
| FP9 | **Testes E2E do fluxo OS completo** | Zero testes: criar OS → atribuir técnico → técnico executa → cliente aprova → fatura. | 🔴 CRÍTICO |
| FP10 | **Aprovação de cliente na OS** | Existe `/api/fire-protection/client/solicitar` e migration `65_client_approval`, mas falta validar fluxo completo com assinatura. | 🟡 MÉDIO |

---

## 4. 💃 DANCEFLOW (Estúdio de Dança)

### Frontend: 26 páginas ✅
- **Dashboard:** 13 páginas (home, alunos, turmas, professores, financeiro, leads, WhatsApp, relatórios, gamificação, scanner, chat, configurações)
- **Portais:** teacher (5p com chamada + turmas + perfil), student (5p com financeiro + turmas + perfil)
- **Auth:** login, register, landing (49KB)

### APIs: Usa APIs genéricas (/api/dance-studio, /api/attendance, /api/finance, /api/chat, /api/gemini)

### O que FALTA:

| # | Item | Detalhe | Criticidade |
|---|------|---------|-------------|
| DF1 | **API dedicada do DanceFlow** | Diferente do Fire Protection (31 APIs dedicadas), DanceFlow usa APIs genéricas do `/dashboard`. Funciona, mas dificulta evolução independente. | 🟡 BAIXO |
| DF2 | **Pagamento online do aluno** | Portal do aluno (`student/financeiro/page.tsx`) mostra pagamentos pendentes mas NÃO tem botão "Pagar agora" funcional com Stripe. | 🟡 ALTO |
| DF3 | **Compra de pacotes de crédito online** | O webhook Stripe trata `type: 'package'` e adiciona créditos, mas NÃO existe UI para o aluno comprar um pacote com checkout Stripe. | 🟡 ALTO |
| DF4 | **Gamificação profunda** | `/dashboard/gamificacao` existe como page. Schema `gamifications` existe. Mas falta: regras automáticas de pontuação (presença = +10pts, streak = +50pts), ranking público, visual de badges no perfil do aluno. | 🟡 MÉDIO |
| DF5 | **Relatórios em PDF** | `/dashboard/relatorios` existe como page mas precisa verificar se gera PDF com dados reais ou é apenas tela. jsPDF está nas deps. | 🟡 MÉDIO |
| DF6 | **Retenção/Evasão** | Dashboard genérico tem `evasionAlerts` no state, mas a lógica de detecção de evasão (aluno não veio X aulas seguidas) precisa ser validada. | 🟡 MÉDIO |
| DF7 | **Aulas ao vivo** | `/dashboard/ao-vivo` existe no genérico mas precisa de integração real (Zoom/Meet link gerado automaticamente ou embed). | 🟡 FUTURO |
| DF8 | **Scanner QR integrado com créditos** | O scanner existe, mas precisa validar: scan → desconta crédito → registra presença em uma transação atômica. | 🟡 MÉDIO |
| DF9 | **Onboarding wizard DanceFlow** | Falta guia pós-registro: criar primeira modalidade → adicionar turma → convidar primeiro aluno. | 🟡 ALTO |
| DF10 | **Testes E2E** | Zero testes: registro admin → cria turma → convida aluno → aluno paga → confirma presença → crédito descontado. | 🔴 CRÍTICO |

---

## 5. 🌱 AGROFLOWAI

### Frontend: 24 páginas ✅
- **Dashboard:** 14 páginas (home, clientes, propriedades, OS, laudos, engenheiros, técnicos, financeiro, satélite, leads, relatórios, chat, configurações, alertas)
- **Portal Client:** 7 páginas (home, propriedades, laudos, OS, notificações, perfil)
- **Auth:** login, register, landing (76KB — a maior)

### APIs: 20 routes dedicadas ✅

### O que FALTA:

| # | Item | Detalhe | Criticidade |
|---|------|---------|-------------|
| AG1 | **Satellite Processor em produção** | `satellite-processor/` é um serviço Python+Docker separado. Precisa de deploy (Cloud Run, Fly.io, etc). Localmente funciona via docker-compose. | 🔴 CRÍTICO p/ vertical |
| AG2 | **Provedor de imagens de satélite real** | A API `/api/agroflowai/satellite-image` e `/api/agroflowai/ndvi` existem, mas precisa verificar se usam provedor real (Sentinel Hub, Planet Labs) ou dados mock. | 🔴 CRÍTICO p/ vertical |
| AG3 | **PDF de Laudos Ambientais** | `/api/agroflowai/laudos/[id]` existe mas precisa gerar PDF profissional com dados da propriedade, imagens NDVI, recomendações. | 🟡 ALTO |
| AG4 | **Geolocalização de propriedades** | Schema tem propriedades mas sem coordenadas GPS. O `MapaSatelite.tsx` e Leaflet estão prontos, falta vincular. | 🟡 ALTO |
| AG5 | **Portal Engenheiro Agrônomo dedicado** | Não existe `/solutions/agroflowai/engineer` — engenheiros usam o dashboard admin. Fire Protection tem engineer separado. | 🟡 MÉDIO |
| AG6 | **Portal Técnico Agrícola dedicado** | Idem — não existe `/solutions/agroflowai/technician`. | 🟡 MÉDIO |
| AG7 | **Alertas inteligentes de clima/NDVI** | `/api/agroflowai/alertas` existe, mas precisa verificar se integra com API de clima real ou se é manual. | 🟡 MÉDIO |
| AG8 | **Onboarding wizard AgroFlow** | Falta guia: cadastrar primeira propriedade → vincular coordenadas → primeira análise satellite. | 🟡 ALTO |
| AG9 | **Testes E2E** | Zero testes do fluxo completo. | 🔴 CRÍTICO |
| AG10 | **CRON de alertas para AgroFlow** | Não existe CRON dedicado (só fire-protection-reminders e reminders genérico de DanceFlow). | 🟡 MÉDIO |

---

## 6. 📊 DASHBOARD GENÉRICO (60+ nichos)

### O que EXISTE:
- `/dashboard` — 21 seções (alunos, aulas, professores, financeiro, vendas, OS, leads, chat, WhatsApp, erp, estoque, marketplace, scanner, ao-vivo, projetos, suporte, configurações)
- Adapta vocabulário via `useVocabulary()` e modo via `useBusinessMode()`
- 60+ nichos mapeados em `business-modes.ts`

### O que FALTA:

| # | Item | Detalhe | Criticidade |
|---|------|---------|-------------|
| GD1 | **Mock data no Dashboard** | `dashboard/page.tsx` linhas 63-70: `revenueData` é **HARDCODED MOCK**. O `getDashboardStats()` existe mas os charts usam mock. | 🔴 CRÍTICO |
| GD2 | **ERP incompleto** | `/dashboard/erp/page.tsx` importa `getChannels, connectChannel, getERPOrders` — funcionalidade de canais de venda + XML fiscal. Precisa validar se funciona E2E. | 🟡 MÉDIO |
| GD3 | **Marketplace apenas config** | `/dashboard/marketplace/page.tsx` tem UI de configuração da loja, mas precisa verificar se `/shop/[storeId]` (vitrine pública) funciona com catálogo real. | 🟡 MÉDIO |
| GD4 | **POS/PDV genérico** | Existe em Fire Protection (`/api/fire-protection/pdv`), mas o dashboard genérico em `/dashboard/vendas` precisa validar se tem PDV funcional para TODOS os nichos. | 🟡 MÉDIO |
| GD5 | **Gestão de Projetos** | `/dashboard/projetos` existe mas é um módulo raso. Não tem Kanban, tasks, deadlines, assignees completos. | 🟡 BAIXO |
| GD6 | **Ordens de Serviço genérica** | `/dashboard/os` existe. `lib/actions/service-orders.ts` (20KB) é robusto. Mas precisa validar assinatura digital, histórico de status, e print/PDF. | 🟡 MÉDIO |
| GD7 | **Multi-unidade** | Register cria unidades extras (`multiUnitQuantity`), mas a UI de troca de unidade no dashboard é parcial. Precisa de seletor de unidade no sidebar. | 🟡 MÉDIO |
| GD8 | **Chat IA genérico** | `/dashboard/chat` existe e `/api/gemini` é o endpoint padrão. Precisa verificar se o Gemini API key é por studio ou global. | 🟡 BAIXO |
| GD9 | **Suporte (Tickets)** | `/dashboard/support` e `/api/support` existem. Precisa verificar se admin vê tickets, se tem status, SLA. | 🟡 BAIXO |

---

## 7. 👥 PORTAIS DE USUÁRIO

### Portal Student (`/student`) — 1227 linhas, robusto
| # | Falta | Criticidade |
|---|-------|-------------|
| PS1 | **Pagamento online real** (botão existe sem ação Stripe) | 🟡 ALTO |
| PS2 | **Histórico de OS sem detalhes** (lista rasa) | 🟡 BAIXO |
| PS3 | **Notificações in-app** (não tem polling/realtime) | 🟡 MÉDIO |

### Portal Seller (`/seller`) — 5 páginas
| # | Falta | Criticidade |
|---|-------|-------------|
| SE1 | **Relatório de comissões** (cálculo não implementado) | 🟡 MÉDIO |
| SE2 | **Dashboard com metas** (falta integração com metas definidas pelo admin) | 🟡 BAIXO |

### Portal Technician (`/technician`) — 5 páginas
| # | Falta | Criticidade |
|---|-------|-------------|
| TE1 | **GPS tracking de rota** (Leaflet está nas deps, falta integrar) | 🟡 FUTURO |
| TE2 | **Fotos na OS** (upload de fotos pré/pós serviço) | 🟡 MÉDIO |
| TE3 | **Assinatura digital do cliente na OS** (react-signature-canvas nas deps, falta integrar no fluxo) | 🟡 ALTO |

### Portal Affiliate (`/portal/affiliate`) — 8 páginas
| # | Falta | Criticidade |
|---|-------|-------------|
| AF1 | **Dashboard usa apenas localStorage** — não faz fetch real do backend | 🟡 ALTO |
| AF2 | **Payout de comissões** (migration 18 existe para payout fields, mas fluxo Stripe Connect não implementado) | 🟡 ALTO |
| AF3 | **Link de referral tracking** (estrutura existe em partners, mas precisa de utm + cookie tracking) | 🟡 MÉDIO |
| AF4 | **Gestão de ecossistemas do afiliado** (`/portal/affiliate/ecosystems` existe como page) — validar se funcional | 🟡 MÉDIO |

### Portal Finance (`/finance`) — 7 páginas
| # | Falta | Criticidade |
|---|-------|-------------|
| FI1 | **Integração bancária** (apenas manual, sem OFX/CSV import automático) | 🟡 FUTURO |
| FI2 | **Relatórios fiscais** (DRE, balancete — não implementados) | 🟡 MÉDIO |
| FI3 | **Notas fiscais** (`/finance/notas` existe mas sem emissão real NF-e) | 🟡 FUTURO |

---

## 8. 🛡️ ADMIN PANEL (`/admin`)

### O que EXISTE: 13 seções ✅ (dashboard KPIs, studios CRUD, users, verticalizações, logs, alertas, métricas, suporte, ecosystem-status, afiliados, planos, settings, testes)

### O que FALTA:

| # | Item | Detalhe | Criticidade |
|---|------|---------|-------------|
| AD1 | **RBAC granular** | Qualquer user com role `super_admin` tem acesso total. Falta: permissões por recurso (ex: "pode ver studios mas não deletar"). | 🟡 FUTURO |
| AD2 | **Audit trail completo** | `logAdmin()` está instrumentado, mas falta: filtro por período, export CSV, e busca por studio_id nos logs. | 🟡 BAIXO |
| AD3 | **Gestão de planos no Stripe** | `/admin/plans` gerencia planos no DB, mas NÃO sincroniza com Stripe Products/Prices. | 🟡 ALTO |
| AD4 | **Impersonar studio** | Admin não tem "entrar como" para debugar o painel de um estúdio específico. | 🟡 FUTURO |
| AD5 | **Notificações para admin** | Alertas proativos existem em `/api/admin/alerts`, mas não tem push/email/WebSocket para o admin. | 🟡 MÉDIO |

---

## 9. 📱 WHATSAPP / IA / CRON / WEBHOOKS

### WhatsApp (`lib/whatsapp.ts` + webhook)
| # | Falta | Criticidade |
|---|-------|-------------|
| WA1 | **Cache de mensagens em Redis** | Usa `Set<string>` em memória (linha 10 do webhook). Em produção com múltiplas instâncias Vercel = duplicação. Precisa de Redis/Upstash. | 🟡 ALTO |
| WA2 | **Envio de mídia** | Apenas texto. Não envia imagens, PDFs, áudio. | 🟡 MÉDIO |
| WA3 | **Templates de mensagem** | Mensagens são hardcoded no webhook. Falta sistema de templates editáveis pelo admin. | 🟡 MÉDIO |
| WA4 | **Evolution API em produção** | Docker local funciona. Precisa de VPS dedicada ou serviço gerenciado para produção. | 🟡 ALTO |

### IA (Gemini Router)
| # | Falta | Criticidade |
|---|-------|-------------|
| AI1 | **Gemini API Key por studio** | Todas as verticalizações usam uma chave global. Se escalar = custo concentrado. Precisa de billing por studio ou chave por studio. | 🟡 MÉDIO |
| AI2 | **Contexto do studio no prompt** | O AI router envia `studio_id` mas precisa verificar se o prompt inclui dados reais do studio (turmas, preços, horários). | 🟡 ALTO |
| AI3 | **Histórico de conversa** | O webhook envia `history: []` (vazio). Precisa buscar últimas N mensagens do chat para contexto. | 🟡 ALTO |
| AI4 | **Fallback se Gemini falhar** | Se a API Gemini estiver fora, o webhook falha silenciosamente. Precisa de mensagem de fallback ("Estamos com dificuldades..."). | 🟡 MÉDIO |

### CRONs
| # | Falta | Criticidade |
|---|-------|-------------|
| CR1 | **Vercel CRON limitado** | `vercel.json` tem apenas 1 CRON (`/api/cron/reminders` daily). Precisa de: studios-cleanup (daily), fire-protection-reminders (daily), process-no-shows (daily). Total = 4 CRONs, Vercel free = 1. | 🟡 ALTO |
| CR2 | **CRON de cobrança** | Não existe CRON que detecta mensalidades vencidas e envia lembrete de pagamento via WhatsApp/email. | 🟡 ALTO |
| CR3 | **CRON de backup** | Não existe job de backup automatizado do Supabase. | 🟡 MÉDIO |

---

## 10. 🏗️ INFRA / DEVOPS / TESTES / I18N / LEGAL

### Testes
| # | Falta | Detalhe | Criticidade |
|---|-------|---------|-------------|
| T1 | **Testes unitários** | 2 placeholders (`button.test.tsx`, `some-utility.test.ts`) + 1 real (`multi-tenant-isolation.test.ts`). Cobertura ≈ 0.1%. | 🔴 CRÍTICO |
| T2 | **Testes E2E** | 1 arquivo Cypress (`login.cy.ts`). Nenhum fluxo completo testado. | 🔴 CRÍTICO |
| T3 | **Testes de API** | Nenhum teste de API route. Nenhum mock de Supabase. | 🔴 CRÍTICO |
| T4 | **CI rodando** | `ci.yml` existe mas usa `npm install` enquanto o projeto usa `pnpm`. Vai falhar. | 🔴 CRÍTICO |

### Infra / DevOps
| # | Falta | Detalhe | Criticidade |
|---|-------|---------|-------------|
| I1 | **`.env.example`** | NÃO existe. Variáveis necessárias espalhadas pelo código: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WHATSAPP_API_KEY`, `WHATSAPP_API_URL`, `CRON_SECRET`, `INTERNAL_AI_SECRET`, `NEXT_PUBLIC_APP_URL`, `GEMINI_API_KEY`, etc. | 🟡 ALTO |
| I2 | **Error boundaries** | Não existe error boundary global no layout. Um erro em qualquer componente = tela branca. | 🟡 ALTO |
| I3 | **404/500 pages customizadas** | Não existem `app/not-found.tsx` nem `app/error.tsx`. | 🟡 MÉDIO |
| I4 | **Health check endpoint** | Não existe `/api/health` para monitoramento. | 🟡 BAIXO |
| I5 | **Staging environment** | Deploy parece direto para produção. Falta ambiente de staging. | 🟡 MÉDIO |

### I18N
| # | Falta | Detalhe | Criticidade |
|---|-------|---------|-------------|
| L1 | **Tradução incompleta** | `config/translations.ts` (84KB) tem PT/EN mas muitas pages usam strings hardcoded em PT. | 🟡 MÉDIO |
| L2 | **Locale switching persistente** | `LanguageSwitcher` existe, mas falta verificar se a preferência persiste entre sessões. | 🟡 BAIXO |
| L3 | **Niche dictionary EN** | `niche-dictionary.ts` (30KB) tem fallback para EN, mas precisa validar completude. | 🟡 BAIXO |

### Legal / Compliance
| # | Falta | Detalhe | Criticidade |
|---|-------|---------|-------------|
| LG1 | **Termos de uso** | NÃO existe página `/terms`. | 🟡 ALTO |
| LG2 | **Política de privacidade** | NÃO existe página `/privacy`. | 🟡 ALTO |
| LG3 | **LGPD compliance** | Não existe fluxo de: consentimento de cookies, direito de exclusão de dados, export de dados do usuário. | 🟡 ALTO |
| LG4 | **Checkbox de termos no register** | O formulário de registro NÃO pede aceite de termos. | 🟡 ALTO |

---

## 📊 RESUMO QUANTITATIVO

| Categoria | Itens Faltantes | 🔴 Crítico | 🟡 Alto | 🟡 Médio | 🟡 Baixo/Futuro |
|-----------|----------------|------------|---------|----------|-----------------|
| Billing/Stripe | 13 | 4 | 5 | 1 | 3 |
| Auth/Segurança | 8 | 2 | 0 | 4 | 2 |
| Fire Protection | 10 | 1 | 3 | 4 | 2 |
| DanceFlow | 10 | 1 | 3 | 4 | 2 |
| AgroFlowAI | 10 | 3 | 3 | 3 | 1 |
| Dashboard Genérico | 9 | 1 | 0 | 5 | 3 |
| Portais Usuário | 12 | 0 | 5 | 4 | 3 |
| Admin Panel | 5 | 0 | 1 | 1 | 3 |
| WhatsApp/IA/Cron | 11 | 0 | 5 | 5 | 1 |
| Infra/Tests/Legal | 13 | 4 | 5 | 3 | 1 |
| **TOTAL** | **101** | **16** | **30** | **34** | **21** |

---

## 🎯 TOP 16 CRÍTICOS (Fazer ANTES de lançar)

1. **B1** — Stripe Subscriptions (mode: 'subscription')
2. **B2** — Webhook invoice.payment_succeeded
3. **B3** — Webhook customer.subscription.deleted
4. **B4** — Webhook invoice.payment_failed
5. **B10** — RPC create_studio_invoice (não existe)
6. **B11** — Tabela studio_invoices (não existe)
7. **A1** — Verificação de e-mail real (não simulada)
8. **A2** — RLS policies reais (não permissivas)
9. **GD1** — Mock data no Dashboard genérico
10. **T1** — Testes unitários (cobertura ≈ 0%)
11. **T2** — Testes E2E (1 arquivo)
12. **T3** — Testes de API (0)
13. **T4** — CI usa npm em vez de pnpm
14. **FP9** — Teste E2E Fire Protection
15. **DF10** — Teste E2E DanceFlow
16. **AG9** — Teste E2E AgroFlowAI

---

*Relatório gerado por análise arquivo-por-arquivo em 2026-03-03.*
