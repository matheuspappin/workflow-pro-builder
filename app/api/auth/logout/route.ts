import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // 1. Sign out do Supabase (limpa os cookies de auth via SSR)
    await supabase.auth.signOut()

    // 2. Limpar os cookies adicionais de compatibilidade
    const response = NextResponse.json({ success: true })
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    }

    response.cookies.set('user-role', '', cookieOptions)
    response.cookies.set('user-plan', '', cookieOptions)
    response.cookies.set('sb-auth-token', '', cookieOptions) // Fallback para versões legadas

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
