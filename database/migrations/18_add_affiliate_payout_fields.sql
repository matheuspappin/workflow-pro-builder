ALTER TABLE users_internal
ADD COLUMN stripe_account_id TEXT;

CREATE TABLE affiliate_payout_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payout_frequency TEXT NOT NULL DEFAULT 'weekly', -- 'weekly', 'monthly', etc.
    minimum_payout_amount INTEGER NOT NULL DEFAULT 1000, -- em centavos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar RLS para a nova tabela, se necess\xc3\xa1rio.
-- Exemplo:
-- ALTER TABLE affiliate_payout_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY \"Usu\xc3\xa1rios podem ver suas pr\xc3\xb3prias configura\xc3\xa7\xc3\xb5es de pagamento.\" ON affiliate_payout_settings FOR SELECT USING (auth.uid() = user_id);\n-- CREATE POLICY \"Usu\xc3\xa1rios podem atualizar suas pr\xc3\xb3prias configura\xc3\xa7\xc3\xb5es de pagamento.\" ON affiliate_payout_settings FOR UPDATE USING (auth.uid() = user_id);