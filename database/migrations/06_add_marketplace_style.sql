
-- Adicionar coluna de configuração de estilo (JSONB para flexibilidade)
ALTER TABLE marketplace_settings 
ADD COLUMN IF NOT EXISTS style_config JSONB DEFAULT '{
  "buttonStyle": "rounded",
  "cardStyle": "shadow",
  "font": "inter",
  "welcomeTitle": "Bem-vindo(a)!",
  "welcomeSubtitle": "Confira nossos produtos oficiais."
}';
