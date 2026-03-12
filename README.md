# 🚀 AKAAI CORE - Motor de Verticalização de Negócios

![AKAAI CORE](public/akaaihub-logo.png)

> **A Plataforma Definitiva para Escala de Negócios Verticais.**
> Um ecossistema SaaS White-Label, Multi-Tenant e Omnichannel que transforma qualquer nicho de mercado em uma solução de software completa e escalável.
>
> **Also known as Artificial Intelligence HUB.**
>
> **Projeto**: `workflow-pro-builder` v0.1.1

---

## 📋 Índice

- [Ecossistema Técnico](#-ecossistema-técnico)
- [Visão Executiva](#-visão-executiva)
- [Proposta de Valor](#-proposta-de-valor)
- [Arquitetura do Ecossistema](#-arquitetura-do-ecossistema)
- [Verticalizações Disponíveis](#-verticalizações-disponíveis)
- [Modelo de Negócio](#-modelo-de-negócio)
- [Stack Tecnológica](#-stack-tecnológica)
- [Módulos e Funcionalidades](#-módulos-e-funcionalidades)
- [Nichos Suportados](#-nichos-suportados)
- [Implementação Técnica](#-implementação-técnica)
- [Segurança e Compliance](#-segurança-e-compliance)
- [Infraestrutura e Deploy](#-infraestrutura-e-deploy)
- [API e Integrações](#-api-e-integrações)
- [Monitoramento e Analytics](#-monitoramento-e-analytics)
- [Guia de Instalação](#-guia-de-instalação)
- [Documentação de Referência](#-documentação-de-referência)

---

## 🔧 Ecossistema Técnico

### Identificação do Projeto

| Item | Valor |
| :--- | :--- |
| **Nome do pacote** | `workflow-pro-builder` |
| **Versão** | 0.1.1 |
| **Gerenciador de pacotes** | pnpm 8+ |
| **Runtime** | Node.js 20+ (LTS) |
| **Tipo** | ESM (module) |

### Estrutura de Pastas Principais

```
workflow-pro-builder/
├── app/                    # Next.js App Router (rotas, páginas, API)
│   ├── admin/              # Portal Super Admin
│   ├── partner/            # Portal do Parceiro
│   ├── dashboard/          # Dashboard genérico
│   ├── solutions/          # Verticalizações
│   │   ├── fire-protection/ # Fire Protection (engenharia)
│   │   ├── agroflowai/     # AgroFlow AI (agronegócio)
│   │   └── estudio-de-danca/ # DanceFlow (dança)
│   └── api/                # API Routes
├── components/             # Componentes React
├── config/                 # Configurações centralizadas
│   ├── niche-dictionary.ts # Vocabulário por nicho (70+ nichos)
│   ├── portal-routes.ts    # Rotas por verticalização
│   ├── verticalization-nav-modules.ts
│   ├── fire-protection-nav.ts
│   ├── agroflow-nav.ts
│   ├── dance-studio-nav.ts
│   └── supabase.js         # Config Supabase (scripts Node)
├── database/
│   └── migrations/         # 116+ migrações SQL
├── lib/                    # Utilitários, actions, hooks
│   ├── supabase/           # Cliente Supabase (client, server)
│   ├── actions/             # Server Actions (ecosystem.ts, etc.)
│   └── ...
├── microservices/
│   └── fiscal-php/         # Microserviço NF-e (PHP 8.2+)
├── scripts/                # Scripts de manutenção (55+)
├── supabase/
│   └── migrations/         # Migrações Supabase CLI
└── mcps/                   # MCP servers (Vercel, Supabase)
```

### Scripts NPM/PNPM

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| **Desenvolvimento** | `pnpm dev` | Inicia Next.js em `0.0.0.0` (acesso em rede) |
| **Build** | `pnpm build` | Build de produção |
| **Start** | `pnpm start` | Inicia servidor de produção |
| **Lint** | `pnpm lint` | ESLint |
| **Testes** | `pnpm test` | Jest (unitários) |
| **Cypress** | `pnpm cypress:open` / `pnpm cypress:run` | Testes E2E |
| **Banco** | `pnpm db:init` | Inicializa banco (Supabase) |
| **Banco** | `pnpm db:test` | Testa conexão Supabase |
| **Banco** | `pnpm db:seed` | Seed de dados iniciais |
| **Banco** | `pnpm db:test-postgres` | Teste conexão Postgres |
| **Banco** | `pnpm db:test-supabase` | Teste conexão Supabase |
| **Banco** | `pnpm db:test-cache` | Teste cache |
| **Banco** | `pnpm db:test-chat` | Teste contexto do chat |
| **Banco** | `pnpm db:test-chat-improvements` | Teste melhorias do chat |
| **Fiscal** | `pnpm fiscal:generate-key` | Gera chave fiscal |

### Verticalizações e Rotas

| Slug | Nicho | Base URL | Perfis Específicos |
| :--- | :--- | :--- | :--- |
| `fire-protection` | Engenharia contra incêndio | `/solutions/fire-protection` | Técnico, Engenheiro, Arquiteto, Cliente |
| `agroflowai` | Agronegócio | `/solutions/agroflowai` | Engenheiro, Técnico, Cliente |
| `estudio-de-danca` | Dança / Artes | `/solutions/estudio-de-danca` | Professor, Aluno, Cliente |

### Microserviços

| Serviço | Stack | Descrição |
| :--- | :--- | :--- |
| **fiscal-php** | PHP 8.2, Slim, nfephp-org/sped-nfe | Emissor NF-e stateless |

### MCP (Model Context Protocol)

Servidores MCP disponíveis para integração:

- **user-Vercel**: Deploy e configuração Vercel
- **user-supabase**: Banco de dados e autenticação Supabase

### Variáveis de Ambiente

#### Obrigatórias (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IA (pelo menos uma)
GOOGLE_AI_API_KEY=
# OPENAI_API_KEY=
```

#### Opcionais

```env
# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# WhatsApp
WEBHOOK_WHATSAPP_SECRET=
EVOLUTION_WEBHOOK_SECRET=
```

### Banco de Dados

- **PostgreSQL** via Supabase
- **116+ migrações** em `database/migrations/`
- **Migrações Supabase CLI** em `supabase/migrations/`
- **RLS** (Row Level Security) em todas as tabelas
- **Multi-tenant** via `studio_id`

### Dependências Principais (package.json)

| Categoria | Pacotes |
| :--- | :--- |
| **Framework** | next 16.0.10, react 19.2.0 |
| **Supabase** | @supabase/ssr, @supabase/supabase-js |
| **UI** | Radix UI, tailwindcss 4.1.9, framer-motion |
| **Forms** | react-hook-form, @hookform/resolvers, zod |
| **Pagamentos** | stripe |
| **Cache/Rate Limit** | @upstash/redis, @upstash/ratelimit |
| **Monitoramento** | @sentry/nextjs, @vercel/analytics |
| **Outros** | leaflet, recharts, jspdf, html5-qrcode, nodemailer |

### Scripts de Manutenção (pasta `scripts/`)

| Script | Uso |
| :--- | :--- |
| `init-database.js` | Inicialização do banco |
| `apply-all-pending-migrations.js` | Aplicar migrações pendentes |
| `create-admin-user.js` | Criar usuário admin |
| `ensure-super-admin.js` | Garantir super admin |
| `fix-super-admin.js` / `fix-super-admin-role.js` | Correções de permissão |
| `check-auth-users.js` | Verificar usuários autenticados |
| `list-partners.js` | Listar parceiros |
| `list-recent-studios.js` | Listar estúdios recentes |
| `setup-system-plans.js` | Configurar planos do sistema |
| `diagnose-db.js` | Diagnóstico de banco |

---

## 🎯 Visão Executiva

O **AKAAI CORE** representa a evolução dos sistemas ERP tradicionais para um **Motor de Verticalização Inteligente**. Nossa plataforma permite que qualquer negócio — desde estúdios de dança até empresas de engenharia — possa operar com software sob medida, mantendo a robustez de uma infraestrutura enterprise.

### 🏆 Diferenciais Competitivos

| Característica | Impacto no Negócio |
| :--- | :--- |
| **Verticalização em Tempo Real** | Adaptação instantânea a qualquer nicho de mercado |
| **Inteligência Artificial Integrada** | Automação de 80% das operações repetitivas |
| **Multi-Tenant Isolado** | Segurança de dados com compartilhamento de custos |
| **White-Label Completo** | Sua marca, seu domínio, sua identidade visual |
| **Split de Pagamentos Automático** | Modelo de receita para parceiros e afiliados |
| **Omnichannel Nativo** | WhatsApp, Email, Web, Mobile em uma única plataforma |

---

## 💡 Proposta de Valor

### Para Empresas (Clientes Finais)
- **Redução de 70% no TCO** (Total Cost of Ownership) comparado a soluções customizadas
- **Time-to-Market de 7 dias** vs 6 meses de desenvolvimento tradicional
- **Automação Inteligente** com IA treinada para seu nicho específico
- **Escalabilidade Ilimitada** sem preocupações com infraestrutura

### Para Parceiros e Afiliados
- **Receita Recorrente** com split automático via Stripe Connect
- **Zero Investimento em TI** — plataforma pronta para uso
- **Branding Próprio** — sua marca, seu sucesso
- **Suporte Premium** com SLA de 99.9% uptime

### Para Desenvolvedores e Agências
- **API Completa** para customizações e extensões
- **Webhooks em Tempo Real** para integrações externas
- **Sandbox Completo** para desenvolvimento e testes
- **Documentação Abrangente** com exemplos práticos

---

## 🏗️ Arquitetura do Ecossistema

O AKAAI CORE é composto por **4 Portais Estratégicos + Motor de Verticalização**:

### 1. 👑 Portal Super Admin (God Mode)
**Centro de Controle Global do Ecossistema**

| Módulo | Funcionalidades |
| :--- | :--- |
| **Gestão de Parceiros** | Onboarding, comissões, Stripe Connect, relatórios de performance |
| **Gestão de Estúdios** | Provisionamento, health checks, migrações, billing |
| **Billing Central** | Assinaturas SaaS, split de pagamentos, faturamento automático |
| **Monitoramento** | Logs centralizados, métricas de sistema, alertas proativos |
| **Verticalizações** | Criação de nichos, configuração de regras, deploy de features |
| **AI Lab** | Treinamento de modelos, fine-tuning, analytics de conversações |
| **Compliance** | Auditorias, relatórios regulatórios, gestão de riscos |

### 2. 🤝 Portal do Parceiro (White-Label)
**Operação Comercial e Gestão de Carteira**

- **Personalização Completa**: Logo, cores, domínio, emails transacionais
- **Gestão de Clientes**: Onboarding, suporte, upselling, churn prevention
- **Financeiro**: Comissões em tempo real, relatórios de receita, previsões
- **Marketing**: Campanhas automatizadas, landing pages, funis de conversão
- **Analytics**: KPIs de performance, cohort analysis, LTV/CAC

### 3. 🏢 Portal do Cliente (Operação do Negócio)
**O Coração da Operação Verticalizada**

#### Core ERP/CRM
- **Gestão de Relacionamento**: Pipeline completo, histórico 360°, automação
- **Financeiro**: Fluxo de caixa, DRE, contas a pagar/receber, conciliação bancária
- **Estoque (WMS Lite)**: Multi-armazém, rastreabilidade LIFO/FIFO, alertas automáticos
- **Compras**: Cotação, ordens de compra, recebimento, qualidade

#### Módulos Especializados
- **POS Integrado**: Vendas rápidas, emissão de recibos, integração com estoque
- **Agendamento Inteligente**: Otimização de recursos, confirmações automáticas
- **Gestão de Serviços**: Ordens de serviço, checklists, assinatura digital
- **RH Lite**: Folha de pagamento, ponto, benefícios, performance

### 4. 📱 Portais de Ponta (Apps Específicos)
**Interfaces Otimizadas por Perfil e Vertical**

| Portal | Público | Verticalizações | Funcionalidades Principais |
| :--- | :--- | :--- | :--- |
| **Aluno Portal** | Estudantes/Alunos | DanceFlow, Escolas | Turmas, presença QR, pagamentos, histórico |
| **Professor Portal** | Instrutores/Professores | DanceFlow, Academias | Chamada, conteúdo, feedback, agenda |
| **Técnico Portal** | Técnicos de Campo | Fire Protection | OS mobile, fotos, checklist, assinatura |
| **Engenheiro Portal** | Engenheiros/Arquitetos | Fire Protection | Aprovações, laudos, projetos, PPCI |
| **Cliente Portal** | Clientes Finais | Todas | Documentos, aprovações, perfil, comunicação |

---

## 🎪 Verticalizações Disponíveis

### 🚒 **Fire Protection** (Engenharia & Segurança)
**Gestão completa para empresas de engenharia contra incêndio**

| Módulo | Descrição Detalhada |
| :--- | :--- |
| **Asset Management** | Rastreamento de extintores com QR Code, histórico de manutenções, alertas de vencimento |
| **Ordens de Serviço** | Fluxo completo: instalação → manutenção → vistoria → faturamento |
| **Vistorias Digitais** | App mobile com fotos geolocalizadas, checklist padronizado, assinatura digital |
| **PPCI Management** | Projetos de Prevenção, cálculos de carga de incêndio, aprovações |
| **Invite Codes** | Códigos específicos por perfil: Engenheiro, Técnico, Cliente, Financeiro |
| **PDV Integrado** | Vendas rápidas de equipamentos, emissão de recibos, controle de caixa |
| **Relatórios Técnicos** | Laudos PDF automáticos, relatórios gerenciais, analytics IA |
| **Compliance** | Normas ABNT, regulamentações locais, auditorias automáticas |

### 🌾 **AgroFlow AI** (Agronegócio & Monitoramento)
**Inteligência artificial aplicada ao campo e propriedades rurais**

| Módulo | Descrição Detalhada |
| :--- | :--- |
| **Propriedades Geo-referenciadas** | Cadastro de fazendas, talhões, polígonos, coordenadas GPS |
| **Satellite Monitoring** | Integração Sentinel Hub, NASA FIRMS, análise NDVI em tempo real |
| **Environmental Compliance** | CAR, licenças ambientais, relatórios de conformidade |
| **Document Management** | Laudos, certificados, documentos digitais com assinatura |
| **Alert System** | Incêndios, pragas, condições climáticas, anomalias detectadas |
| **Team Management** | Engenheiros, agrônomos, técnicos com geolocalização |
| **Mobile Field Operations** | Coleta de dados em campo, fotos, formulários customizados |
| **Analytics Predictive** | Previsão de safras, análise de solo, recomendações IA |

### 💃 **DanceFlow** (Artes & Movimento)
**Gestão completa para escolas de dança, artes e movimento**

| Módulo | Descrição Detalhada |
| :--- | :--- |
| **Grade Inteligente** | Turmas, salas, professores, otimização automática de horários |
| **Gestão de Alunos** | Cadastro completo, histórico, avaliações, progressão |
| **Monetary Scanner** | Análise financeira instantânea, métricas de saúde do negócio |
| **Consolidação** | Fechamento mensal automático, relatórios de performance |
| **App Professor** | Chamada digital, lançamento de conteúdo, feedback individual |
| **App Aluno** | QR Code de entrada, turmas, financeiro, comunicados |
| **Gamificação** | Pontos, conquistas, ranking, engajamento |
| **Eventos** | Shows, apresentações, inscrições, gestão de ingressos |

---

## 💼 Modelo de Negócio

### 📊 Estrutura de Planos

| Plano | Preço | Limites | Verticalizações |
| :--- | :--- | :--- | :--- |
| **Starter** | $299/mês | 100 alunos, 3 usuários | 1 verticalização |
| **Professional** | $799/mês | 500 alunos, 10 usuários | 2 verticalizações |
| **Enterprise** | $1999/mês | Ilimitado, 25 usuários | Todas verticalizações |
| **Custom** | Sob consulta | Ilimitado | Verticalizações customizadas |

### 🔄 Modelo de Receita para Parceiros

- **Comissão Recorrente**: 20-30% sobre assinaturas mensais
- **Split de Pagamentos**: 5% sobre transações via Stripe Connect
- **Bônus de Performance**: Até 15% por metas de crescimento
- **Serviços Premium**: Consultoria, implementação, treinamento

---

## 🛠️ Stack Tecnológica

### Frontend (Next.js 16 + React 19)

| Categoria | Tecnologias |
| :--- | :--- |
| **Framework** | Next.js 16.0.10 (App Router), React 19.2.0, TypeScript 5 |
| **Estilização** | Tailwind CSS 4.1.9, PostCSS 8.5, tw-animate-css 1.3.3 |
| **Componentes** | Radix UI (acessibilidade), Shadcn/UI (New York style) |
| **Animações** | Framer Motion 12.31.0, React Three Fiber 9.5.0 |
| **Ícones** | Lucide React 0.454.0 |
| **Gráficos** | Recharts 2.15.4 |
| **Formulários** | React Hook Form 7.60.0, Zod 3.25.76 |
| **QR Code** | html5-qrcode 2.3.8 (leitura), react-qr-code 2.0.18 (geração) |
| **PDF** | jsPDF 4.2.0, jspdf-autotable 5.0.7 |
| **Assinatura Digital** | react-signature-canvas 1.1.0 |
| **Mapas** | Leaflet 1.9.4, React-Leaflet 5.0.0 |
| **Data Utils** | date-fns 4.1.0, XLSX 0.18.5 |
| **UI Avançada** | react-resizable-panels 2.1.7, vaul 1.1.2, embla-carousel-react 8.5.1 |

### Backend & Infraestrutura

| Categoria | Tecnologias |
| :--- | :--- |
| **Banco de Dados** | Supabase (PostgreSQL), RLS, Realtime, Storage |
| **ORM/Query** | @supabase/supabase-js 2.95.3, postgres 3.4.8 |
| **Pagamentos** | Stripe 20.3.1, Stripe Connect Express |
| **Cache/Rate Limit** | Upstash Redis 1.36.2, @upstash/ratelimit 2.0.8 |
| **Email** | Nodemailer 8.0.1, SMTP (Gmail, Resend, etc.) |
| **WhatsApp** | Evolution API, webhooks HMAC |
| **Monitoramento** | Sentry 10.38.0, Pino 10.3.1 |
| **Analytics** | Vercel Analytics 1.3.1, Speed Insights 1.3.1 |
| **Environment** | dotenv 17.3.1 |

### Inteligência Artificial

| Provider | Uso Específico |
| :--- | :--- |
| **Google Gemini** | Chat IA principal, relatórios automáticos, roteamento inteligente |
| **OpenAI** | Chat IA alternativo, fine-tuning específico por nicho |
| **AI Training** | Dataset customizado, conversações de treinamento |
| **AI Router** | Direcionamento baseado em intenção e contexto |

### Testes e Qualidade

| Categoria | Tecnologias |
| :--- | :--- |
| **Unitários** | Jest, @testing-library/jest-dom 6.9.1 |
| **E2E** | Cypress 15.10.0 |
| **Environment** | jsdom, coverage v8 |
| **Linting** | ESLint, TypeScript strict mode |

---

## 🧩 Módulos e Funcionalidades

### Módulos Core (Disponíveis em todas verticalizações)

| Módulo | Funcionalidades Principais | Status |
| :--- | :--- | :--- |
| **Dashboard** | KPIs em tempo real, gráficos interativos, métricas de negócio | ✅ Ativo |
| **Gestão de Clientes** | CRM 360°, histórico completo, comunicação automatizada | ✅ Ativo |
| **Financeiro** | Fluxo de caixa, DRE, contas, conciliação bancária | ✅ Ativo |
| **Agendamento** | Calendário inteligente, recursos, confirmações | ✅ Ativo |
| **WhatsApp** | Envios automáticos, chatbot, notificações | ✅ Ativo |
| **Chat IA** | Atendimento 24/7, Gemini/OpenAI, treinamento específico | ✅ Ativo |
| **POS** | Vendas rápidas, controle de caixa, integrações | ✅ Ativo |
| **Estoque** | Multi-armazém, rastreabilidade, alertas | ✅ Ativo |
| **Gamificação** | Pontos, conquistas, ranking, engajamento | ✅ Ativo |
| **CRM/Leads** | Funil de vendas, automação, nutrição | ✅ Ativo |
| **Scanner** | QR Code, controle de acesso, validações | ✅ Ativo |
| **Marketplace** | Loja virtual, gestão de pedidos, vitrine | ✅ Ativo |
| **ERP Enterprise** | Gestão completa, módulos customizados | ✅ Ativo |
| **Multi-unidade** | Gestão de filiais, centralização | ✅ Ativo |
| **Ordens de Serviço** | OS completas, checklists, assinatura | ✅ Ativo |

### Módulos Especializados por Verticalização

#### Fire Protection
- **Asset Tracking**: QR codes, manutenções, vencimentos
- **Digital Inspections**: App mobile, fotos, checklists
- **PPCI Projects**: Cálculos, aprovações, documentação
- **Compliance Reports**: ABNT, normas, auditorias

#### AgroFlow AI
- **Satellite Monitoring**: Sentinel Hub, NASA FIRMS, NDVI
- **Environmental Compliance**: CAR, licenças, relatórios
- **Predictive Analytics**: Safras, solo, recomendações
- **Field Operations**: Mobile, geolocalização, formulários

#### DanceFlow
- **Class Management**: Turmas, grade, otimização
- **Student Portal**: QR code, histórico, comunicados
- **Teacher Tools**: Chamada, conteúdo, feedback
- **Performance Analytics**: Métricas, engajamento, retenção

---

## 🎭 Nichos Suportados

O AKAAI CORE suporta **70+ nichos de mercado** organizados por modelo de negócio:

### 📚 Nichos Baseados em Agendamento (Schedule-Based)
**Modelo: Créditos/Mensalidades**

| Categoria | Nichos |
| :--- | :--- |
| **Artes & Movimento** | Dança, Música, Artes Plásticas, Fotografia |
| **Fitness & Esportes** | Academia, Crossfit, Artes Marciais, Natação |
| **Educação** | Idiomas, Tutoria, Escolas, Cursos |
| **Bem-Estar** | Yoga, Pilates, Spa, Meditação |
| **Pets** | Creche Canina, Adestramento, Hotel Pet |

### 🔧 Nichos Baseados em Ordens de Serviço (Service-Based)
**Modelo: Pagamento por Serviço**

| Categoria | Nichos |
| :--- | :--- |
| **Automotivo** | Mecânica, Detailing, Lavagem, Elétrica |
| **Técnico** | Assistência, Instalações, Reparos |
| **Construção** | Engenharia, Reformas, Manutenção |
| **Consultoria** | Jurídico, Marketing, TI, Gestão |
| **Eventos** | Organização, Espaços, Fotografia |
| **Serviços** | Limpeza, Logística, Paisagismo |

### 🏥 Nichos Baseados em Consultas (Appointment-Based)
**Modelo: Consultas Individuais**

| Categoria | Nichos |
| :--- | :--- |
| **Saúde** | Clínicas, Dentistas, Fisioterapia |
| **Beleza** | Salões, Estética, Barbearia, Tatuagem |
| **Veterinário** | Clínicas, Pet Shops |
| **Terapias** | Psicologia, Nutrição, Podologia |

### 🔥 Nichos Especializados (Verticalizações Próprias)

| Nicho | Especialização | Módulos Exclusivos |
| :--- | :--- | :--- |
| **Fire Protection** | Engenharia de Segurança | PPCI, Inspeções, Compliance |
| **AgroFlow AI** | Agronegócio | Satélite, Monitoramento, CAR |
| **DanceFlow** | Artes & Movimento | Performance, Gamificação, Eventos |

---

## ⚙️ Implementação Técnica

### 🗄️ Arquitetura de Dados

**Banco de Dados PostgreSQL com 116+ Migrações**

- **Multi-tenant Isolation**: `studio_id` em todas as tabelas
- **Row Level Security (RLS)**: Políticas granulares por perfil
- **Realtime Subscriptions**: Atualizações em tempo real
- **Audit Trail**: Logs completos de todas as operações

#### Estrutura Principal
```sql
-- Core Tables
studios                 -- Empresas/Estúdios
users                   -- Usuários do sistema
professionals           -- Professores/Funcionários
students                -- Alunos/Clientes
classes                 -- Turmas/Serviços
enrollments             -- Matrículas/Agendamentos
financial_transactions  -- Transações financeiras
inventory_items         -- Itens de estoque
service_orders          -- Ordens de serviço
```

#### Migrações por Fase
- **01-25**: Core (leads, estoque, ERP, marketplace, invoices)
- **26-40**: Planos, OS, assets, PPCI, documentos, assinatura
- **41-60**: Fire Protection (técnicos, PDV, vistorias, extintores)
- **61-70**: DanceFlow (verticalização, scanner, consolidação)
- **71-85**: AgroFlow AI, IA (reports, training, contact rules)
- **86-91**: AI Learning System, Knowledge Base, Advanced Features

### 🔐 Segurança e Compliance

#### Segurança de Dados
- **Multi-tenant Isolation**: Separação completa por `studio_id`
- **RLS Policies**: Controle granular de acesso
- **API Keys**: Chaves específicas por integração
- **Webhook Security**: Assinatura HMAC para todos os webhooks
- **Rate Limiting**: Upstash Redis com limites por endpoint
- **Input Validation**: Zod schemas para toda entrada de dados

#### Compliance Regulatório
- **LGPD**: Conformidade com lei brasileira de proteção de dados
- **PCI DSS**: Processamento seguro de pagamentos via Stripe
- **ISO 27001**: Práticas de segurança da informação
- **Audit Logs**: Registro completo para auditorias

#### Monitoramento de Segurança
- **Sentry**: Error tracking e performance monitoring
- **Admin Logs**: Logs centralizados de operações críticas
- **Health Checks**: Monitoramento contínuo da saúde do sistema
- **Alert System**: Notificações proativas de anomalias

### 🚀 Infraestrutura e Deploy

#### Arquitetura Cloud Native
- **Frontend**: Vercel (Edge Network, Global CDN)
- **Backend**: Serverless Functions (Vercel)
- **Banco de Dados**: Supabase (PostgreSQL na AWS)
- **Cache**: Upstash Redis (Global Edge)
- **Storage**: Supabase Storage (AWS S3)
- **CDN**: Vercel Edge Network

#### CI/CD Pipeline
- **Automated Testing**: Jest (unitários), Cypress (E2E)
- **Code Quality**: ESLint, TypeScript strict mode
- **Security Scanning**: Dependabot, Snyk
- **Performance Monitoring**: Vercel Analytics, Sentry
- **Rollback Strategy**: Deploy por feature flags

#### Escalabilidade
- **Horizontal Scaling**: Serverless auto-scaling
- **Database Pooling**: Supabase connection pooling
- **Edge Caching**: Cache inteligente em CDN
- **Load Balancing**: Distribuição automática de carga

---

## 🌐 API e Integrações

### API RESTful Completa

#### Autenticação
```typescript
POST /api/auth/login          // Login de usuários
POST /api/auth/register       // Registro de novos usuários
POST /api/auth/verify-email   // Verificação de email
POST /api/auth/reset-password // Recuperação de senha
```

#### Gestão de Estúdios
```typescript
GET    /api/admin/studios           // Listar estúdios
POST   /api/admin/studios           // Criar estúdio
PATCH  /api/admin/studios/[id]      // Atualizar estúdio
DELETE /api/admin/studios/[id]      // Remover estúdio
```

#### Verticalizações
```typescript
GET  /api/fire-protection/os/[id]     // Ordens de serviço
GET  /api/agroflowai/properties       // Propriedades
GET  /api/dance-studio/classes        // Turmas
POST /api/[verticalization]/ai/chat    // Chat IA específico
```

#### Webhooks
```typescript
POST /api/webhooks/stripe     // Eventos Stripe
POST /api/webhooks/whatsapp   // Mensagens WhatsApp
POST /api/webhooks/supabase   // Realtime events
```

### Integrações Externas

#### Pagamentos (Stripe)
- **Stripe Connect**: Split automático para parceiros
- **Subscriptions**: Assinaturas recorrentes com retry
- **Invoicing**: Faturas automáticas
- **Disputes**: Gestão de chargebacks

#### Comunicação
- **WhatsApp (Evolution API)**: Envios massivos, chatbot
- **Email (Nodemailer)**: Transacionais, marketing
- **SMS (Twilio)**: Verificações, alertas

#### Inteligência Artificial
- **Google Gemini**: Chat principal, relatórios
- **OpenAI**: Alternative chat, fine-tuning
- **Custom Models**: Treinamento específico por nicho

#### Monitoramento
- **Sentry**: Error tracking, performance
- **Vercel Analytics**: User behavior
- **Upstash**: Rate limiting, cache

---

## 📊 Monitoramento e Analytics

### Business Intelligence

#### KPIs em Tempo Real
- **MRR (Monthly Recurring Revenue)**: Receita mensal recorrente
- **Churn Rate**: Taxa de cancelamento por cohort
- **LTV (Lifetime Value)**: Valor vitalício do cliente
- **CAC (Customer Acquisition Cost)**: Custo de aquisição
- **MAU/DAU**: Usuários ativos (mensal/diário)

#### Dashboards Especializados
- **Super Admin**: Visão completa do ecossistema
- **Parceiros**: Performance comercial e financeira
- **Clientes**: Métricas operacionais do negócio
- **Verticalização**: KPIs específicos por nicho

### System Monitoring

#### Health Checks
```typescript
GET /api/health/database    // Conexão com banco
GET /api/health/redis       // Cache status
GET /api/health/stripe      // Pagamentos status
GET /api/health/ai          // IA services status
```

#### Alerting
- **System Errors**: Notificações instantâneas via Slack/Email
- **Performance Issues**: Alertas de latência e throughput
- **Business Metrics**: Anomalias em KPIs críticos
- **Security Events**: Tentativas de acesso suspeitas

---

## 🚀 Guia de Instalação

### Pré-requisitos Mínimos

- **Node.js**: 20+ (LTS recomendado)
- **pnpm**: 8+ (gerenciador de pacotes) — `npm i -g pnpm`
- **Conta Supabase**: Projeto PostgreSQL em [supabase.com](https://supabase.com)
- **Chave IA**: Google Gemini (`GOOGLE_AI_API_KEY`) ou OpenAI (`OPENAI_API_KEY`)
- **Stripe** (opcional): Para pagamentos

### Instalação Rápida (5 minutos)

```bash
# 1. Clonar repositório
git clone https://github.com/sua-org/workflow-pro-builder.git
cd workflow-pro-builder

# 2. Instalar dependências
pnpm install

# 3. Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves (Supabase + IA obrigatórios)

# 4. Executar migrações no Supabase
# Acesse Supabase Dashboard → SQL Editor
# Execute os arquivos em database/migrations/ (ordem numérica)
# Ou use: supabase db push (se usando Supabase CLI)

# 5. Inicializar banco de dados
pnpm db:test      # Testar conexão
pnpm db:init      # Inicializar estrutura e dados

# 6. Iniciar desenvolvimento
pnpm dev
# Acesse http://localhost:3000 (ou 0.0.0.0:3000 para rede local)
```

### Configuração de Ambiente

Consulte `.env.example` na raiz do projeto. Copie para `.env.local`:

```bash
cp .env.example .env.local
```

#### Variáveis Obrigatórias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IA (pelo menos uma)
GOOGLE_AI_API_KEY=AIza...
# ou
OPENAI_API_KEY=sk-...
```

#### Variáveis Opcionais
```env
# Stripe (pagamentos)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WhatsApp
WEBHOOK_WHATSAPP_SECRET=seu-secret
EVOLUTION_WEBHOOK_SECRET=seu-secret

# Email
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu@email.com
EMAIL_SENDER_PASSWORD=app_password

# Rate Limit (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Monitoramento
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Deploy em Produção

#### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no painel Vercel
```

#### Docker (Alternativa)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📚 Documentação de Referência

### Arquitetura Detalhada
- **[Supabase Integration](./SUPABASE_INTEGRATION_COMPLETE.md)**: Integração Supabase e setup inicial
- **[Database Schema](./DATABASE_README.md)**: Estrutura completa do banco (se existir)
- **[Migrations](./database/migrations/)**: 116+ arquivos SQL de migração
- **[API Documentation](./docs/api.md)**: Endpoints completos (se existir)
- **[Security Guide](./SECURITY.md)**: Práticas de segurança (se existir)
- **[Migration Guide](./MIGRATIONS.md)**: Guia de migrações (se existir)

### Guias Específicos
- **[Catarina Robustness Plan](./docs/CATARINA-ROBUSTNESS-PLAN.md)**: Plano técnico para IA assistente robusta (self-learning, evolução)
- **[Verticalization Guide](./docs/verticalizations.md)**: Criar novos nichos
- **[Partner Setup](./docs/partners.md)**: Configurar parceiros
- **[AI Integration](./docs/ai-integration.md)**: Configurar IA
- **[Payment Setup](./docs/payments.md)**: Configurar pagamentos

### Código e Contribuição
- **[Contributing Guide](./CONTRIBUTING.md)**: Como contribuir
- **[Code Standards](./docs/coding-standards.md)**: Padrões de código
- **[Testing Guide](./docs/testing.md)**: Estratégia de testes
- **[Deployment Checklist](./docs/deployment.md)**: Checklist de deploy

### Suporte e Comunidade
- **[Troubleshooting](./docs/troubleshooting.md)**: Problemas comuns
- **[FAQ](./docs/faq.md)**: Perguntas frequentes
- **[Support Channels](./docs/support.md)**: Canais de suporte
- **[Community Forum](https://community.akaai.com)**: Fórum da comunidade

---

## 🎯 Roadmap 2026

### Q1 2026
- **Mobile Apps Nativas**: iOS e Android
- **Advanced AI**: Fine-tuning específico por nicho
- **Blockchain Integration**: Smart contracts para pagamentos
- **Voice Assistant**: Comandos por voz

### Q2 2026
- **Global Expansion**: Suporte multi-idioma completo
- **Advanced Analytics**: Machine Learning para previsões
- **Marketplace 2.0**: Plataforma de integrações
- **IoT Integration**: Dispositivos conectados

### Q3 2026
- **Enterprise Features**: SSO, LDAP, Advanced RBAC
- **Compliance Automation**: GDPR, CCPA, HIPAA
- **Advanced Reporting**: Custom reports, BI integrado
- **API v2**: GraphQL, subscriptions avançadas

### Q4 2026
- **AI Agent Platform**: Agentes autônomos por nicho
- **Edge Computing**: Processamento local
- **5G Integration**: Comunicação ultra-rápida
- **Quantum Computing**: Otimização avançada

---

## 📄 Licença e Termos

© 2026 AKAAI CORE. Engine of Excellence.

**Licença Comercial**: Uso comercial requer assinatura ativa.
**Open Source**: Componentes core disponíveis sob MIT License.
**SLA**: 99.9% uptime garantido para planos Enterprise.
**Suporte**: 24/7 para planos Professional e Enterprise.

---

## 🤝 Contato e Parcerias

- **Website**: [https://akaai.com](https://akaai.com)
- **Documentação**: [https://docs.akaai.com](https://docs.akaai.com)
- **Suporte**: [support@akaai.com](mailto:support@akaai.com)
- **Parcerias**: [partners@akaai.com](mailto:partners@akaai.com)
- **LinkedIn**: [AKAAI CORE](https://linkedin.com/company/akaai-core)
- **Twitter**: [@akaai_core](https://twitter.com/akaai_core)

---

**Built with ❤️ by the AKAAI Team**

*Transformando negócios em todas as verticalizações possíveis.*
