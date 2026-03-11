import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const url = supabaseUrl || 'https://placeholder.supabase.co'
  const key = supabaseAnonKey || 'placeholder-key'

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '⚠️ Supabase não configurado. Crie um arquivo .env.local com:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon'
    )
  }
  return createBrowserClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
}
