import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { parseFile, detectFileType } from '@/lib/import/file-parser'
import { analyzeDataStructure } from '@/lib/import/ai-analyzer'
import { logAdmin } from '@/lib/admin-logger'
import crypto from 'crypto'

// Cache em memória para armazenar datasets completos entre upload e execute
// TTL de 30 minutos — suficiente para o fluxo de mapeamento
const importSessionCache = new Map<string, {
  rows: any[]
  headers: string[]
  expiresAt: number
}>()

// Limpar entradas expiradas periodicamente
function purgeExpiredSessions() {
  const now = Date.now()
  for (const [key, value] of importSessionCache.entries()) {
    if (value.expiresAt < now) importSessionCache.delete(key)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authUser } = await requireSuperAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetStudio = formData.get('targetStudio') as string
    const importType = formData.get('importType') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!targetStudio || targetStudio.trim() === '') {
      return NextResponse.json({ error: 'Estúdio destino é obrigatório' }, { status: 400 })
    }

    if (!importType || importType.trim() === '') {
      return NextResponse.json({ error: 'Tipo de importação é obrigatório' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 50MB)' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const fileType = detectFileType(buffer, file.name)

    if (fileType === 'unknown') {
      return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 })
    }

    // Parsear arquivo completo
    const parsedData = await parseFile(buffer, fileType, file.name)

    // Analisar estrutura dos dados (usando amostra para performance)
    const sampleForAnalysis = parsedData.rows.slice(0, 50)
    const analysis = await analyzeDataStructure(sampleForAnalysis, importType)

    // Gerar ID de sessão único para este upload
    const sessionId = crypto.randomUUID()

    // Armazenar dataset COMPLETO no cache do servidor (TTL 30 min)
    purgeExpiredSessions()
    importSessionCache.set(sessionId, {
      rows: parsedData.rows,
      headers: parsedData.headers,
      expiresAt: Date.now() + 30 * 60 * 1000,
    })

    await logAdmin('IMPORT_FILE_UPLOADED', {
      user_id: authUser.id,
      studio_id: targetStudio,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      targetStudio,
      importType,
      recordCount: parsedData.rows.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        fileName: file.name,
        fileType,
        recordCount: parsedData.rows.length,
        // Retornar apenas amostra para preview — dataset completo fica no servidor
        sample: parsedData.rows.slice(0, 10),
        headers: parsedData.headers,
        analysis,
      },
    })

  } catch (error) {
    console.error('Import upload error:', error)
    return NextResponse.json({ error: 'Falha no upload do arquivo' }, { status: 500 })
  }
}

// Endpoint para recuperar dataset completo (usado pelo execute route via GET)
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    const session = importSessionCache.get(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Sessão de importação expirada ou não encontrada. Faça o upload novamente.' }, { status: 404 })
    }

    if (session.expiresAt < Date.now()) {
      importSessionCache.delete(sessionId)
      return NextResponse.json({ error: 'Sessão de importação expirada. Faça o upload novamente.' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      data: {
        rows: session.rows,
        headers: session.headers,
        recordCount: session.rows.length,
      },
    })

  } catch (error) {
    console.error('Import session get error:', error)
    return NextResponse.json({ error: 'Erro ao recuperar sessão de importação' }, { status: 500 })
  }
}
