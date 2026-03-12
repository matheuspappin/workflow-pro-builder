# Plano de Robustez da Catarina — IA Assistente

> **Documento:** Plano técnico para transformar a Catarina em uma IA assistente robusta, com self-learning e evolução visível.  
> **Autor:** Senior Dev (30+ anos de experiência em integração de IA)  
> **Versão:** 1.0  
> **Data:** Março 2026

---

## Sumário Executivo

A Catarina é a assistente virtual unificada do ecossistema AKAAI Hub, presente em múltiplas verticalizações (DanceFlow, Fire Protection, AgroFlowAI). O objetivo deste plano é elevá-la a um patamar de **robustez enterprise**, com:

- **Self-learning** — aprendizado contínuo a partir de interações e feedback
- **Evolução visível** — métricas e dashboards que demonstram melhoria ao longo do tempo
- **Treinamento por vertical** — conhecimento específico por nicho
- **Respostas confiáveis** — redução de erros e "Não tenho essa informação" indevidos

---

## 1. Estado Atual — Diagnóstico

### 1.1 O que funciona

| Componente | Status | Observação |
|------------|--------|------------|
| **Niche prompts** | ✅ | `niche-prompts.ts` diferencia bem DanceFlow vs Fire Protection vs AgroFlow |
| **Roteamento por nicho** | ✅ | `ai-router.ts` → `AI_ENDPOINTS` mapeia corretamente |
| **Fire Protection tool-calling** | ✅ | FIRE_TOOLS com funções reais (agendar_vistoria, criar_os, etc.) |
| **Safety rules** | ✅ | Regras de segurança básicas implementadas |
| **Infraestrutura de self-learning** | ✅ | `AISelfLearning`, `ai_learned_knowledge`, `ai_response_feedback`, etc. |

### 1.2 Lacunas críticas

| Lacuna | Impacto | Prioridade |
|--------|---------|------------|
| **Chats não usam ai-learning** | Self-learning não ocorre | P0 |
| **ai_training_conversations não conectado** | Treinamento manual não afeta respostas | P0 |
| **Regra de fallback muito ampla** | "Não tenho essa informação" em perguntas de consultoria | P0 |
| **studio_id não chega na API (DanceFlow)** | Contexto vazio → respostas erradas | P0 |
| **Sem feedback no chat** | Sem dados para aprendizado | P1 |
| **ai-learning page sem studioId** | Report não carrega | P1 |
| **Treinamento global, não por vertical** | `ai_training_conversations` sem `niche` | P2 |

**P0 = Bloqueador | P1 = Alto | P2 = Médio**

---

## 2. Arquitetura de Referência

### 2.1 Fluxo ideal de processamento de mensagem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST (chat/WhatsApp)                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. RESOLUÇÃO DE CONTEXTO                                                    │
│     • studio_id (localStorage + session fallback)                            │
│     • niche (organization_settings)                                           │
│     • contact_layer (admin/student/lead/technician/etc.)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. CARREGAMENTO DE CONTEXTO (paralelo)                                       │
│     • studio_ai_reports (relatório mestre)                                    │
│     • Fallback: getStudentsData, getTeachersData, etc.                        │
│     • ai_training_conversations (few-shot por niche)                          │
│     • ai_learned_knowledge (conhecimento aprendido)                           │
│     • ai_response_patterns (padrões de sucesso)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. BUILDING DO SYSTEM PROMPT                                                 │
│     • buildCatarinaSystemPrompt(niche, contextContent, ...)                   │
│     • Injetar few-shot examples (ai_training_conversations)                   │
│     • Injetar learned knowledge (se relevante)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. CHAMADA AO LLM (Gemini / OpenAI)                                          │
│     • Com tool-calling para Fire Protection                                   │
│     • temperature 0.2–0.3 para consistência                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. PÓS-PROCESSAMENTO                                                        │
│     • Salvar interação (ai_interactions)                                      │
│     • learnFromInteraction (se confidence > threshold)                        │
│     • updateLearningMetrics                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  RESPONSE                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Camadas de dados

| Camada | Fonte | Escopo | Uso |
|--------|-------|--------|-----|
| **Relatório mestre** | `studio_ai_reports` | Por estúdio | Fonte principal de dados factuais |
| **Fallback direto** | `getStudentsData`, etc. | Por estúdio | Quando não há relatório |
| **Treinamento manual** | `ai_training_conversations` | Por niche (futuro) | Few-shot examples |
| **Conhecimento aprendido** | `ai_learned_knowledge` | Por estúdio | Enriquecimento de contexto |
| **Padrões de resposta** | `ai_response_patterns` | Por estúdio | Templates de sucesso |

---

## 3. Plano de Implementação em Fases

### Fase 1 — Estabilização (1–2 semanas)

**Objetivo:** Corrigir erros atuais e garantir que o fluxo básico funcione.

| # | Tarefa | Arquivo(s) | Descrição |
|---|--------|------------|-----------|
| 1.1 | Corrigir `studio_id` no chat DanceFlow | `app/solutions/estudio-de-danca/dashboard/chat/page.tsx` | Usar `getSessionKey()` + fallback para `session.user.user_metadata.studio_id` |
| 1.2 | Refinar safety rules | `lib/catarina/safety-rules.ts` | Distinguir dados factuais (nunca inventar) de dicas/consultoria (pode usar conhecimento geral) |
| 1.3 | Melhorar fallback de contexto | `app/api/gemini/route.ts` | Incluir `Total de Alunos`, `Alunos Ativos`; instruções explícitas para uso dos dados |
| 1.4 | Reduzir temperature | `app/api/gemini/route.ts`, `app/api/fire-protection/ai/chat/route.ts` | Reduzir de 0.5 para 0.2–0.3 |
| 1.5 | Corrigir ai-learning page | `app/dashboard/ai-learning/page.tsx` | Obter `studioId` do contexto (localStorage/session) e passar para a API |

**Critério de sucesso:** Perguntas como "quantos alunos temos?" e "dicas para aumentar matrículas" retornam respostas corretas e sem "Não tenho essa informação" indevido.

---

### Fase 2 — Integração do Treinamento e Self-Learning (2–3 semanas)

**Objetivo:** Conectar o pipeline de aprendizado aos chats em produção.

| # | Tarefa | Arquivo(s) | Descrição |
|---|--------|------------|-----------|
| 2.1 | Adicionar `niche` em `ai_training_conversations` | Nova migration | `ALTER TABLE ai_training_conversations ADD COLUMN niche TEXT DEFAULT 'dance'` |
| 2.2 | Integrar treinamento no chat | `app/api/gemini/route.ts`, `app/api/fire-protection/ai/chat/route.ts` | Buscar `ai_training_conversations` filtrado por niche; injetar como few-shot no prompt |
| 2.3 | Injetar learned knowledge | `app/api/gemini/route.ts` | Chamar `aiLearning.getLearnedKnowledge(studioId, message)` e incluir no contextContent |
| 2.4 | Salvar interação após resposta | `app/api/gemini/route.ts` | Após resposta bem-sucedida, chamar `aiLearning.learnFromInteraction()` (ou equivalente) |
| 2.5 | Atualizar métricas | `app/api/gemini/route.ts` | Chamar `aiLearning.updateLearningMetrics()` |

**Opção:** Usar `EnhancedAIChat.processMessageWithLearning` como orquestrador central, em vez de duplicar lógica em cada API. Isso exige refatorar as APIs para delegarem ao `EnhancedAIChat`.

**Critério de sucesso:** Interações são salvas; conhecimento aprendido aparece em respostas futuras; métricas de aprendizado são atualizadas.

---

### Fase 3 — Feedback no Chat e UI de Evolução (1–2 semanas)

**Objetivo:** Permitir que o usuário dê feedback e visualizar evolução.

| # | Tarefa | Arquivo(s) | Descrição |
|---|--------|------------|-----------|
| 3.1 | Botões de feedback (👍/👎) | `app/solutions/estudio-de-danca/dashboard/chat/page.tsx`, `app/solutions/fire-protection/dashboard/chat/page.tsx` | Adicionar após cada mensagem da IA |
| 3.2 | Modal de correção | Mesmos arquivos | Se 👎, permitir enviar resposta corrigida |
| 3.3 | API de feedback | `app/api/ai/learning/route.ts` (já existe) | Garantir que o front chame `POST /api/ai/learning` com `type: 'feedback'` |
| 3.4 | Dashboard de evolução | `app/dashboard/ai-learning/page.tsx` | Gráfico de learning score ao longo do tempo; top knowledge; top patterns |
| 3.5 | Integrar feedback no admin Catarina | `app/admin/catarina/page.tsx` | Mesmos botões de feedback |

**Critério de sucesso:** Usuário pode dar feedback; correções alimentam learning; dashboard mostra evolução.

---

### Fase 4 — Robustez Avançada (2–3 semanas)

**Objetivo:** Resiliência, observabilidade e otimização.

| # | Tarefa | Arquivo(s) | Descrição |
|---|--------|------------|-----------|
| 4.1 | Retry com backoff | `app/api/gemini/route.ts` | Retry em falhas transientes (5xx, rate limit) |
| 4.2 | Fallback de modelo | Já existe | Manter fallback de modelos (gemini-2.5-flash → gemini-1.5-flash → gemini-1.5-pro) |
| 4.3 | Logging estruturado | `lib/logger.ts` | Log de cada request com: studio_id, niche, message_hash, latency, model_used |
| 4.4 | Métricas de latência | `app/api/gemini/route.ts` | Medir tempo de resposta; registrar em `ai_learning_metrics.response_time_avg` |
| 4.5 | Cache de contexto | Opcional | Cache de `studio_ai_reports` por 5–10 min para reduzir carga no DB |
| 4.6 | Rate limiting por tenant | Opcional | Evitar abuso por estúdio |

**Critério de sucesso:** Sistema resiliente a falhas; logs suficientes para debugging; latência monitorada.

---

### Fase 5 — Treinamento por Vertical e Expansão (1–2 semanas)

**Objetivo:** Treinamento específico por nicho e expansão para outros canais.

| # | Tarefa | Arquivo(s) | Descrição |
|---|--------|------------|-----------|
| 5.1 | UI de upload por vertical | `app/admin/testes/page.tsx` | Permitir selecionar niche ao enviar arquivo | 
| 5.2 | Cenários de Fire Protection | `app/api/admin/ai-training/route.ts` | Adicionar `vistoria`, `os`, `extintores` em `VALID_SCENARIOS` |
| 5.3 | WhatsApp webhook | `app/api/webhooks/whatsapp/route.ts` | Garantir que use `getAiEndpointForStudio` e que salve interações |
| 5.4 | Integração com verticalização AgroFlow | `app/api/agroflowai/ai/chat/route.ts` | Mesma lógica de self-learning e treinamento |

**Critério de sucesso:** Treinamento por vertical; WhatsApp e AgroFlow seguem o mesmo padrão.

---

## 4. Especificações Técnicas

### 4.1 Refinamento das Safety Rules

**Antes (regra 2):**
```
Se a informação não existir no contexto: "Não tenho essa informação no momento..."
```

**Depois (proposta):**
```
DADOS FACTUAIS (horários, preços, nomes, números, endereços):
- Se NÃO estiver no contexto → "Não tenho essa informação no momento. Nossa equipe retornará em breve."

DICAS CONSULTORIA (como aumentar matrículas, precificar, melhorar retenção):
- Use seu conhecimento geral + dados do estúdio para personalizar.
- NUNCA use a frase de fallback para perguntas de consultoria.
```

### 4.2 Formato de few-shot no prompt

```text
--- EXEMPLOS DE CONVERSA (use como referência de estilo e tom) ---
[Usuário]: quantos alunos temos?
[IA]: Com base nos dados atuais, vocês têm X alunos ativos e Y no total. [detalhe do contexto]

[Usuário]: qual o valor da mensalidade?
[IA]: O plano mensal está em R$ Z. Posso detalhar outros pacotes? [detalhe]
--- FIM DOS EXEMPLOS ---
```

### 4.3 Estrutura de dados para `ai_interactions`

```sql
-- Garantir que existe (ou criar migration)
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id),
  channel TEXT NOT NULL, -- 'chat', 'whatsapp'
  contact_layer TEXT, -- 'admin', 'student', 'lead'
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Fluxo de `learnFromInteraction`

1. Após resposta bem-sucedida, chamar `aiLearning.learnFromInteraction({ studioId, question, answer, confidence })`
2. `shouldLearnFromInteraction`: confiança > 0.7 e resposta não genérica
3. `extractKnowledge`: categorizar (pricing, schedule, service_info, etc.)
4. `saveLearnedKnowledge`: upsert em `ai_learned_knowledge` (evitar duplicatas por similaridade)
5. `updateLearningMetrics`: atualizar `ai_learning_metrics` do dia

---

## 5. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|------------|
| Aumento de latência por mais queries | Média | Médio | Paralelizar queries; cache de contexto |
| Conhecimento aprendido incorreto | Média | Alto | Threshold de confidence; revisão manual de amostras |
| Custo de API aumentado | Baixa | Médio | Monitorar tokens; limitar histórico de mensagens |
| Regressão em respostas | Média | Alto | Testes de regressão com prompts fixos; A/B antes de deploy |
| Dados sensíveis em logs | Baixa | Alto | Nunca logar mensagens completas; apenas hash |

---

## 6. Métricas de Sucesso

| Métrica | Baseline (atual) | Meta (6 meses) |
|---------|------------------|-----------------|
| Taxa de "Não tenho essa informação" indevida | ~30% (estimado) | < 5% |
| Satisfaction rate (feedback positivo) | N/A | > 70% |
| Learning score médio | N/A | > 0.7 |
| Latência de resposta (p95) | — | < 3s |
| Uso de learned knowledge | 0% | > 20% das respostas |

---

## 7. Checklist de Implementação

### Fase 1
- [ ] 1.1 Corrigir `studio_id` no chat DanceFlow
- [ ] 1.2 Refinar safety rules
- [ ] 1.3 Melhorar fallback de contexto
- [ ] 1.4 Reduzir temperature
- [ ] 1.5 Corrigir ai-learning page

### Fase 2
- [ ] 2.1 Migration `niche` em `ai_training_conversations`
- [ ] 2.2 Integrar treinamento no chat
- [ ] 2.3 Injetar learned knowledge
- [ ] 2.4 Salvar interação após resposta
- [ ] 2.5 Atualizar métricas

### Fase 3
- [ ] 3.1 Botões de feedback
- [ ] 3.2 Modal de correção
- [ ] 3.3 API de feedback
- [ ] 3.4 Dashboard de evolução
- [ ] 3.5 Feedback no admin Catarina

### Fase 4
- [ ] 4.1 Retry com backoff
- [ ] 4.2 Fallback de modelo (já existe)
- [ ] 4.3 Logging estruturado
- [ ] 4.4 Métricas de latência
- [ ] 4.5 Cache de contexto (opcional)
- [ ] 4.6 Rate limiting (opcional)

### Fase 5
- [ ] 5.1 UI de upload por vertical
- [ ] 5.2 Cenários Fire Protection
- [ ] 5.3 WhatsApp webhook
- [ ] 5.4 AgroFlow AI

---

## 8. Referências

- `lib/catarina/` — System prompt, niche prompts, safety rules
- `lib/ai-router.ts` — Roteamento por nicho
- `lib/actions/ai-learning.ts` — AISelfLearning
- `lib/actions/enhanced-ai-chat.ts` — Orquestrador com learning
- `app/api/gemini/route.ts` — API DanceFlow
- `app/api/fire-protection/ai/chat/route.ts` — API Fire Protection
- `database/migrations/83_ai_training_conversations.sql`
- `database/migrations/90_create_ai_learning_system.sql`

---

*Documento vivo. Atualizar conforme implementação avança.*
