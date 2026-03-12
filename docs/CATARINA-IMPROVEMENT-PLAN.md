# Plano de Melhoria da Catarina — Implementação Detalhada

> **Documento:** Plano técnico de implementação para elevar a Catarina a nível enterprise.  
> **Autor:** Senior Dev (30+ anos em integração de IA)  
> **Versão:** 1.0  
> **Data:** Março 2026

---

## Sumário Executivo

Este plano detalha a implementação das melhorias prioritárias identificadas na análise da Catarina. As fases são executáveis em sequência, com critérios de aceite claros e baixo risco de regressão.

---

## Fase 1 — Correções Rápidas (P0)

### 1.1 Persistir e Injetar "Valores e Regras Específicas"

**Problema:** O campo `customKnowledge` existe na UI mas não é persistido nem injetado no contexto do chat.

**Solução:**
- Nova tabela `niche_ai_rules`: regras globais por vertical (dance, fire_protection, agroflowai)
- Admin define regras por niche; todas as conversas daquele niche recebem o contexto
- Estrutura: `(id, niche, rules_text, updated_at)`

**Arquivos:**
- `database/migrations/116_niche_ai_rules.sql` — criar tabela
- `app/api/admin/ai-training/route.ts` — persistir customKnowledge em `niche_ai_rules`
- `app/api/gemini/route.ts`, `app/api/fire-protection/ai/chat/route.ts`, `app/api/agroflowai/ai/chat/route.ts` — buscar e injetar regras no contextContent

**Critério de aceite:** Regras definidas no Controlador aparecem nas respostas da Catarina.

---

### 1.2 Aceitar Treinamento Só com Regras (sem arquivo)

**Problema:** API exige arquivo .txt; frontend permite enviar só regras. Inconsistência.

**Solução:**
- Remover validação `if (!file)` quando `customKnowledge` tem conteúdo
- Fluxo: se só customKnowledge → upsert em `niche_ai_rules`; se file → inserir em `ai_training_conversations`; se ambos → fazer os dois

**Arquivos:**
- `app/api/admin/ai-training/route.ts` — lógica condicional

**Critério de aceite:** Admin pode salvar regras sem enviar arquivo.

---

### 1.3 Feedback no Admin Catarina

**Problema:** Chat admin não tem botões 👍/👎 nem modal de correção.

**Solução:**
- Nova rota `POST /api/admin/catarina/feedback` — aceita feedback sem studioId (super admin only)
- Tabela `ai_admin_feedback` ou reutilizar `ai_response_feedback` com studio_id genérico
- UI: botões 👍/👎 após cada mensagem; 👎 abre Dialog com Textarea para correção

**Arquivos:**
- `database/migrations/117_ai_admin_feedback.sql` — tabela para feedback admin (studio_id nullable)
- `app/api/admin/catarina/feedback/route.ts` — endpoint
- `app/admin/catarina/page.tsx` — UI de feedback

**Critério de aceite:** Admin pode dar feedback e correções no chat.

---

## Fase 2 — Melhorias de Contexto e Configuração

### 2.1 Relatório Mestre Automático

**Problema:** `studio_ai_reports` depende de geração manual pelo usuário.

**Solução:**
- API route `POST /api/cron/refresh-ai-reports` (ou similar) chamável por Vercel Cron / external scheduler
- Para cada estúdio ativo (ou com atividade recente), chamar a lógica existente de `app/api/admin/reports/generate/route.ts`
- Alternativa: ao acessar dashboard ou chat, verificar se relatório tem mais de 24h e regenerar em background

**Arquivos:**
- `app/api/cron/refresh-ai-reports/route.ts` — job
- `vercel.json` ou documentação para configurar cron

**Critério de aceite:** Relatórios são atualizados periodicamente sem ação manual.

---

### 2.2 Modelo Configurável por Estúdio

**Problema:** Modelo fixo (Gemini 2.5 Flash) para todos.

**Solução:**
- Coluna `ai_model` em `organization_settings` ou `studio_settings` (ex: `gemini-2.5-flash`, `gemini-1.5-pro`)
- APIs de chat leem essa configuração; fallback para padrão se não definido

**Arquivos:**
- Migration para adicionar coluna ou usar `studio_settings` com `setting_key = 'ai_model'`
- `app/api/gemini/route.ts`, `app/api/fire-protection/ai/chat/route.ts` — ler config

**Critério de aceite:** Estúdio pode escolher modelo mais potente nas configurações.

---

## Ordem de Execução

| # | Fase | Dependências | Estimativa |
|---|------|--------------|------------|
| 1 | 1.1 + 1.2 (regras) | Nenhuma | 1h |
| 2 | 1.3 (feedback admin) | Nenhuma | 45min |
| 3 | 2.1 (relatório automático) | Nenhuma | 1h |
| 4 | 2.2 (modelo configurável) | Nenhuma | 30min |

---

## Especificações Técnicas

### Tabela `niche_ai_rules`

```sql
CREATE TABLE IF NOT EXISTS niche_ai_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche TEXT NOT NULL UNIQUE,  -- dance, fire_protection, agroflowai
  rules_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Injeção de regras no contexto

Ordem no `contextContent`:
1. Relatório mestre (ou fallback)
2. **VALORES E REGRAS ESPECÍFICAS** (novo bloco)
3. Few-shot examples
4. Learned knowledge

### Tabela `ai_admin_feedback`

```sql
CREATE TABLE IF NOT EXISTS ai_admin_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_question TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  user_feedback TEXT NOT NULL,  -- positive, negative, correction
  corrected_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Status da Implementação

| Fase | Status | Observações |
|------|--------|-------------|
| 1.1 Valores e Regras | ✅ | Migration 116, APIs atualizadas |
| 1.2 Treinamento só com regras | ✅ | API aceita customKnowledge sem arquivo |
| 1.3 Feedback Admin Catarina | ✅ | Migration 117, endpoint + UI |
| 2.1 Relatório automático | ✅ | Cron 4h UTC, lib generate-studio-ai-report |
| 2.2 Modelo configurável | ✅ | studio_settings.ai_model (Gemini, Fire Protection) |

### Migrations a executar

```sql
-- 116: niche_ai_rules
-- 117: ai_admin_feedback
```

Execute no SQL Editor do Supabase ou via `supabase db push`.

### Modelo configurável

Para definir um modelo específico por estúdio:

```sql
INSERT INTO studio_settings (studio_id, setting_key, setting_value)
VALUES ('<studio-uuid>', 'ai_model', 'gemini-1.5-pro')
ON CONFLICT (studio_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
```

Valores válidos: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`.

### Cron refresh-ai-reports

- Rota: `GET /api/cron/refresh-ai-reports`
- Schedule: 4h UTC (meia-noite BRT)
- Header: `Authorization: Bearer <CRON_SECRET>`

---

*Documento vivo. Atualizar conforme implementação avança.*
