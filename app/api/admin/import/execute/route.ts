import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { logAdmin } from '@/lib/admin-logger'
import { parseBrazilianNumber } from '@/lib/import/data-validator'
import { standardizeData } from '@/lib/import/data-standardizer'
import { toProfessionalRecord, getProfessionalHeaders } from '@/lib/import/crm-model'

export async function POST(request: NextRequest) {
  try {
    const { authUser } = await requireSuperAdmin()
    const body = await request.json()

    const { mapping, data, targetStudio, importType, standardizeForAkaai = true, defaultCategory = 'geral', dryRun = false } = body

    if (!mapping || !data || !targetStudio || !importType) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios faltando' }, { status: 400 })
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Nenhum dado para importar' }, { status: 400 })
    }

    // Limite de proteção: máximo 10.000 registros por chamada
    if (data.length > 10_000) {
      return NextResponse.json({ error: 'Limite de 10.000 registros por importação' }, { status: 400 })
    }

    if (Object.keys(mapping).length === 0) {
      return NextResponse.json({ error: 'Mapeamento de campos vazio' }, { status: 400 })
    }

    // Verificar se o studio existe
    const { data: studioCheck, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('id', targetStudio)
      .single()

    if (studioError || !studioCheck) {
      return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Padronizar dados para AKAAI CORE (torna consistente, não ignora validação)
    let dataToTransform = data
    if (standardizeForAkaai) {
      dataToTransform = standardizeData(data, mapping)
    }

    // 2. Transformar dados baseado no mapeamento (preservar TODO o conteúdo)
    const mappedSourceFields = new Set(Object.values(mapping) as string[])
    const transformedData = dataToTransform.map((row: any) => {
      const transformed: Record<string, any> = {
        studio_id: targetStudio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      Object.entries(mapping).forEach(([targetField, sourceField]) => {
        const val = row[sourceField as string]
        const v = val !== undefined && val !== null ? val : ''
        if (targetField.startsWith('metadata_')) {
          const key = targetField.replace(/^metadata_/, '')
          if (v && String(v).trim() !== '') {
            if (!transformed.metadata) transformed.metadata = {}
            transformed.metadata[key] = v
          }
        } else {
          transformed[targetField] = v
        }
      })
      // Preservar campos NÃO mapeados em metadata (nada perdido)
      if (importType === 'customers' || importType === 'students') {
        const extra: Record<string, any> = transformed.metadata && typeof transformed.metadata === 'object' ? { ...transformed.metadata } : {}
        Object.keys(row).forEach((key) => {
          if (!mappedSourceFields.has(key)) {
            const v = row[key]
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              extra[key] = v
            }
          }
        })
        if (Object.keys(extra).length > 0) {
          transformed.metadata = { ...extra }
        }
      }
      // Modelo CRM: montar name de first_name + last_name, address de address1_*
      if (importType === 'customers' || importType === 'students') {
        if (!transformed.name || String(transformed.name).trim() === '') {
          const fn = String(transformed.first_name || '').trim()
          const ln = String(transformed.last_name || '').trim()
          transformed.name = [fn, ln].filter(Boolean).join(' ') || ''
        }
        if (!transformed.address || String(transformed.address).trim() === '') {
          const parts = [
            transformed.address1_street,
            transformed.address1_city,
            transformed.address1_state,
            transformed.address1_zip,
            transformed.address1_country,
          ].filter((v: any) => v && String(v).trim())
          if (parts.length > 0) transformed.address = parts.join(', ')
        }
        if (transformed.address1_street || transformed.address1_city) {
          transformed.address1 = {
            type: transformed.address1_type || 'residencial',
            street: transformed.address1_street,
            city: transformed.address1_city,
            state: transformed.address1_state,
            zip: transformed.address1_zip,
            country: transformed.address1_country,
          }
        }
        const addr2: Record<string, any> = {}
        if (transformed.address2_type) addr2.type = transformed.address2_type
        if (transformed.address2_city) addr2.city = transformed.address2_city
        if (transformed.address2_state) addr2.state = transformed.address2_state
        if (transformed.address2_zip) addr2.zip = transformed.address2_zip
        if (transformed.address2_country) addr2.country = transformed.address2_country
        if (Object.keys(addr2).length > 0) transformed.address2 = addr2
        const addr3: Record<string, any> = {}
        if (transformed.address3_type) addr3.type = transformed.address3_type
        if (transformed.address3_city) addr3.city = transformed.address3_city
        if (transformed.address3_state) addr3.state = transformed.address3_state
        if (transformed.address3_zip) addr3.zip = transformed.address3_zip
        if (transformed.address3_country) addr3.country = transformed.address3_country
        if (Object.keys(addr3).length > 0) transformed.address3 = addr3
        if (transformed.tags && typeof transformed.tags === 'string') {
          transformed.tags = transformed.tags.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
        }
        if (transformed.last_activity_at && typeof transformed.last_activity_at === 'string' && /^\d{4}-\d{2}/.test(transformed.last_activity_at) && !transformed.last_activity_at.includes('T')) {
          transformed.last_activity_at = `${transformed.last_activity_at.slice(0, 10)}T12:00:00.000Z`
        }
      }
      if ((importType === 'customers' || importType === 'students') && (!transformed.category || String(transformed.category).trim() === '')) {
        transformed.category = defaultCategory
      }
      if (transformed.updated_at && typeof transformed.updated_at === 'string' && /^\d{4}-\d{2}/.test(transformed.updated_at) && !transformed.updated_at.includes('T')) {
        transformed.updated_at = `${transformed.updated_at.slice(0, 10)}T12:00:00.000Z`
      } else if (!transformed.updated_at || String(transformed.updated_at).trim() === '') {
        transformed.updated_at = new Date().toISOString()
      }
      return transformed
    })

    // 3. Enriquecer: preencher campos obrigatórios vazios para preservar todos os registros
    const enrichedData = enrichForImport(transformedData, importType)

    if (dryRun) {
      const preview = enrichedData.slice(0, 5).map((row: Record<string, unknown>) => toProfessionalRecord(row))
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          wouldImport: enrichedData.length,
          preview,
          professionalHeaders: getProfessionalHeaders(),
          validationPassed: true,
          message: `Simulação: ${enrichedData.length} registros prontos para importar. Nenhum dado foi gravado.`,
        },
      })
    }

    // 4. Importar TODOS os registros (nada perdido, conteúdo preservado)
    let importResult = { imported: 0, errors: 0, details: [] as string[] }

    switch (importType) {
      case 'customers':
        importResult = { ...importResult, ...await importLeads(supabase, enrichedData) }
        break
      case 'students':
        importResult = { ...importResult, ...await importStudents(supabase, enrichedData) }
        break
      case 'payments':
        importResult = { ...importResult, ...await importPayments(supabase, enrichedData) }
        break
      case 'products':
        importResult = { ...importResult, ...await importProducts(supabase, enrichedData) }
        break
      case 'services':
        importResult = { ...importResult, ...await importServices(supabase, enrichedData) }
        break
      default:
        return NextResponse.json({ error: `Tipo de importação não suportado: ${importType}` }, { status: 400 })
    }

    await logAdmin('IMPORT_DATA_EXECUTED', {
      user_id: authUser.id,
      studio_id: targetStudio,
      importType,
      totalRecords: data.length,
      importedRecords: importResult.imported,
      errorRecords: importResult.errors,
    })

    return NextResponse.json({ success: true, data: importResult })

  } catch (error) {
    console.error('Import execute error:', error)
    // Não expor detalhes internos do erro ao cliente
    return NextResponse.json({ error: 'Falha na importação dos dados' }, { status: 500 })
  }
}

/**
 * Enriquece dados para importação: preenche campos obrigatórios vazios com fallbacks
 * para que NENHUM registro seja perdido - todo conteúdo é preservado e importado
 */
function enrichForImport(data: any[], importType: string): any[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seenEmails = new Set<string>()

  return data.map((row, index) => {
    const enriched = { ...row }

    if (importType === 'customers' || importType === 'students') {
      // Nome: first_name + last_name ou fallback
      if (!enriched.name || String(enriched.name).trim() === '') {
        const fn = String(enriched.first_name || '').trim()
        const ln = String(enriched.last_name || '').trim()
        enriched.name = [fn, ln].filter(Boolean).join(' ') || 'Sem nome'
      } else {
        enriched.name = String(enriched.name).trim()
      }

      // Email: email ou email_1, se vazio ou inválido gerar único
      let email = (enriched.email || enriched.email_1 || '').toString().trim()
      if (!email || !emailRegex.test(email)) {
        const unique = `importado-${index}-${Date.now()}@importado.local`
        if (seenEmails.has(unique)) {
          enriched.email = `importado-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@importado.local`
        } else {
          enriched.email = unique
          seenEmails.add(unique)
        }
      } else {
        // Email válido mas pode ser duplicado - tratar no import
        enriched.email = email.toLowerCase()
      }

      // updated_at: garantir formato ISO quando veio do mapeamento
      if (enriched.updated_at && typeof enriched.updated_at === 'string') {
        const d = enriched.updated_at.match(/^\d{4}-\d{2}-\d{2}/)
        if (d && !enriched.updated_at.includes('T')) {
          enriched.updated_at = `${enriched.updated_at.slice(0, 10)}T12:00:00.000Z`
        }
      }
    }

    return enriched
  })
}

// Converte valor numérico de forma segura, suportando formato brasileiro
function safeFloat(value: any, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return isNaN(value) ? fallback : value
  const parsed = parseBrazilianNumber(String(value))
  return isNaN(parsed) ? fallback : parsed
}

function safeInt(value: any, fallback = 0): number {
  const f = safeFloat(value, fallback)
  return Math.round(f)
}

async function importLeads(supabase: any, data: any[]) {
  const results = { imported: 0, errors: 0, details: [] as string[] }
  const seenEmailsInBatch = new Set<string>()

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    try {
      let email = row.email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        email = `cliente-${i}-${Date.now()}@importado.local`
      }
      if (seenEmailsInBatch.has(email)) {
        email = `cliente-dup-${i}-${Date.now()}@importado.local`
      }
      seenEmailsInBatch.add(email)

      const name = row.name && String(row.name).trim() ? row.name : 'Sem nome'
      const phone = row.phone_1 || row.phone || null

      const insertData: Record<string, any> = {
        studio_id: row.studio_id,
        name,
        email: email.toLowerCase(),
        phone: phone && String(phone).trim() ? phone : null,
        source: row.source && String(row.source).trim() ? row.source : null,
        stage: 'new',
        status: 'active',
        notes: row.notes && String(row.notes).trim() ? row.notes : null,
        category: row.category && String(row.category).trim() ? row.category : 'geral',
        first_name: row.first_name && String(row.first_name).trim() ? row.first_name : null,
        last_name: row.last_name && String(row.last_name).trim() ? row.last_name : null,
        email_2: row.email_2 && String(row.email_2).trim() ? row.email_2 : null,
        phone_1: row.phone_1 && String(row.phone_1).trim() ? row.phone_1 : null,
        phone_2: row.phone_2 && String(row.phone_2).trim() ? row.phone_2 : null,
        phone_3: row.phone_3 && String(row.phone_3).trim() ? row.phone_3 : null,
        address: row.address && String(row.address).trim() ? row.address : null,
        address1_street: row.address1_street || null,
        address1_city: row.address1_city || null,
        address1_state: row.address1_state || null,
        address1_zip: row.address1_zip || null,
        address1_country: row.address1_country || null,
        company: row.company && String(row.company).trim() ? row.company : null,
        document: row.document && String(row.document).trim() ? row.document : null,
        language: row.language && String(row.language).trim() ? row.language : null,
        email_subscriber_status: row.email_subscriber_status || null,
        sms_subscriber_status: row.sms_subscriber_status || null,
        last_activity_description: row.last_activity_description || null,
        last_activity_at: row.last_activity_at || null,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      }
      if (Array.isArray(row.tags) && row.tags.length > 0) {
        insertData.tags = row.tags
      }
      if (row.metadata && typeof row.metadata === 'object' && Object.keys(row.metadata).length > 0) {
        insertData.metadata = { ...row.metadata }
      }

      const { error } = await supabase.from('leads').insert(insertData)

      if (error) {
        results.errors++
        results.details.push(`Erro ao inserir ${name}: ${error.message}`)
      } else {
        results.imported++
      }
    } catch (error) {
      results.errors++
      results.details.push(`Erro processando linha ${i + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  return results
}

async function importStudents(supabase: any, data: any[]) {
  const results = { imported: 0, errors: 0, details: [] as string[] }
  const seenEmailsInBatch = new Set<string>()

  for (let i = 0; i < data.length; i++) {
    const student = data[i]
    try {
      // Dados já enriquecidos - name e email sempre preenchidos
      let email = student.email
      if (!email) email = `importado-${i}-${Date.now()}@importado.local`

      // Se email duplicado no batch ou já existe no sistema, usar variante única
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('studio_id', student.studio_id)
        .eq('email', email)
        .maybeSingle()

      if (existing || seenEmailsInBatch.has(email)) {
        email = `importado-dup-${i}-${Date.now()}@importado.local`
      }
      seenEmailsInBatch.add(email)

      const name = student.name && String(student.name).trim() ? student.name : 'Sem nome'
      const phone = student.phone_1 || student.phone || null

      const insertData: Record<string, any> = {
        name,
        email,
        first_name: student.first_name && String(student.first_name).trim() ? student.first_name : null,
        last_name: student.last_name && String(student.last_name).trim() ? student.last_name : null,
        phone: phone && String(phone).trim() ? phone : null,
        phone_1: student.phone_1 && String(student.phone_1).trim() ? student.phone_1 : null,
        phone_2: student.phone_2 && String(student.phone_2).trim() ? student.phone_2 : null,
        phone_3: student.phone_3 && String(student.phone_3).trim() ? student.phone_3 : null,
        email_2: student.email_2 && String(student.email_2).trim() ? student.email_2 : null,
        document: student.document && String(student.document).trim() ? student.document : null,
        address: student.address && String(student.address).trim() ? student.address : null,
        address1_type: student.address1_type || null,
        address1_street: student.address1_street || null,
        address1_city: student.address1_city || null,
        address1_state: student.address1_state || null,
        address1_zip: student.address1_zip || null,
        address1_country: student.address1_country || null,
        address2: student.address2 && typeof student.address2 === 'object' ? student.address2 : null,
        address3: student.address3 && typeof student.address3 === 'object' ? student.address3 : null,
        company: student.company && String(student.company).trim() ? student.company : null,
        tags: Array.isArray(student.tags) && student.tags.length > 0 ? student.tags : null,
        source: student.source && String(student.source).trim() ? student.source : null,
        language: student.language && String(student.language).trim() ? student.language : null,
        email_subscriber_status: student.email_subscriber_status || null,
        sms_subscriber_status: student.sms_subscriber_status || null,
        last_activity_description: student.last_activity_description || null,
        last_activity_at: student.last_activity_at || null,
        birth_date: student.birth_date && String(student.birth_date).trim() ? student.birth_date : null,
        category: student.category && String(student.category).trim() ? student.category : 'geral',
        studio_id: student.studio_id,
        status: 'active',
        created_at: student.created_at || new Date().toISOString(),
        updated_at: student.updated_at || new Date().toISOString(),
      }
      if (student.metadata && typeof student.metadata === 'object' && Object.keys(student.metadata).length > 0) {
        insertData.metadata = { ...student.metadata }
      }

      const { error } = await supabase.from('students').insert(insertData)

      if (error) {
        results.errors++
        results.details.push(`Erro ao inserir ${name}: ${error.message}`)
      } else {
        results.imported++
      }
    } catch (error) {
      results.errors++
      results.details.push(`Erro processando linha ${i + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  return results
}

async function importPayments(supabase: any, data: any[]) {
  const results = { imported: 0, errors: 0, details: [] as string[] }

  for (const payment of data) {
    try {
      if (!payment.amount || !payment.due_date) {
        results.errors++
        results.details.push('Pagamento sem valor ou data de vencimento')
        continue
      }

      const amount = safeFloat(payment.amount)
      if (amount <= 0) {
        results.errors++
        results.details.push(`Valor inválido para pagamento: ${payment.amount}`)
        continue
      }

      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          amount,
          due_date: payment.due_date,
          payment_date: payment.payment_date || null,
          payment_method: payment.payment_method || 'other',
          status: payment.status || 'pending',
          description: payment.description || 'Importado',
          studio_id: payment.studio_id,
          type: 'income',
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        })

      if (error) {
        results.errors++
        results.details.push(`Erro ao inserir pagamento: ${error.message}`)
      } else {
        results.imported++
      }
    } catch (error) {
      results.errors++
      results.details.push(`Erro processando pagamento: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  return results
}

async function importProducts(supabase: any, data: any[]) {
  const results = { imported: 0, errors: 0, details: [] as string[] }

  for (const product of data) {
    try {
      if (!product.name) {
        results.errors++
        results.details.push('Produto sem nome')
        continue
      }

      const price = safeFloat(product.price, 0)
      const stock = safeInt(product.stock, 0)

      const { error } = await supabase
        .from('inventory_items')
        .insert({
          name: product.name,
          description: product.description || null,
          price,
          category: product.category || 'general',
          stock,
          sku: product.sku || null,
          studio_id: product.studio_id,
          status: 'active',
          created_at: product.created_at,
          updated_at: product.updated_at,
        })

      if (error) {
        results.errors++
        results.details.push(`Erro ao inserir produto ${product.name}: ${error.message}`)
      } else {
        results.imported++
      }
    } catch (error) {
      results.errors++
      results.details.push(`Erro processando produto: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  return results
}

async function importServices(supabase: any, data: any[]) {
  const results = { imported: 0, errors: 0, details: [] as string[] }

  for (const service of data) {
    try {
      if (!service.name) {
        results.errors++
        results.details.push('Serviço sem nome')
        continue
      }

      const price = safeFloat(service.price, 0)
      const duration = safeInt(service.duration, 60)

      const { error } = await supabase
        .from('classes')
        .insert({
          name: service.name,
          description: service.description || null,
          price,
          duration,
          category: service.category || 'general',
          studio_id: service.studio_id,
          status: 'active',
          created_at: service.created_at,
          updated_at: service.updated_at,
        })

      if (error) {
        results.errors++
        results.details.push(`Erro ao inserir serviço ${service.name}: ${error.message}`)
      } else {
        results.imported++
      }
    } catch (error) {
      results.errors++
      results.details.push(`Erro processando serviço: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  return results
}
