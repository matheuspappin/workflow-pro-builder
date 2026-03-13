# Payment Gateway — PIX e Cartão

## Visão geral

O sistema usa **Stripe** como gateway principal, com suporte a **cartão** e **PIX** em todos os fluxos de checkout. O PIX aparece automaticamente na página do Stripe Checkout quando a conta é elegível (Brasil, BRL, 60+ dias de histórico).

## Fluxos com PIX habilitado

| Rota | Uso |
|------|-----|
| `POST /api/admin/checkout` | Planos da plataforma (studio → assinatura) |
| `POST /api/checkout` | Mensalidades e pacotes de alunos |
| `POST /api/dance-studio/packages/checkout` | Compra de créditos de aula |
| `POST /api/stripe/create-checkout-session` | Loja (shop) |
| `createPosStripeSession` (lib/actions/pos.ts) | PDV — cartão ou PIX |

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | Sim | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Sim | Assinatura do webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sim | Chave pública (frontend) |

## Requisitos Stripe PIX

- Conta Stripe em bom standing
- Mínimo 60 dias de histórico de processamento
- Suporte a BRL (Real) habilitado
- Clientes localizados no Brasil

Se a conta não for elegível, o Stripe Checkout exibe apenas cartão — não há erro.

## Gateway alternativo (futuro)

A pasta `lib/payment-gateway/` contém abstração para adicionar provedores alternativos:

- **Asaas**: cobranças PIX, boletos, conciliação. API em https://docs.asaas.com
- **Pagar.me**: gateway BR completo. SDK: `@pagarme/sdk`

Para habilitar Asaas no futuro:

1. Adicionar `ASAAS_API_KEY` nas variáveis
2. Implementar `lib/payment-gateway/asaas-provider.ts`
3. Ajustar factory em `lib/payment-gateway/index.ts` para selecionar provedor por studio ou configuração global
