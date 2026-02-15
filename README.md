# 🚀 Workflow Pro Builder (Gemini CLI Edition)

![Workflow AI](public/placeholder-logo.png)

> **O Ecossistema Definitivo para Gestão de Negócios Físicos e Digitais.**
> Uma plataforma SaaS White-Label, Multi-Tenant e Omnichannel, projetada para escalar operações de estúdios, clínicas, academias e varejo com inteligência artificial e automação financeira.

---

## 📋 Sobre o Projeto

O **Workflow Pro Builder** não é apenas um ERP; é um **Sistema Operacional de Negócios** completo. Ele resolve a fragmentação de ferramentas (CRM, ERP, Financeiro, Agendamento) unificando tudo em uma única base de dados robusta, com suporte nativo a hierarquias complexas (Franquias -> Unidades -> Profissionais -> Clientes).

### 🎯 Para Quem é?
Graças à arquitetura **"Niche-Agnostic"**, o sistema se adapta via configuração (`organization_settings`) para:
- **Fitness:** Academias, Crossfit (Gestão de Alunos, Treinos, Catracas).
- **Beleza:** Estúdios de Tatuagem, Salões (Agendamento, Comissões).
- **Saúde:** Clínicas, Consultórios (Prontuários, Anamneses).
- **Varejo:** Lojas de Suplementos, Moda (PDV, Estoque, E-commerce).

---

## 🏗️ Arquitetura do Ecossistema

O sistema é dividido em **4 Portais Interconectados**, cada um com autenticação e permissões isoladas (RBAC & RLS):

### 1. 👑 Portal Super Admin (God Mode)
- **Gestão de Parceiros:** Controle de afiliados e revendedores do software.
- **Saúde do Sistema:** Monitoramento de filas, webhooks e erros globais.
- **Billing Central:** Controle de assinaturas SaaS e repasses via Stripe Connect.

### 2. 🤝 Portal do Parceiro (Afiliado/Franqueado)
- **White Label:** Personalização de marca e domínio para seus clientes.
- **Split de Pagamentos:** Recebimento automático de comissões sobre o faturamento dos estúdios.
- **Gestão de Carteira:** Onboarding de novos estúdios e métricas de churn.

### 3. 🏢 Portal do Estúdio (ERP & CRM)
O coração da operação. Inclui ERP, PDV, Estoque, Agenda e Marketing.
- **Multi-Usuário:** Acessos granulares para recepcionistas, gerentes e profissionais.
- **Financeiro:** Fluxo de caixa, DRE gerencial e contas a pagar/receber.

### 4. 📱 Portal do Aluno/Cliente (PWA)
- **App Like Experience:** Agendamento, histórico financeiro e treinos/serviços.
- **Gamificação:** Pontos, níveis e recompensas por frequência.
- **Marketplace:** Compra de produtos com retirada no balcão.

---

## 📦 Módulos Detalhados

### 🏭 Módulo ERP & Vendas (Deep Dive)
Um sistema de gestão empresarial completo embutido.

*   **Gestão de Pedidos Unificada (`erp_orders`):**
    *   Centraliza vendas do Balcão (PDV), App do Aluno e E-commerce.
    *   Status flow complexo: `pending` -> `paid` -> `shipped` -> `delivered`.
    *   Integração logística com rastreamento e transportadoras.
*   **Nota Fiscal e Fiscal:**
    *   Tabela `invoices` pronta para integração com SEFAZ/Prefeituras.
    *   Armazenamento de chaves de acesso, XML e geração de PDF.
    *   Suporte a NCM (Nomenclatura Comum do Mercosul) nos produtos.
*   **B2B & Suprimentos (`purchase_orders`):**
    *   Gestão de Fornecedores e Ordens de Compra.
    *   Previsão de entrega e conferência de recebimento.

### 📦 Módulo de Estoque Avançado (WMS Lite)
Controle rigoroso de inventário para evitar perdas e furos.

*   **Valuation em Tempo Real:**
    *   Cálculo automático do valor total em estoque (Custo vs Venda).
    *   Indicador de Lucro Potencial (Markup médio).
*   **Custo Médio Ponderado:**
    *   O sistema recalcula automaticamente o `cost_price` do produto a cada nova entrada de nota, garantindo precisão contábil.
*   **Rastreabilidade Total (`inventory_transactions`):**
    *   Log imutável de todas as movimentações: `in` (compra), `out` (perda/uso), `sale` (venda), `adjustment` (inventário).
    *   Associação de vendas a alunos/clientes específicos.
*   **Catálogo Inteligente:**
    *   Suporte a SKU, Código de Barras e Categorização.
    *   Imagens e Galeria de produtos.

### 💰 Módulo Financeiro & Pagamentos
*   **Stripe Connect Express:** Onboarding automático de contas bancárias para estúdios.
*   **Split de Pagamentos:** Divisão automática de valores entre Plataforma, Afiliado e Estúdio no ato da transação.
*   **Assinaturas Recorrentes:** Gestão de planos mensais/anuais com retry automático de cobrança.

### 🤖 Módulo IA & Automação (Gemini Powered)
*   **Análise de Dados:** Insights sobre retenção e faturamento.
*   **Chatbot Inteligente:** Atendimento de primeiro nível para dúvidas de alunos.
*   **Geração de Treinos/Dietas:** Sugestões baseadas no perfil do aluno (em nichos de saúde).

### 🎫 Módulo de Suporte (`HelpDesk`)
*   Sistema de Ticket interno completo.
*   Priorização (Low, Medium, High, Critical).
*   Comunicação threadada entre Staff e Suporte da Plataforma.

---

## 🛠️ Stack Tecnológica

O projeto utiliza o que há de mais moderno no ecossistema JavaScript/TypeScript.

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | **Next.js 14+** (App Router, Server Actions), **React 18/19**, **TypeScript** |
| **Estilização** | **Tailwind CSS**, **Shadcn/UI**, **Framer Motion**, **Lucide React** |
| **Backend / DB** | **Supabase** (PostgreSQL, Auth, Realtime, Edge Functions, Storage) |
| **Segurança** | **RLS** (Row Level Security) nativo do Postgres, **Zod** (Validação) |
| **Pagamentos** | **Stripe API** & **Stripe Connect** |
| **Mensageria** | **Evolution API** (WhatsApp), **Resend/Nodemailer** (Email) |
| **IA** | **Google Gemini API**, **OpenAI API** |

---

## 🚀 Guia de Instalação e Setup

### Pré-requisitos
- Node.js 20+
- Gerenciador de pacotes `pnpm` (recomendado) ou `npm`
- Conta no Supabase e Stripe

### 1. Clonar e Instalar
```bash
git clone https://github.com/seu-repo/workflow-pro-builder.git
cd workflow-pro-builder
pnpm install
```

### 2. Configuração de Ambiente
Crie um arquivo `.env` na raiz baseado no `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role (Apenas Server-Side!)

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Gemini / AI
GEMINI_API_KEY=sua_chave_google
```

### 3. Banco de Dados (Supabase)
O sistema possui um histórico robusto de migrações em `database/migrations`.

1.  Rode o schema base: `database/schema.sql`
2.  Aplique as migrações de ERP e Estoque:
    *   `04_create_erp_tables.sql`
    *   `07_create_inventory_tables.sql`
    *   `23_create_invoices_table.sql`
    *   `24_create_support_system.sql`
3.  Ou use o script utilitário (se configurado):
    ```bash
    node scripts/apply-all-pending-migrations.js
    ```

### 4. Rodar o Projeto
```bash
pnpm dev
```
Acesse `http://localhost:3000`.

---

## 🔒 Segurança e Boas Práticas

*   **Proteção de Rotas:** Middleware `guardModule` protege Server Actions garantindo que o usuário tenha permissão E que o estúdio tenha o módulo contratado.
*   **Dados Sensíveis:** Nenhuma lógica de negócio crítica roda no Client-Side. Tudo passa por Server Actions ou API Routes.
*   **Isolamento:** Cada estúdio só vê seus próprios dados graças às políticas RLS (`studio_id = auth.uid()`).

---

<div align="center">
  <p>© 2026 Workflow AI System. Todos os direitos reservados.</p>
</div>
