import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Caminho para o arquivo .env na raiz do projeto
const envPath = path.join(process.cwd(), '.env')

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
  const auth = await requireSuperAdmin()
  if (!auth.authorized) return auth.response!

  try {
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({ error: 'Arquivo .env não encontrado' }, { status: 404 })
    }

    const envContent = fs.readFileSync(envPath, 'utf8')
    const parsedEnv = dotenv.parse(envContent)

    // Filtramos apenas as chaves que queremos expor/editar por segurança
    const editableKeys = [
      'OPENAI_API_KEY',
      'GOOGLE_AI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'EMAIL_SENDER_ADDRESS',
      'EMAIL_SENDER_NAME',
      'EMAIL_SENDER_PASSWORD',
      'EMAIL_SMTP_HOST',
      'EMAIL_SMTP_PORT',
      'EMAIL_SECURE',
      'EMAIL_SMTP_USER'
    ]

    const config: Record<string, string> = {}
    editableKeys.forEach(key => {
      config[key] = parsedEnv[key] || ''
    })

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const newConfig = await request.json()
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({ error: 'Arquivo .env não encontrado' }, { status: 404 })
    }

    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Atualizamos as chaves no conteúdo do arquivo
    Object.entries(newConfig).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*`, 'm')
      const newLine = `${key}=${value}`
      
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine)
      } else {
        envContent += `\n${newLine}`
      }
    })

    fs.writeFileSync(envPath, envContent, 'utf8')

    return NextResponse.json({ success: true, message: 'Arquivo .env atualizado com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
