import { NextResponse } from 'next/server'
import postgres from 'postgres'
import logger from '@/lib/logger';

export async function GET() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })

  const sql = postgres(DATABASE_URL)

  try {
    logger.info('🚀 Iniciando migração via API...')
    
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS marketplace_settings (
        studio_id UUID PRIMARY KEY,
        store_name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        primary_color TEXT DEFAULT '#000000',
        banner_url TEXT,
        is_active BOOLEAN DEFAULT false,
        style_config JSONB DEFAULT '{
          "buttonStyle": "rounded",
          "cardStyle": "shadow",
          "font": "inter",
          "welcomeTitle": "Bem-vindo(a)!",
          "welcomeSubtitle": "Confira nossos produtos oficiais."
        }',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_slug UNIQUE (slug)
      );

      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_settings' AND policyname = 'Users can manage their own marketplace') THEN
          ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage their own marketplace" ON marketplace_settings FOR ALL USING (auth.uid() = studio_id);
          CREATE POLICY "Public can view active marketplaces" ON marketplace_settings FOR SELECT USING (is_active = true);
        END IF;
      END $$;
    `)

    return NextResponse.json({ success: true, message: 'Tabelas do Marketplace criadas com sucesso!' })
  } catch (error: any) {
    logger.error('❌ Erro na migração via API:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await sql.end()
  }
}
