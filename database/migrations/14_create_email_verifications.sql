-- Tabela de Verificação de E-mail (Substitui WhatsApp)
DROP TABLE IF EXISTS email_verifications CASCADE;
CREATE TABLE email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow public insert (needed for registration flow)
CREATE POLICY "Enable insert for all" ON email_verifications
FOR INSERT WITH CHECK (true);

-- Allow public select by email and code
CREATE POLICY "Enable select for all" ON email_verifications
FOR SELECT USING (true);

-- Allow public update for verification
CREATE POLICY "Enable update for all" ON email_verifications
FOR UPDATE USING (true);

-- Allow public delete (to clean up old codes)
CREATE POLICY "Enable delete for all" ON email_verifications
FOR DELETE USING (true);
