-- Migration 123: Tabela de comissões de afiliados (revenue share)
-- Registra cada comissão gerada quando estúdio indicado por afiliado paga plano.
-- Permite auditoria e retry quando transferência Stripe falha (ex: saldo pendente).

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  studio_invoice_id UUID REFERENCES studio_invoices(id) ON DELETE SET NULL,
  stripe_session_id VARCHAR(255),
  amount_brl DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount_brl DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transferred', 'failed', 'cancelled')),
  stripe_transfer_id VARCHAR(255),
  error_detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_partner ON affiliate_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_studio ON affiliate_commissions(studio_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status) WHERE status = 'pending';

COMMENT ON TABLE affiliate_commissions IS
  'Comissões de afiliados sobre pagamentos de planos (revenue share). '
  'status=pending: aguardando transferência; transferred: enviado ao Stripe Connect; failed: erro na transferência.';
