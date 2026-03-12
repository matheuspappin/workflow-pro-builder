# Lógica: Pagamento com Créditos no PDV (DanceFlow)

## Objetivo
Permitir que clientes gastem seus créditos no PDV para comprar produtos (ex: água, lanches), além das opções existentes (Dinheiro, PIX, Cartão).

---

## 1. Fluxo Geral

```
[Produtos no Carrinho] → [Vincular Aluno] → [FECHAR VENDA]
                                              ↓
                                    [Modal: Escolher Pagamento]
                                              ↓
                    ┌─────────────────────────┼─────────────────────────┐
                    ↓                         ↓                         ↓
              [Dinheiro]              [PIX / Cartão]            [Créditos] ← NOVO
                    ↓                         ↓                         ↓
              processPosPayment        Stripe Checkout         processPosPayment
              (method: money)          (redirect)              (method: credit)
```

---

## 2. Conversão Reais → Créditos (Taxa Flutuante)

### 2.1 Regra Base
Os planos de crédito são **flutuantes**: quanto mais créditos comprados, mais barato fica cada crédito.

**Exemplo:**
- Pacote 10 créditos = R$ 700 → **R$ 70/crédito**
- Pacote 20 créditos = R$ 1.300 → **R$ 65/crédito**
- Pacote 50 créditos = R$ 3.000 → **R$ 60/crédito**

### 2.2 Taxa de Conversão para PDV
Usar a **menor taxa** (melhor para o cliente) entre os pacotes ativos:

```
reais_per_credit = MIN(price / lessons_count) 
                   para todos lesson_packages WHERE studio_id = X AND is_active = true
```

**Fallback:** Se não houver pacotes, usar `studio_settings.pdv_credit_reais_per_unit` (ex: 70).

### 2.3 Fórmula de Conversão
```
valor_em_reais = preço do produto (selling_price) × quantidade
creditos_equivalentes = valor_em_reais / reais_per_credit
```

**Exemplo:** Água R$ 7, taxa R$ 70/crédito → 7/70 = **0,1 créditos**

### 2.4 Produto com Valor Mínimo
O produto tem `selling_price` (valor mínimo em reais). O valor em créditos é **sempre** derivado dessa conversão:
- Não armazenar `price_in_credits` no produto
- Calcular em tempo real: `credits = (selling_price × qty) / reais_per_credit`

---

## 3. Créditos Fracionários

O schema atual usa `remaining_credits INTEGER`. Para suportar 0,1 créditos:

### Opção A (Recomendada): Multiplicador interno
- Armazenar em **centésimos**: 1 crédito = 100 unidades
- 0,1 crédito = 10 unidades
- `remaining_credits` passa a representar "centavos de crédito"
- **Migration:** multiplicar dados existentes por 100

### Opção B: Coluna NUMERIC
- Alterar `remaining_credits` para `NUMERIC(10,2)`
- Permite 0.10, 1.50, etc. diretamente

---

## 4. Regras de Negócio

| Condição | Comportamento |
|----------|---------------|
| Aluno não vinculado | Botão "Pagar com Créditos" **desabilitado** (créditos exigem cliente) |
| Aluno sem créditos | Botão desabilitado + tooltip "Saldo insuficiente" |
| Total em créditos > saldo | Validação no backend retorna erro |
| Carrinho vazio | Botão FECHAR VENDA já desabilitado |

---

## 5. UI no Modal de Pagamento

```
┌─────────────────────────────────────────────────┐
│  Finalizar Venda                                │
├─────────────────────────────────────────────────┤
│  Total a pagar: R$ 14,00                        │
│  Equivalente a: 0,2 créditos (taxa R$ 70/créd)  │
├─────────────────────────────────────────────────┤
│  [💵 Dinheiro]                                   │
│  [📱 PIX (Stripe)]                               │
│  [💳 Cartão (Stripe)]                            │
│  [⭐ Pagar com Créditos]  ← NOVO                 │
│     Saldo: 5,2 créditos (suficiente ✓)          │
└─────────────────────────────────────────────────┘
```

- O botão "Pagar com Créditos" só aparece quando há aluno vinculado
- Mostrar saldo do aluno e se é suficiente
- Se insuficiente: botão desabilitado + mensagem

---

## 6. Backend: Alterações Necessárias

### 6.1 `lib/pos.ts` (processPosPayment)
- Se `paymentMethod === 'credit'` → forçar `model = 'CREDIT'` (independente do business_model do estúdio)
- Garantir que `studentId` seja obrigatório quando method = credit

### 6.2 Nova função: `getPdvCreditConversionRate(studioId)`
- Buscar `lesson_packages` ativos
- Retornar `MIN(price / lessons_count)`
- Fallback: `studio_settings.pdv_credit_reais_per_unit` ou 70

### 6.3 `lib/strategies/payment/credit-strategy.ts`
- Aceitar `priceInCredits` fracionário (ou em centésimos)
- **Adicionar:** baixa de estoque quando `item.type === 'product'` (igual ao monetary-strategy)
- **Adicionar:** `inventory_transactions` para produtos vendidos com crédito
- `usage_type` em `student_credit_usage`: `'pdv_product'` (para diferenciar de aula)

### 6.4 Página PDV (`app/solutions/estudio-de-danca/dashboard/vendas/page.tsx`)
- Buscar taxa de conversão e saldo do aluno ao abrir modal
- Calcular total em créditos
- Adicionar botão "Pagar com Créditos"
- Ao enviar items, incluir `priceInCredits` calculado: `(selling_price * qty) / reaisPerCredit`

---

## 7. Índice da Cobrança ao Cliente

O `selectedStudentId` já vincula a venda ao aluno. O fluxo:
1. `processPosPayment(studioId, selectedStudentId, items, 'credit')`
2. CreditStrategy debita de `student_lesson_credits` onde `student_id = selectedStudentId`
3. `student_credit_usage` registra com `student_id`
4. `createCreditUsagePayment` cria registro em `payments` com `student_id`

A cobrança fica indexada ao cliente exato via `student_id` em todas as tabelas.

---

## 8. Resumo da Fórmula

```
reais_per_credit = MIN(p.price / p.lessons_count) 
                   FROM lesson_packages p 
                   WHERE p.studio_id = ? AND p.is_active = true

credits_for_product = (product.selling_price × quantity) / reais_per_credit

total_credits = SUM(credits_for_product) + credits_from_service_orders
```

---

## 9. Próximos Passos (Implementação)

1. [ ] Migration: suportar créditos fracionários (multiplicador 100 ou NUMERIC)
2. [ ] Criar `getPdvCreditConversionRate(studioId)`
3. [ ] Criar `getStudentCredits(studentId, studioId)` para exibir no modal
4. [ ] Ajustar `processPosPayment` para forçar CREDIT quando method='credit'
5. [ ] Ajustar `CreditPaymentStrategy` para baixa de estoque em produtos
6. [ ] Adicionar botão e lógica no modal da página vendas
7. [ ] Adicionar `studio_settings.pdv_credit_reais_per_unit` nas configurações (opcional)
