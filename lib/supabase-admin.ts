import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Placeholders para evitar "supabaseKey is required" quando env ainda não carregou
const _url = supabaseUrl || 'https://placeholder.supabase.co'
const _key = supabaseServiceRoleKey || 'placeholder-key'

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ Supabase Admin: URL ou Service Role Key não configurada. Configure .env.local e reinicie o servidor.')
}

// Cliente com privilégios de administrador para bypassar RLS
// USE APENAS NO LADO DO SERVIDOR (API Routes, Server Actions)
export const supabaseAdmin: SupabaseClient = createClient(_url, _key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
