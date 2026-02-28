# 🚀 AKAAI CORE (Gemini CLI Edition)

![AKAAI CORE](public/placeholder-logo.png)

> **O Ecossistema Definitivo para Gestão de Negócios Físicos e Digitais.**
> Uma plataforma SaaS White-Label, Multi-Tenant e Omnichannel, projetada para escalar operações complexas com inteligência artificial e automação financeira.
>
> **Also known as Artificial Intelligence HUB.**

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura do Ecossistema](#-arquitetura-do-ecossistema)
- [Verticalizações Detalhadas](#-verticalizações-detalhadas)
- [Módulos Transversais](#-módulos-transversais-core)
- [Stack Tecnológica Completa](#-stack-tecnológica-completa)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados e Migrações](#-banco-de-dados-e-migrações)
- [API Routes](#-api-routes)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Guia de Instalação](#-guia-de-instalação)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Cron Jobs](#-cron-jobs)
- [Testes](#-testes)

---

## 📋 Sobre o Projeto

O **AKAAI CORE** evoluiu de um ERP tradicional para um **Motor de Verticalização de Negócios**. Ele permite criar soluções de software ultra-específicas (Nichos) sobre uma base sólida e compartilhada de autenticação, pagamentos e gestão.

### 🎯 A Revolução das "Verticalizações"

Diferente de sistemas genéricos, o AKAAI CORE permite "instanciar" regras de negócio completamente diferentes para nichos distintos, convivendo na mesma infraestrutura:

| Verticalização | Nicho | Status |
| :--- | :--- | :--- |
| **🚒 Fire Protection** | Engenharia & Segurança contra Incêndio | Ativo |
| **🌾 AgroFlow AI** | Agronegócio & Monitoramento de Propriedades | Beta |
| **💃 DanceFlow** | Estúdios de Dança | Ativo |

---

## 🏗️ Arquitetura do Ecossistema

O sistema é dividido em **4 Portais Interconectados + Módulos de Verticalização**:

### 1. 👑 Portal Super Admin (God Mode)
- **Gestão de Parceiros:** Controle de afiliados e revendedores do software.
- **Gestão de Estúdios/Ecossistemas:** Onboarding e administração de clientes.
- **Billing Central:** Controle de assinaturas SaaS e repasses via Stripe Connect.
- **Saúde do Sistema:** Monitoramento de filas, webhooks, logs e erros globais (`/admin/logs`, `/admin/ecosystem-status`).
- **Verticalizações:** Criação e gestão de nichos (Fire Protection, AgroFlow AI, DanceFlow).
- **Configurações:** Planos do sistema, integrações e env vars de ambiente.
- **Testes e IA:** Laboratório de treinamento de conversas IA (`ai_training_conversations`).

### 2. 🤝 Portal do Parceiro (White-Label)
- **Personalização:** Marca e domínio próprios para revendedores.
- **Split de Pagamentos:** Recebimento automático de comissões via Stripe.
- **Gestão de Carteira:** Onboarding de novos clientes (estúdios/fazendas/empresas).
- **Stripe Connect:** Onboarding Express de contas bancárias.

### 3. 🏢 Portal do Cliente/Estúdio (O CORE)
O AKAAI CORE é o coração do ecossistema — a operação que se adapta conforme a verticalização ativada:
- **ERP & CRM:** Vendas, Leads e Pipeline.
- **Financeiro:** Fluxo de caixa, DRE, Contas a Pagar/Receber, `employee_payments`.
- **RH:** Gestão de funcionários e folha de pagamento.
- **Estoque (WMS Lite):** Movimentações e rastreabilidade.
- **POS:** Ponto de venda integrado (Fire Protection).
- **Scanner Monetário:** Análise financeira rápida (DanceFlow).
- **WhatsApp:** Integração para comunicação com clientes.
- **Chat IA:** Atendimento de primeiro nível com Gemini/OpenAI.

### 4. 📱 Portais de Ponta (Apps Específicos)
Interfaces dedicadas para os usuários finais de cada vertical:

| Portal | Verticalização | Funções |
| :--- | :--- | :--- |
| **Aluno** | DanceFlow | Agendamento, turmas, histórico, pagamentos, QR Code de aula |
| **Professor** | DanceFlow | Chamada, turmas, lançamento de conteúdo, feedback |
| **Técnico** | Fire Protection | Checklist de vistoria, scanner de extintores, assinatura digital, fotos em campo |
| **Engenheiro** | Fire Protection | Aprovação de projetos, laudos, PPCI |
| **Arquiteto** | Fire Protection | Projetos e aprovações |
| **Cliente** | Fire Protection / AgroFlow AI | Documentos, aprovações, laudos, perfil |

---

## 📦 Verticalizações Detalhadas

### 🚒 Fire Protection (`/solutions/fire-protection`)

Gestão completa para empresas de engenharia de segurança contra incêndio.

| Módulo | Descrição |
| :--- | :--- |
| **Gestão de Ativos** | Rastreamento de extintores, mangueiras e equipamentos com QR Code e evolução de status |
| **Ordem de Serviço (OS)** | Fluxo completo de instalação, manutenção, vistoria e faturamento |
| **Vistorias Digitais** | App para o técnico coletar evidências em campo (fotos, checklist, assinatura) |
| **Assinatura Digital** | Coleta de aceite do cliente e do engenheiro responsável |
| **Invite Codes** | Códigos específicos para Engenheiros, Técnicos, Clientes e Financeiro |
| **PPCI** | Gestão de Projetos de Prevenção e Proteção Contra Incêndio |
| **PDV** | Ponto de venda para vendas rápidas |
| **Recepção** | Portal de atendimento ao cliente |
| **Relatórios** | Laudos PDF, relatórios gerenciais e IA |

### 🌾 AgroFlow AI (`/solutions/agroflowai`)

Inteligência artificial aplicada ao campo.

| Módulo | Descrição |
| :--- | :--- |
| **Propriedades** | Cadastro geo-referenciado de fazendas e talhões |
| **Satellite Logs** | Integração para monitoramento remoto via imagens de satélite |
| **NDVI / Sentinel Hub** | Análise de vegetação e índices espectrais |
| **NASA FIRMS** | Alertas de incêndios e calor |
| **Documentos e Alertas** | Gestão de conformidade ambiental e avisos automáticos |
| **Status Ativo** | Monitoramento em tempo real da atividade na propriedade |
| **Engenheiros / Técnicos** | Gestão de equipe de campo |
| **OS** | Ordens de serviço para propriedades |

### 💃 DanceFlow (`/solutions/estudio-de-danca`)

Gestão completa para escolas de artes e movimento.

| Módulo | Descrição |
| :--- | :--- |
| **Grade de Horários** | Turmas, salas e professores |
| **Alunos e Matrículas** | Cadastro e inscrições em turmas |
| **Monetary Scanner** | Análise financeira rápida da escola |
| **Consolidação** | Fechamento de caixa e relatórios de performance |
| **App do Professor** | Chamada, lançamento de conteúdo e feedback |
| **App do Aluno** | Turmas, financeiro, QR Code de aula |

---

## 🛠️ Módulos Transversais (Core)

### 🏭 ERP & Estoque
- **Pedidos Unificados:** Vendas balcão, e-commerce e recorrentes.
- **Rastreabilidade:** Log imutável de movimentações (`inventory_transactions`).
- **NCM & Fiscal:** Suporte a dados fiscais para emissão de notas.

### 💰 Financeiro & Pagamentos
- **Stripe Connect Express:** Onboarding automático de contas bancárias.
- **Split de Pagamentos:** Divisão automática (Plataforma, Parceiro, Cliente).
- **Assinaturas:** Recorrência mensal/anual com retry inteligente.
- **Notas Fiscais:** Integração via API externa (`NOTES_API_URL`).

### 🤖 IA & Automação (Gemini + OpenAI)
- **Studio AI Reports:** Relatórios gerenciais gerados automaticamente (`studio_ai_reports`).
- **Chatbot Inteligente:** Atendimento de primeiro nível (Gemini ou OpenAI).
- **AI Contact Rules:** Regras de assunto por camada de contato (`ai_contact_rules`).
- **AI Training Conversations:** Dataset para treinamento de matrícula/agendamento.
- **Análise de Dados:** Insights sobre retenção e faturamento.

### 🎫 Suporte & HelpDesk
- Sistema de tickets interno com priorização (SLA).
- Comunicação direta entre usuário final e suporte.

### 📣 Comunicação
- **WhatsApp (Evolution API):** Envios de notificações, lembretes e webhooks.
- **Email (Nodemailer SMTP):** Transacionais e marketing (Gmail, Resend, etc.).

---

## 💻 Stack Tecnológica Completa

### Frontend

| Tecnologia | Versão | Uso |
| :--- | :--- | :--- |
| **Next.js** | 16.0.10 | Framework full-stack com App Router |
| **React** | 19.2.0 | Biblioteca de UI |
| **TypeScript** | ^5 | Tipagem estática |
| **Tailwind CSS** | ^4.1.9 | Estilização utilitária |
| **PostCSS** | ^8.5 | Processamento CSS |
| **tw-animate-css** | 1.3.3 | Animações Tailwind |
| **Shadcn/UI** | New York style | Componentes acessíveis (Radix UI) |
| **Framer Motion** | ^12.31.0 | Animações |
| **Lucide React** | ^0.454.0 | Ícones |
| **Recharts** | 2.15.4 | Gráficos e dashboards |
| **next-themes** | ^0.4.6 | Tema claro/escuro |
| **Sonner** | ^1.7.4 | Toasts e notificações |
| **React Three Fiber** | 9.5.0 | Cena 3D própria (Splash AKAAI, sem attribution) |
| **Leaflet + React-Leaflet** | ^1.9.4 / ^5.0.0 | Mapas (AgroFlow AI) |
| **jsPDF + jspdf-autotable** | ^4.2.0 / ^5.0.7 | Geração de PDFs |
| **html5-qrcode** | ^2.3.8 | Leitura de QR Codes |
| **react-qr-code** | ^2.0.18 | Geração de QR Codes |
| **react-signature-canvas** | ^1.1.0 | Assinatura digital |
| **react-resizable-panels** | ^2.1.7 | Painéis redimensionáveis |
| **date-fns** | 4.1.0 | Manipulação de datas |
| **XLSX** | ^0.18.5 | Exportação Excel |
| **fast-xml-parser** | ^5.3.5 | Parsing XML |
| **vaul** | ^1.1.2 | Drawer UI |
| **embla-carousel-react** | 8.5.1 | Carrosséis |
| **cmdk** | 1.0.4 | Command palette |
| **input-otp** | 1.4.1 | Inputs OTP |
| **react-hook-form** | ^7.60.0 | Formulários |
| **@hookform/resolvers** | ^3.10.0 | Resolvers (Zod) |
| **Zod** | 3.25.76 | Validação de schemas |
| **class-variance-authority** | ^0.7.1 | CVA para variantes |
| **clsx** + **tailwind-merge** | ^2.1.1 / ^3.3.1 | Utilitários de classe |

### Backend & Infraestrutura

| Tecnologia | Uso |
| :--- | :--- |
| **Supabase** | PostgreSQL, Auth, Realtime, Storage, Row Level Security (RLS) |
| **@supabase/supabase-js** | ^2.95.3 |
| **@supabase/ssr** | ^0.8.0 |
| **postgres** | ^3.4.8 |
| **Stripe** | ^20.3.1 |
| **Upstash Redis** | ^1.36.2 / @upstash/ratelimit ^2.0.8 |
| **Sentry** | @sentry/nextjs ^10.38.0 |
| **Pino** | ^10.3.1 |
| **pino-pretty** | ^13.1.3 |
| **pino-sentry** | ^0.15.0 |
| **Nodemailer** | ^8.0.1 |
| **dotenv** | ^17.3.1 |
| **@vercel/analytics** | 1.3.1 |
| **@vercel/speed-insights** | ^1.3.1 |

### IA

| Provider | Variável | Uso |
| :--- | :--- | :--- |
| **Google Gemini** | `GOOGLE_AI_API_KEY` | Chat IA, relatórios, roteamento |
| **OpenAI** | `OPENAI_API_KEY` | Alternativa ao Gemini no chat |

### Testes

| Tecnologia | Uso |
| :--- | :--- |
| **Jest** | Unitários e integração |
| **@testing-library/jest-dom** | ^6.9.1 |
| **Cypress** | ^15.10.0 |
| **jsdom** | Ambiente de teste Jest |

---

## 🔐 Variáveis de Ambiente

### Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# IA (pelo menos uma)
GOOGLE_AI_API_KEY=AIza...
# ou
OPENAI_API_KEY=sk-...
```

### Opcionais (Recomendadas em Produção)

```env
# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Email (Nodemailer)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu@email.com
EMAIL_SENDER_ADDRESS=seu@email.com
EMAIL_SENDER_NAME=AKAAI CORE
EMAIL_SENDER_PASSWORD=senha-de-app
EMAIL_SECURE=false

# WhatsApp (Evolution API)
WEBHOOK_WHATSAPP_SECRET=seu-secret-hmac
EVOLUTION_WEBHOOK_SECRET=seu-secret
INTERNAL_AI_SECRET=chave-interna-ia

# Rate Limit (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Cron (Vercel)
CRON_SECRET=chave-secreta-cron

# Monitoramento
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Banco (scripts/migrações diretas)
DATABASE_URL=postgresql://...

# Debug (apenas desenvolvimento)
DEBUG_MODE=false
ADMIN_ENV_DISABLED=false

# Log
LOG_LEVEL=info
```

### Por Verticalização

```env
# AgroFlow AI - Satélite
SENTINEL_HUB_CLIENT_ID=...
SENTINEL_HUB_CLIENT_SECRET=...
NASA_FIRMS_API_KEY=...
SATELLITE_PROCESSOR_URL=http://localhost:8001

# Notas Fiscais
NOTES_API_URL=...
NOTES_API_TOKEN=...
```

---

## 📁 Estrutura do Projeto

```
akaai-core/
├── app/                    # App Router (Next.js 16)
│   ├── admin/              # Portal Super Admin
│   ├── portal/             # Portal Parceiro / Afiliado
│   ├── dashboard/          # Dashboard do estúdio
│   ├── solutions/          # Verticalizações
│   │   ├── fire-protection/
│   │   ├── agroflowai/
│   │   └── estudio-de-danca/
│   ├── technician/         # Portal técnico
│   ├── student/            # Portal aluno
│   ├── seller/             # Portal vendedor
│   ├── finance/            # Módulo financeiro
│   ├── api/                # API Routes
│   └── auth/               # Autenticação
├── components/             # Componentes React
├── lib/                    # Utilitários, hooks, config
├── config/                 # Configurações (Supabase, traduções)
├── database/
│   ├── migrations/         # 85+ migrações SQL
│   └── schema.sql
├── scripts/                # init-database, etc.
├── public/                 # Assets estáticos
├── cypress/                # E2E tests
└── jest.setup.ts
```

---

## 🗄️ Banco de Dados e Migrações

O sistema possui **~85 migrações** numeradas em `database/migrations/`, cobrindo:

- **01–25:** Core (leads, estoque, ERP, marketplace, invoices, support)
- **26–40:** Planos, OS, assets, PPCI, documentos, assinatura
- **41–60:** Fire Protection (técnicos, PDV, vistorias, extintores, invite codes)
- **61–70:** DanceFlow (verticalização, monetary scanner, consolidação)
- **71–85:** AgroFlow AI, Fire Protection (invites internos), IA (reports, training, contact rules)

Execute em ordem numérica no SQL Editor do Supabase ou via script.

```bash
# Verificar conexão
pnpm db:test

# Inicializar e popular dados padrão
pnpm db:init

# Seed de dados
pnpm db:seed
```

---

## 🔌 API Routes

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/auth/register` — Registro
- `POST /api/auth/verify-email/send` — Enviar confirmação
- `POST /api/auth/verify-email/confirm` — Confirmar e-mail
- `POST /api/auth/resend-confirmation` — Reenviar confirmação
- `POST /api/auth/verify-phone/send` — Verificação de telefone

### Admin
- `GET/POST /api/admin/users` — Usuários internos
- `GET/POST/PATCH /api/admin/studios/[id]` — Estúdios
- `GET /api/admin/logs` — Logs do sistema
- `GET /api/admin/logs/health` — Health check de logs
- `GET /api/admin/env` — Variáveis de ambiente (dev)
- `POST /api/admin/checkout` — Checkout Stripe
- `POST /api/admin/reports/generate` — Relatórios
- `GET /api/admin/verticalizations` — Verticalizações
- `POST /api/admin/ai-training` — Treinamento IA

### Fire Protection
- `/api/fire-protection/customers` — Clientes
- `/api/fire-protection/technicians` — Técnicos
- `/api/fire-protection/os/[id]` — Ordens de serviço
- `/api/fire-protection/vistorias/[id]` — Vistorias e laudos
- `/api/fire-protection/studio/*-invite-code` — Códigos de convite
- `/api/fire-protection/ai/chat` — Chat IA
- `/api/fire-protection/relatorios` — Relatórios
- `/api/fire-protection/whatsapp/*` — WhatsApp

### AgroFlow AI
- `/api/agroflowai/propriedades` — Propriedades
- `/api/agroflowai/os` — Ordens de serviço
- `/api/agroflowai/engenheiros`, `/tecnicos` — Equipe
- `/api/agroflowai/laudos`, `/documentos`, `/alertas` — Documentos e alertas
- `/api/agroflowai/ndvi`, `/satelite` — Satélite e NDVI

### Dance Studio
- `/api/dance-studio/students` — Alunos
- `/api/dance-studio/teachers` — Professores
- `/api/dance-studio/classes` — Turmas
- `/api/dance-studio/enrollments` — Matrículas

### Webhooks
- `/api/webhooks/stripe` — Stripe
- `/api/webhooks/whatsapp` — Evolution API (WhatsApp)

### Cron (Vercel)
- `/api/cron/reminders` — Lembretes diários (0 0 * * *)
- `/api/cron/fire-protection-reminders` — Lembretes Fire Protection
- `/api/cron/process-no-shows` — Processar faltas
- `/api/cron/studios-cleanup` — Limpeza de estúdios

---

## 📜 Scripts Disponíveis

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| Desenvolvimento | `pnpm dev` | Inicia Next.js em modo dev |
| Build | `pnpm build` | Build de produção |
| Start | `pnpm start` | Serve build de produção |
| Lint | `pnpm lint` | ESLint |
| Testes | `pnpm test` | Jest |
| Cypress (abrir) | `pnpm cypress:open` | Interface Cypress |
| Cypress (headless) | `pnpm cypress:run` | Execução E2E |
| DB init | `pnpm db:init` | Inicializa banco e dados padrão |
| DB test | `pnpm db:test` | Testa conexão Supabase |
| DB seed | `pnpm db:seed` | Seed de dados padrão |

---

## 🚀 Guia de Instalação

### Pré-requisitos
- **Node.js** 20+
- **pnpm**
- Conta **Supabase**
- Conta **Stripe**
- (Opcional) Chave **Google AI** ou **OpenAI**

### 1. Clonar e instalar
```bash
git clone https://github.com/seu-repo/akaai-core.git
cd akaai-core
pnpm install
```

### 2. Configurar `.env`
Copie as variáveis obrigatórias e opcionais da seção [Variáveis de Ambiente](#-variáveis-de-ambiente).

### 3. Banco de dados
Execute as migrações em `database/migrations/` no SQL Editor do Supabase, em ordem numérica.

```bash
pnpm db:test
pnpm db:init
pnpm db:seed
```

### 4. Rodar
```bash
pnpm dev
```
Acesse `http://localhost:3000`.

---

## 🔒 Segurança

- **RLS (Row Level Security):** Dados isolados por `studio_id` e permissões de usuário.
- **Middleware de Proteção:** Verificação de licenças ativas antes de liberar rotas de verticalizações.
- **Server Actions:** Lógica sensível executada exclusivamente no servidor.
- **Rate Limit:** Upstash Redis (produção) ou fallback em memória (dev) para login/registro.
- **Webhooks:** Assinatura HMAC para WhatsApp (Evolution API) e Stripe.
- **Cron:** `CRON_SECRET` para validar chamadas dos crons da Vercel.
- **Sentry:** Monitoramento de erros e performance.

---

## 🚢 Deploy

O projeto está configurado para **Vercel**:

- **Framework:** Next.js
- **Install:** `pnpm install`
- **Build:** `next build`
- **Crons:** `/api/cron/reminders` (diário)
- **Images:** `unoptimized: true` (configurável)
- **Sentry:** Integrado via `withSentryConfig`

Configure as variáveis de ambiente no painel da Vercel.

---

## ⏰ Cron Jobs

| Path | Schedule | Descrição |
| :--- | :--- | :--- |
| `/api/cron/reminders` | `0 0 * * *` (diário) | Lembretes gerais |
| `/api/cron/fire-protection-reminders` | — | Lembretes Fire Protection |
| `/api/cron/process-no-shows` | — | Processar faltas (aulas) |
| `/api/cron/studios-cleanup` | — | Limpeza de estúdios |

Todos validam `CRON_SECRET` em produção.

---

## 🧪 Testes

- **Jest:** Unitários e integração (`pnpm test`)
- **Cypress:** E2E (`pnpm cypress:open` / `pnpm cypress:run`)
- **Coverage:** `v8`
- **Environment:** `jsdom`
- **Setup:** `jest.setup.ts`, `@testing-library/jest-dom`
- **Aliases:** `@/*` mapeado para raiz

---

## 📄 Licença

© 2026 AKAAI CORE. Engine of Excellence.
