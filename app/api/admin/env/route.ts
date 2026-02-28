import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const envPath = path.join(process.cwd(), '.env')

// Chaves permitidas para leitura (sem valores sensíveis) e edição. Secrets NUNCA são expostos.
const ALLOWED_KEYS = new Set([
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'EMAIL_SENDER_ADDRESS', 'EMAIL_SENDER_NAME',
  'EMAIL_SMTP_HOST', 'EMAIL_SMTP_PORT', 'EMAIL_SECURE', 'EMAIL_SMTP_USER'
])

function maskSecret(val: string): string {
  if (!val || val.length < 4) return '****'
  return val.slice(0, 2) + '****' + val.slice(-2)
}

async function requireSuperAdmin(): Promise<{ authorized: boolean; response?: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!internalUser || internalUser.role !== 'super_admin') {
    return { authorized: false, response: NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 }) }
  }

  return { authorized: true }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production' || process.env.ADMIN_ENV_DISABLED === 'true') {
    return NextResponse.json({ error: 'Endpoint desativado em produção' }, { status: 404 })
  }
  const auth = await requireSuperAdmin()
  if (!auth.authorized) return auth.response!

  try {
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({ error: 'Arquivo .env não encontrado' }, { status: 404 })
    }
    const parsedEnv = dotenv.parse(fs.readFileSync(envPath, 'utf8'))
    const config: Record<string, string> = {}
    ALLOWED_KEYS.forEach(key => {
      const val = parsedEnv[key]
      config[key] = val ? maskSecret(val) : '(não definido)'
    })
    return NextResponse.json(config)
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || process.env.ADMIN_ENV_DISABLED === 'true') {
    return NextResponse.json({ error: 'Endpoint desativado em produção' }, { status: 404 })
  }
  const auth = await requireSuperAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const newConfig = await request.json()
    if (typeof newConfig !== 'object' || newConfig === null) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({ error: 'Arquivo .env não encontrado' }, { status: 404 })
    }

    let envContent = fs.readFileSync(envPath, 'utf8')
    const toUpdate: Record<string, string> = {}
    for (const [key, value] of Object.entries(newConfig)) {
      if (typeof key === 'string' && ALLOWED_KEYS.has(key) && typeof value === 'string') {
        toUpdate[key] = String(value).replace(/\n/g, '')
      }
    }
    const escapedKey = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const [key, value] of Object.entries(toUpdate)) {
      const regex = new RegExp(`^${escapedKey(key)}=.*`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        envContent += `\n${key}=${value}`
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8')
    return NextResponse.json({ success: true, message: 'Arquivo .env atualizado com sucesso!' })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
