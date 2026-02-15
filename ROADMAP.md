# Workflow AI - Roadmap para Lançamento Comercial 🚀

Este documento detalha o progresso atual e os passos necessários para transformar o Workflow AI em um SaaS (Software as a Service) comercializável e seguro.

## 📊 Status Atual do Ecossistema
*   **Multi-tenancy:** Implementado via `studio_id` em todas as tabelas com RLS Estrito via JWT.
*   **Autenticação Real:** Migrado para **Supabase Auth** com perfis automatizados e middleware de segurança.
*   **Dashboard Studio:** Funcional com métricas, alunos, professores e gestão de aulas.
*   **Portal do Aluno (App):** Estrutura Mobile-First criada para Android/iOS (Início, Aulas, Pagamentos).
*   **Painel Super Admin:** Central de controle global com gestão de assinaturas e chaves de API por cliente.
*   **Inteligência Artificial:** Integrada para detecção de evasão e assistente de chat isolado por estúdio.

---

## 📱 Portal do Aluno (Mobile App)
*   [x] **Estrutura base Mobile-First:** Criada em `/app/student`.
*   [x] **Dashboard do Aluno:** Visualização de Próxima Aula, XP e Nível.
*   [x] **Interface de Pagamentos:** Histórico e simulação de checkout (Pix/Cartão).
*   [ ] **Integração Real de Pagamento:** Conectar o botão "Pagar" ao Stripe/Pagar.me.
*   [ ] **Push Notifications:** Alertas de nova aula ou cobrança via Firebase.
*   [ ] **Exportação Mobile:** Configurar Capacitor para gerar os pacotes `.apk` (Android) e `.ipa` (iOS).

---

## 🔒 Segurança e Infraestrutura (100% Concluído ✅)
*   [x] **Supabase Auth:** Substituição total de login manual por autenticação profissional.
*   [x] **RLS via JWT:** O banco de dados valida o isolamento de dados via `auth.uid()`.
*   [x] **Middleware de Rota:** Proteção de rotas `/dashboard`, `/admin` e `/student` no nível de servidor.
*   [x] **Gestão de APIs:** Estúdios podem usar suas próprias chaves de IA e WhatsApp.

---

## 💰 Monetização e Escala
- [x] Integração base com **Stripe** (Checkout e Webhooks)
- [x] API de criação de sessão de pagamento para alunos
- [x] Webhook para atualização automática de status de fatura
- [ ] **Checkout Automático de Estúdios:**
    - [ ] Automatizar a criação de assinaturas no registro.
    - [ ] Bloquear acesso ao sistema se a mensalidade do estúdio estiver atrasada.
- [ ] **Módulo Financeiro Real:**
    - [ ] Geração automática de cobranças via Pix/Boleto para alunos.
- [ ] **App do Aluno nas Lojas:** Publicar na Google Play e App Store.

---

## 🚀 Próximos Passos Imediatos
1. Integrar o Webhook do Stripe para ativar as assinaturas automaticamente.
2. Criar a tela de "Perfil do Aluno" com histórico de presenças.
3. Finalizar a integração de WhatsApp com envio de mídia.
