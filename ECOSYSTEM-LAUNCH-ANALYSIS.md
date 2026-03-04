# AKAAI CORE - Análise Completa do Ecossistema para Lançamento

**Data:** 2026-03-03  
**Versão:** 0.1.1  
**Stack:** Next.js 16 + React 19 + Tailwind 4 + Supabase + Stripe + Vercel

---

## 1. ARQUITETURA DO ECOSSISTEMA

### 1.1 Camadas Identificadas

| Camada | Descrição | Status |
|--------|-----------|--------|
| **CORE Multi-Tenant** | Auth, studios, RLS, middleware, módulos | ✅ Robusto |
| **Verticalizações** | Fire Protection, DanceFlow, AgroFlowAI | ⚠️ Variável |
| **Dashboard Genérico** | `/dashboard` - para nichos sem verticalização dedicada | ✅ Funcional |
| **Portais de Usuário** | Student, Technician, Engineer, Architect, Client, Seller, Affiliate | ⚠️ Parcial |
| **Painel Admin (Super)** | `/admin` - gestão de studios, planos, verticalizações, logs | ✅ Funcional |
| **Portal de Parceiros** | `/portal/affiliate` - programa de afiliados | ⚠️ Parcial |
| **APIs** | 25 grupos de API routes (124+ arquivos) | ⚠️ Variável |
| **Billing/Stripe** | Checkout, webhooks | ⚠️ Básico |
| **WhatsApp** | Evolution API + chatbot IA | ⚠️ Implementado, sem testes E2E |
| **IA (Gemini)** | Roteador por nicho, chat consultoria, regras por camada | ⚠️ Implementado |

---

## 2. VERTICALIZAÇÕES - Análise Individual

### 2.1 🔥 Fire Protection (Mais Completa)

| Componente | Páginas/Rotas | Status |
|------------|---------------|--------|
| Landing Page | `/solutions/fire-protection` (6KB) | ✅ |
| Login/Register | Dedicados | ✅ |
| Dashboard Admin | 17 seções (OS, clientes, extintores, financeiro, vistorias, WhatsApp, leads, relatórios, chat, vendas, portal vendedor, engenheiros, técnicos, configurações) | ✅ |
| Portal Engenheiro | 5 páginas (projetos PPCI, aceitação, OS) | ✅ |
| Portal Técnico | 6 páginas (OS, scanner, lista) | ✅ |
| Portal Cliente | 5 páginas (extintores, vistorias, aprovação) | ✅ |
| Portal Arquiteto | 5 páginas | ✅ |
| APIs | 31 arquivos em `/api/fire-protection` (AI, assets, catalog, chat, clientes, OS, PDV, reminders, vistorias, técnicos) | ✅ |
| CRON Reminders | `/api/cron/fire-protection-reminders` | ✅ |

**Maturidade Fire Protection: ~75%**  
- ✅ Fluxos CRUD completos (OS, clientes, extintores, vistorias)
- ✅ Multi-portal (admin, engineer, technician, client, architect, seller)
- ✅ AI Chat dedicado
- ⚠️ Falta: testes automatizados, documentação de API, onboarding wizard
- ⚠️ Falta: relatórios PDF finalizados, integração nota fiscal
- ❌ Falta: pagamento online do cliente final

### 2.2 💃 DanceFlow / Estúdio de Dança

| Componente | Páginas/Rotas | Status |
|------------|---------------|--------|
| Landing Page | `/solutions/estudio-de-danca` (49KB) | ✅ |
| Login/Register | Dedicados | ✅ |
| Dashboard Admin | 13 seções (alunos, turmas, financeiro, leads, WhatsApp, relatórios, gamificação, scanner, chat, configurações, professores) | ✅ |
| Portal Professor | 5 páginas | ✅ |
| Portal Aluno | 5 páginas (aulas, OS, pagamentos, perfil) | ✅ |
| APIs | Usa APIs genéricas (`/api/dance-studio`, `/api/attendance`, `/api/finance`, `/api/chat`) | ⚠️ |

**Maturidade DanceFlow: ~70%**  
- ✅ Sistema de créditos/pacotes de aulas
- ✅ Gamificação, Scanner QR, Chat IA
- ✅ Controle de presença e matrículas
- ⚠️ Falta: refinamento UX do portal aluno
- ⚠️ Falta: integração pagamento online (Stripe para alunos)
- ❌ Falta: testes, onboarding, relatórios avançados

### 2.3 🌱 AgroFlowAI

| Componente | Páginas/Rotas | Status |
|------------|---------------|--------|
| Landing Page | `/solutions/agroflowai` (76KB - maior de todas) | ✅ |
| Login/Register | Dedicados | ✅ |
| Dashboard Admin | 14 seções (clientes, propriedades, OS, laudos, engenheiros, técnicos, financeiro, satélite, leads, relatórios, chat, configurações, alertas) | ✅ |
| Portal Cliente | 7 páginas (propriedades, laudos, alertas) | ✅ |
| APIs | 20 arquivos em `/api/agroflowai` (AI, alertas, clientes, documentos, engenheiros, financeiro, laudos, leads, NDVI, notificações, OS, propriedades, satélite, técnicos) | ✅ |
| Satellite Processor | Python Docker service (`/satellite-processor`) | ⚠️ |
| Mapas (Leaflet) | `MapaSatelite.tsx`, `NDVIChart.tsx` | ✅ |

**Maturidade AgroFlowAI: ~60%**  
- ✅ CRUD completo (propriedades, OS, laudos, clientes)
- ✅ Satellite imagery + NDVI charts
- ✅ AI Chat dedicado
- ⚠️ Satellite processor é Docker separado (requer deploy dedicado)
- ⚠️ Falta: testes do pipeline de satélite
- ❌ Falta: integração com provedores reais de imagem (API Sentinel/Planet)
- ❌ Falta: relatórios PDF de laudos

---

## 3. CORE PLATFORM - Análise

### 3.1 Autenticação & Multi-Tenancy

| Item | Status | Detalhes |
|------|--------|----------|
| Registro multi-role | ✅ 95% | admin, student, teacher, engineer, architect, seller, finance, partner, affiliate |
| Login com redirect por role | ✅ 95% | Proxy.ts com lógica completa por verticalização |
| `requireStudioAccess` | ✅ 100% | Trial check, status check, role chain |
| `checkStudioAccess` helper | ✅ 100% | Wrapper non-throwing |
| Rate limiting (Upstash) | ✅ 90% | Auth rate limit implementado |
| RLS (Row Level Security) | ⚠️ 70% | Schema base tem RLS, mas policies são `studio_id IS NOT NULL` (muito permissivas) |
| Super Admin block no register | ✅ 100% | Bloqueio explícito |
| Recuperação de senha | ⚠️ 60% | Rota existe mas fluxo completo não verificado |
| Verificação de e-mail | ⚠️ 50% | Simulado para testes, não em produção |

### 3.2 Billing & Monetização

| Item | Status | Detalhes |
|------|--------|----------|
| Stripe lib inicializada | ✅ | `lib/stripe.ts` com lazy init |
| Checkout session | ⚠️ 50% | `/api/stripe/create-checkout-session` existe |
| Webhook Stripe | ⚠️ 40% | `/api/webhooks/stripe/route.ts` existe, completude desconhecida |
| Planos definidos | ✅ 90% | Gratuito, Pro (R$97), Pro+ (R$197), Enterprise (R$397), Custom |
| Plan limits server-side | ✅ 80% | `isLimitReached()` em `plan-limits.ts`, enforced em `saveStudent`/`saveProfessional` |
| Module pricing | ✅ 90% | 15 módulos com preços definidos (R$0-R$300) |
| Trial system | ✅ 80% | `trial_ends_at`, CRON cleanup, middleware check |
| Subscription lifecycle | ⚠️ 50% | `subscription_status` no schema, mas falta integração completa com Stripe webhooks |
| Customer portal (Stripe) | ❌ 0% | Não implementado |
| Downgrade/upgrade flow | ❌ 0% | Não implementado |

### 3.3 Admin Panel (`/admin`)

| Item | Status |
|------|--------|
| Dashboard com métricas | ✅ |
| Gestão de Studios | ✅ |
| Gestão de Usuários | ✅ |
| Gestão de Verticalizações | ✅ |
| Logs do sistema | ✅ |
| Alertas proativos | ✅ |
| Métricas (module usage, growth) | ✅ |
| Suporte (tickets) | ✅ |
| Ecosystem status | ✅ |
| Afiliados | ✅ |
| Planos | ✅ |
| Modo manutenção | ✅ |

### 3.4 Módulos do Builder (15 definidos)

| Módulo | Core Impl | API | Frontend | Nota |
|--------|-----------|-----|----------|------|
| Dashboard | ✅ | ✅ | ✅ | Funcional em todas verticalizações |
| Students/Clients | ✅ | ✅ | ✅ | CRUD completo |
| Classes/Services | ✅ | ✅ | ✅ | Agendamento, presença |
| Financial | ✅ | ✅ | ✅ | Pagamentos, despesas, notas |
| WhatsApp | ⚠️ | ✅ | ✅ | Evolution API, depende de infra Docker |
| AI Chat | ⚠️ | ✅ | ✅ | Gemini router por nicho |
| POS | ⚠️ | ⚠️ | ⚠️ | Presente em Fire Protection, parcial genérico |
| Inventory | ⚠️ | ✅ | ⚠️ | `lib/actions/inventory.ts` existe |
| Gamification | ⚠️ | ⚠️ | ⚠️ | Schema + DanceFlow page, falta profundidade |
| Leads (CRM) | ✅ | ✅ | ✅ | Pipeline Kanban |
| Scanner | ⚠️ | ⚠️ | ✅ | QR Code, HTML5 scanner |
| Marketplace | ⚠️ | ⚠️ | ⚠️ | `lib/actions/marketplace.ts`, schema básico |
| ERP Enterprise | ⚠️ | ⚠️ | ⚠️ | `lib/actions/erp.ts` + XML parser, parcial |
| Multi-unit | ⚠️ | ⚠️ | ⚠️ | Registro cria unidades, gestão parcial |
| Service Orders | ✅ | ✅ | ✅ | Completo (Fire + Agro + Genérico) |

---

## 4. INFRAESTRUTURA & DevOps

| Item | Status | Detalhes |
|------|--------|----------|
| Vercel deploy config | ✅ | `vercel.json` com CRON |
| GitHub CI (Jest + Cypress) | ⚠️ 30% | Pipeline existe, mas testes são mínimos |
| Testes unitários | ❌ 5% | 2 arquivos placeholder (`button.test.tsx`, `some-utility.test.ts`) + 1 multi-tenant test |
| Testes E2E (Cypress) | ❌ 5% | 1 arquivo (`login.cy.ts`) |
| Database migrations | ✅ 90% | 85+ migration files, evolução orgânica |
| Schema SQL documentado | ✅ 85% | 511 linhas, 19 tabelas core + migrations |
| Sentry error tracking | ✅ | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| Logging (Pino) | ✅ | `lib/logger.ts` + `pino-sentry` |
| Internacionalização | ⚠️ 60% | `config/translations.ts` (PT/EN), `niche-dictionary.ts` (30KB), locales/ |
| Docker (WhatsApp) | ✅ | `docker-compose.yml` + Evolution API |
| Docker (Satellite) | ⚠️ | Dockerfile presente, precisa de validação |
| Environment docs | ⚠️ | Múltiplos env vars necessários, sem `.env.example` completo |
| README | ⚠️ | Existe mas pode estar desatualizado |

---

## 5. O QUE FALTA PARA LANÇAMENTO (Definição: MVP Público Pago)

### 🔴 BLOQUEADORES (Must-Have para Lançamento)

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| B1 | **Fluxo Stripe completo** (checkout → webhook → ativação → renovação → cancelamento) | 🔴 Alto | Sem isso, não monetiza |
| B2 | **Verificação de e-mail real** (não simulado) | 🟡 Médio | Segurança básica |
| B3 | **RLS policies reais** (não apenas `studio_id IS NOT NULL`) | 🔴 Alto | Vulnerabilidade multi-tenant |
| B4 | **Testes mínimos críticos** (auth flow, payment flow, multi-tenant isolation) | 🔴 Alto | Confiabilidade |
| B5 | **Onboarding wizard** para novos clientes (post-register) | 🟡 Médio | Sem isso, churn na primeira sessão |
| B6 | **Página de preços/planos** pública com CTA para checkout | 🟡 Médio | Funil de conversão |
| B7 | **Customer portal Stripe** (gerenciar assinatura, trocar cartão) | 🟡 Médio | Retenção |
| B8 | **Termos de uso e política de privacidade** | 🟡 Baixo (texto) | Legal/compliance |
| B9 | **`.env.example`** documentado com todas as variáveis | 🟢 Baixo | Operacional |
| B10 | **Error boundaries e fallback pages** (500, 404 customizados) | 🟡 Médio | UX profissional |

### 🟡 IMPORTANTES (Should-Have para V1.0)

| # | Item | Esforço |
|---|------|---------|
| I1 | Relatórios PDF (jsPDF já está nas deps) | Médio |
| I2 | Notificações por e-mail (nodemailer já está nas deps) | Médio |
| I3 | Testes E2E para cada verticalização (happy path) | Alto |
| I4 | SEO/meta tags em landing pages | Baixo |
| I5 | Documentação de API para integradores | Médio |
| I6 | Monitoramento de uptime (Vercel já tem, mas alertas?) | Baixo |
| I7 | Backup automatizado do Supabase | Baixo |

---

## 6. CÁLCULO DA PORCENTAGEM

### Definição: 100% = MVP Público Pago (SaaS)
Um produto SaaS multi-vertical que aceita cadastros pagos, com pelo menos 1 verticalização 100% funcional, billing integrado, e infra confiável.

### Breakdown por Pilar

| Pilar | Peso | Progresso | Contribuição |
|-------|------|-----------|--------------|
| **Core Auth/Multi-tenant** | 20% | 85% | 17.0% |
| **Billing/Monetização** | 15% | 35% | 5.3% |
| **Verticalização Principal (Fire Protection)** | 15% | 75% | 11.3% |
| **Verticalização #2 (DanceFlow)** | 10% | 70% | 7.0% |
| **Verticalização #3 (AgroFlowAI)** | 10% | 60% | 6.0% |
| **Admin Panel** | 5% | 90% | 4.5% |
| **Portais de Usuário** | 5% | 70% | 3.5% |
| **Módulos Builder (15)** | 5% | 60% | 3.0% |
| **Testes & QA** | 5% | 10% | 0.5% |
| **DevOps/Infra/Docs** | 5% | 65% | 3.3% |
| **UX/Onboarding/Legal** | 5% | 20% | 1.0% |

---

## 📊 RESULTADO FINAL

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   PROGRESSO ATUAL:          62.4%                    ║
║   META PARA LANÇAMENTO:     85%                      ║
║   DISTÂNCIA:                22.6 pontos              ║
║                                                      ║
║   ████████████████████░░░░░░░░░░  62%                ║
║   █████████████████████████████░  85% (meta)         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

### Por que 85% e não 100%?

O lançamento como MVP não exige perfeição. Com **85%**, significa:
- ✅ Billing funcional de ponta a ponta
- ✅ Pelo menos 1 verticalização production-ready
- ✅ Testes nos fluxos críticos
- ✅ RLS corrigido
- ✅ Onboarding básico
- ✅ Legal/compliance mínimo
- ⏳ Features como ERP completo, marketplace maduro, multi-unit avançado podem vir no V1.1+

### Roadmap para chegar a 85% (estimativa)

| Sprint | Foco | Ganho |
|--------|------|-------|
| Sprint 1 (1-2 sem) | Stripe end-to-end + Customer Portal | +8% |
| Sprint 2 (1-2 sem) | RLS real + Verificação e-mail + Error boundaries | +5% |
| Sprint 3 (1-2 sem) | Testes críticos (auth, payment, isolation) | +4% |
| Sprint 4 (1 sem) | Onboarding wizard + Pricing page + Legal | +4% |
| Sprint 5 (1 sem) | Polish: Fire Protection 100%, docs, .env.example | +2% |

**Estimativa: 5-8 semanas de trabalho focado para atingir 85% (lançável).**

---

## 7. PONTOS FORTES DO ECOSSISTEMA

1. **Arquitetura multi-tenant sólida** - `studio_id` em todas as tabelas, middleware robusto
2. **3 verticalizações com landing + dashboard + portais** - raro para v0.1
3. **85 migrations** - schema evoluído organicamente, iterativo
4. **Builder de nichos** - 60+ nichos mapeados em `business-modes.ts`
5. **AI Router por nicho** - cada verticalização tem seu endpoint e regras de camada
6. **Audit completo** já realizado - checkStudioAccess em todas as rotas sensíveis
7. **Módulos toggleáveis** - `guardModule()` no server-side
8. **Programa de afiliados** já com estrutura
9. **Sentry + Pino logging** - observabilidade
10. **Stack moderna** - Next.js 16, React 19, Tailwind 4

## 8. MAIORES RISCOS

1. **RLS permissivo** - um usuário malicioso com Supabase client key pode fazer queries cross-tenant
2. **Billing incompleto** - toda a monetização depende de completar o fluxo Stripe
3. **Zero testes automatizados significativos** - qualquer refactor pode quebrar fluxos
4. **WhatsApp depende de Docker self-hosted** - ponto de falha operacional
5. **Satellite processor é infra separada** - aumenta complexidade de deploy

---

*Relatório gerado automaticamente por análise do codebase em 2026-03-03.*
