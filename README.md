# 🚀 Workflow AI: O Sistema Operacional para o seu Negócio

![Workflow AI](public/placeholder-logo.png)

> **A plataforma SaaS definitiva que combina Inteligência Artificial, automação de processos e uma experiência de usuário excepcional para escalar o seu negócio.**

O **Workflow AI** não é apenas um software de gestão; é um ecossistema completo desenhado para transformar operações complexas em fluxos de trabalho fluidos e lucrativos. Com suporte nativo a múltiplos nichos, automação via WhatsApp, pagamentos integrados com Stripe e inteligência preditiva, ele é o motor que seu negócio precisa para crescer de forma sustentável.

---

## 🌟 Diferenciais Estratégicos

### 🤖 Inteligência Artificial de Elite
Integrado com **OpenAI (ChatGPT)** e **Google Gemini**, o sistema analisa dados em tempo real para fornecer insights estratégicos sobre retenção de clientes, faturamento e engajamento.

### 🎭 White Label & Multi-Niche
Personalize a plataforma com sua marca e adapte o vocabulário instantaneamente para diversos setores:
- **Saúde & Bem-estar:** Academias, Estúdios de Pilates, Ioga, Clínicas Médicas.
- **Serviços Profissionais:** Advocacia, Psicologia, Consultoria.
- **Beleza & Estética:** Salões, Barbearias, Spas.
- **Educação:** Escolas de Música, Idiomas, Artes.
- **Pet Care:** Pet Shops, Veterinárias, Hotéis Pet.

### 🛡️ Segurança Identity-First
- **Acesso Baseado em Convite:** Proteção total dos dados com RBAC (Role-Based Access Control).
- **Validação de Documentos:** Verificação algorítmica de CPF/CNPJ vinculada à conta global.
- **Políticas de RLS (Row Level Security):** Segurança de dados a nível de banco de dados no Supabase.

---

## 🏗️ Arquitetura de Portais Interconectados

O ecossistema é dividido em quatro portais otimizados para cada perfil de usuário:

### 1. 👑 Portal do Dono (Super Admin)
Gestão centralizada com visão macro do negócio.
- **Business Intelligence:** Métricas de crédito, churn rate e faturamento.
- **Gestão Modular:** Ative ou desative módulos (Financeiro, Marketplace, IA) sob demanda.
- **Scanner de Acesso:** Validação via QR Code com desconto automático de créditos.

### 2. 🎓 Portal do Cliente
Experiência mobile-first focada em autonomia e fidelização.
- **Flex Pass:** Compra de pacotes de créditos para uso flexível.
- **Marketplace Integrado:** Compra de produtos e serviços em um clique.
- **Autoatendimento:** Check-in inteligente e histórico de uso transparente.

### 3. 👨‍🏫 Portal do Colaborador
Foco na execução e redução de burocracia.
- **Agenda Digital:** Visualização em tempo real de compromissos e tarefas.
- **Cancelamento Inteligente:** Gestão de agenda com notificações automáticas para todos os envolvidos.
- **Controle de Ganhos:** Visão clara de comissões e serviços prestados.

### 4. 🤝 Portal de Parceiros (Afiliados)
Expansão do negócio através de parcerias estratégicas.
- **Stripe Connect:** Pagamentos automatizados de comissões para afiliados.
- **Dashboard de Performance:** Acompanhamento de indicações e conversões.

---

## 📦 Módulos Disponíveis (SaaS Modular)

O Workflow AI cresce com você. Adicione funcionalidades conforme a necessidade:

| Módulo | Descrição | Benefícios |
| :--- | :--- | :--- |
| **🤖 IA Chat** | Assistente virtual 24/7 | Insights de negócio e automação de respostas. |
| **💬 WhatsApp** | Integração via Evolution API | Lembretes automáticos e campanhas de marketing. |
| **💰 Financeiro** | Gestão de fluxo de caixa | Mensalidades, pacotes e integração direta Stripe. |
| **🛒 Marketplace** | Loja virtual integrada | Venda online de produtos com gestão de estoque. |
| **📦 ERP & Estoque** | Controle operacional | Alerta de estoque baixo e gestão de fornecedores. |
| **🎫 Scanner** | Controle de acesso | Check-in rápido via QR Code para validação. |
| **🏆 Gamificação** | Retenção de clientes | Sistema de pontos, rankings e conquistas. |
| **🎯 Leads** | CRM & Funil de Vendas | Transforme interessados em clientes pagantes. |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI/UX** | Tailwind CSS 4.0, Shadcn UI, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Pagamentos** | Stripe & Stripe Connect |
| **Comunicação** | Evolution API (WhatsApp), Nodemailer |
| **IA** | OpenAI API, Google Gemini API |
| **Hosting** | Vercel |

---

## 📋 Guia de Instalação

### Pré-requisitos
- **Node.js 22.x** ou superior
- **pnpm 9.x** ou superior
- **Conta Supabase** e **Stripe**

### 1. Clonagem e Dependências
```bash
git clone https://github.com/seu-usuario/workflow-pro-builder.git
cd workflow-pro-builder
pnpm install
```

### 2. Configuração de Ambiente
Renomeie o arquivo `.env.example` para `.env` e preencha as variáveis obrigatórias:
```bash
cp .env.example .env
```

### 3. Banco de Dados e Migrações
O sistema utiliza um fluxo de migrações sequenciais para garantir a integridade do schema:
1. Execute o schema base disponível em `database/schema.sql`.
2. Aplique as migrações pendentes:
```bash
node scripts/apply-all-pending-migrations.js
```

### 4. Inicialização de Dados
Popule o banco com planos de sistema e configurações iniciais:
```bash
pnpm run db:seed
```

### 5. Execução em Desenvolvimento
```bash
pnpm dev
```
Acesse `http://localhost:3000` para iniciar o setup.

---

## 🔧 Scripts de Administração

O sistema inclui ferramentas de linha de comando para manutenção:
- `pnpm run db:init`: Inicializa o banco de dados do zero.
- `node scripts/check-partner-status.js`: Verifica a saúde financeira dos parceiros.
- `node scripts/list-users-internal.cjs`: Lista usuários e permissões do sistema.
- `node scripts/apply-fk-migration.js`: Corrige integridade referencial em ambientes legados.

---

## 🗺️ Roadmap de Evolução

- [ ] **Mobile App Nativo:** Versões iOS e Android utilizando React Native.
- [ ] **Módulo Fiscal:** Emissão automática de NF-e e NFS-e integrada.
- [ ] **IA de Voz:** Atendimento telefônico automatizado integrado ao CRM.
- [ ] **Multi-Moeda:** Suporte para expansão global com conversão em tempo real.

---

## 🤝 Contribuição e Licença

Contribuições são fundamentais para a evolução do ecossistema. Siga o fluxo de `Fork` -> `Feature Branch` -> `Pull Request`.

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>© 2026 Workflow AI. Orgulhosamente desenvolvido para otimizar o fluxo de trabalho global. 🚀✨</p>
</div>
