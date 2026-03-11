-- Tabela para garantir idempotência ao creditar pacotes via Stripe
-- Evita duplo crédito quando webhook e confirm-credit API rodam em paralelo
CREATE TABLE IF NOT EXISTS stripe_package_credits (
  session_id TEXT PRIMARY KEY,
  credited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
