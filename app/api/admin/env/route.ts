import { NextResponse } from 'next/server'

// Endpoint permanentemente desativado por razões de segurança.
// Gerenciamento de variáveis de ambiente deve ser feito exclusivamente
// via painel da plataforma de hospedagem (Vercel Dashboard / CLI).
// Nunca exponha leitura ou escrita de .env via HTTP.

export async function GET() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
