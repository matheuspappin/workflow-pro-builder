// AI Analyzer - usando regras e heurísticas em vez de API externa
// Futuramente pode ser integrado com Google Gemini quando disponível

export interface FieldMapping {
  sourceField: string
  targetField: string
  confidence: number
  dataType: 'text' | 'number' | 'email' | 'phone' | 'date' | 'currency' | 'boolean'
  sampleValue?: string
  suggestions?: string[]
}

export interface ImportAnalysis {
  suggestedMappings: FieldMapping[]
  dataQuality: {
    completeness: number // 0-100
    consistency: number  // 0-100
    validity: number     // 0-100
    issues: string[]
  }
  detectedEntityType: 'customers' | 'students' | 'payments' | 'products' | 'services' | 'unknown'
  confidence: number
  recommendations: string[]
}

export async function analyzeDataStructure(data: any[], importType?: string): Promise<ImportAnalysis> {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para analisar')
  }
  
  const headers = Object.keys(data[0])
  const sampleRows = data.slice(0, Math.min(10, data.length))
  
  // Análise básica dos dados
  const fieldAnalysis = analyzeFields(headers, sampleRows)
  
  // Usar IA para mapeamento inteligente
  const aiMappings = await getAIMappings(headers, sampleRows, importType)
  
  // Avaliar qualidade dos dados
  const qualityMetrics = evaluateDataQuality(data, headers)
  
  // Detectar tipo de entidade
  const entityType = detectEntityType(headers, sampleRows)
  
  return {
    suggestedMappings: aiMappings,
    dataQuality: qualityMetrics,
    detectedEntityType: entityType,
    confidence: calculateConfidence(aiMappings, qualityMetrics),
    recommendations: generateRecommendations(fieldAnalysis, qualityMetrics, entityType)
  }
}

function analyzeFields(headers: string[], sampleRows: any[]): any[] {
  return headers.map(header => {
    const values = sampleRows.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '')
    
    return {
      name: header,
      type: inferDataType(values),
      nullCount: sampleRows.length - values.length,
      uniqueCount: new Set(values).size,
      sampleValues: values.slice(0, 3)
    }
  })
}

function inferDataType(values: any[]): string {
  if (values.length === 0) return 'text'

  const stringValues = values.map(v => (v !== null && v !== undefined ? String(v).trim() : '')).filter(v => v !== '')
  if (stringValues.length === 0) return 'text'

  // Verificar se são números
  const numericValues = stringValues.filter(v => {
    const normalized = v.replace(/\./g, '').replace(',', '.')
    return !isNaN(parseFloat(normalized)) && isFinite(Number(normalized))
  })
  if (numericValues.length / stringValues.length > 0.8) return 'number'

  // Verificar se são datas usando regex específicos — evitar falsos positivos do Date.parse
  const dateRegex = /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$|^\d{4}-\d{2}-\d{2}(T.*)?$/
  const dateValues = stringValues.filter(v => dateRegex.test(v))
  if (dateValues.length / stringValues.length > 0.8) return 'date'
  
  // Verificar se são emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailValues = values.filter(v => emailRegex.test(v))
  if (emailValues.length / values.length > 0.8) return 'email'
  
  // Verificar se são telefones
  const phoneRegex = /^[\d\s\-\(\)\+]+$/
  const phoneValues = values.filter(v => phoneRegex.test(v) && v.length >= 10)
  if (phoneValues.length / values.length > 0.8) return 'phone'
  
  // Verificar se são booleanos
  const boolValues = values.filter(v => 
    ['true', 'false', 'sim', 'não', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
  )
  if (boolValues.length / values.length > 0.8) return 'boolean'
  
  return 'text'
}

async function getAIMappings(
  headers: string[],
  sampleRows: any[],
  importType?: string
): Promise<FieldMapping[]> {
  const ruleMappings = getRuleBasedMappings(headers, sampleRows, importType)
  const apiKey = process.env.GOOGLE_AI_API_KEY

  if (!apiKey) {
    return ruleMappings
  }

  try {
    const context = prepareAIContext(headers, sampleRows, importType)
    const prompt = `Você é um assistente de mapeamento de dados. O CRM espera certos campos; o arquivo tem outros. MAPEIE TUDO - cada coluna do arquivo é importante.

OBJETIVO: Encontrar a MELHOR correspondência entre o que o arquivo tem e o que o CRM precisa. Seja flexível e criativo.

TIPOS DE CLIENTE no CRM: marketplace (comprou via marketplace), curso (comprou curso), aula_experimental (fez aula experimental), geral.

CAMPOS DO ARQUIVO (origem) - MAPEIE TODOS:
${headers.map((h) => `- "${h}": ${(context.fieldSamples[h] || []).slice(0, 3).join(', ') || 'vazio'}`).join('\n')}

CAMPOS QUE O CRM ACEITA (destino): first_name, last_name, name, email, email_2, phone_1, phone_2, phone_3, address1_street, address1_city, address1_state, address1_zip, address1_country, company, tags, source, language, category, client_type, created_at, last_activity_at, document, birth_date, notes, origin, purchase_type

REGRAS:
1. MAPEIE TODAS as colunas do arquivo - mesmo que não tenha campo exato, use o mais próximo (ex: "Origem" -> source, "Tipo compra" -> purchase_type ou category)
2. sourceField = nome EXATO da coluna no arquivo
3. Para colunas de origem/tipo (marketplace, curso, trial) -> category ou client_type
4. Colunas sem correspondência direta -> use "metadata_[nome_normalizado]" como targetField (serão guardadas)
5. confidence 0.5-1.0. Seja generoso no mapeamento.

Retorne APENAS JSON válido:
{"mappings":[{"sourceField":"Nome exato","targetField":"campo_destino","confidence":0.85,"dataType":"text","sampleValue":"ex"}]}`

    const modelFallbacks = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
    for (const model of modelFallbacks) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
            }),
          }
        )
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) continue
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) continue
        const parsed = JSON.parse(jsonMatch[0])
        const mappings = parsed.mappings || []
        if (mappings.length > 0) {
          return mappings.map((m: any) => ({
            sourceField: m.sourceField || '',
            targetField: m.targetField || '',
            confidence: typeof m.confidence === 'number' ? m.confidence : 0.8,
            dataType: (m.dataType || 'text') as FieldMapping['dataType'],
            sampleValue: m.sampleValue,
            suggestions: m.suggestions || [],
          })).filter((m: FieldMapping) => m.sourceField && m.targetField && m.confidence > 0.5)
        }
      } catch {
        continue
      }
    }
  } catch (error) {
    console.error('AI mapping error:', error)
  }
  return ruleMappings
}

function prepareAIContext(headers: string[], sampleRows: any[], importType?: string): any {
  const fieldSamples: { [key: string]: string[] } = {}
  
  headers.forEach(header => {
    const values = sampleRows
      .map(row => row[header])
      .filter(val => val !== null && val !== undefined && val !== '')
      .slice(0, 5)
    fieldSamples[header] = values
  })
  
  // Campos destino comuns baseados no tipo
  const targetFields = getTargetFields(importType)
  
  return {
    context: `Análise de dados para importação de ${importType || 'dados genéricos'}`,
    fieldSamples,
    targetFields
  }
}

function getTargetFields(importType?: string): Array<{name: string, description: string}> {
  const commonFields = [
    { name: 'name', description: 'Nome completo da pessoa/empresa' },
    { name: 'email', description: 'Endereço de email' },
    { name: 'phone', description: 'Telefone de contato' },
    { name: 'document', description: 'CPF/CNPJ' },
    { name: 'address', description: 'Endereço completo' },
    { name: 'city', description: 'Cidade' },
    { name: 'state', description: 'Estado' },
    { name: 'zip_code', description: 'CEP' },
    { name: 'created_at', description: 'Data de cadastro' },
    { name: 'updated_at', description: 'Data da última atualização do contato' },
    { name: 'status', description: 'Status do registro' }
  ]
  
  switch (importType) {
    case 'customers':
    case 'students':
      return [
        { name: 'first_name', description: 'Nome' },
        { name: 'last_name', description: 'Sobrenome' },
        { name: 'name', description: 'Nome completo (fallback)' },
        { name: 'email', description: 'Email 1' },
        { name: 'email_2', description: 'Email 2' },
        { name: 'phone_1', description: 'Telefone 1' },
        { name: 'phone_2', description: 'Telefone 2' },
        { name: 'phone_3', description: 'Telefone 3' },
        { name: 'phone', description: 'Telefone (fallback)' },
        { name: 'address1_type', description: 'Endereço 1 - Tipo' },
        { name: 'address1_street', description: 'Endereço 1 - Rua' },
        { name: 'address1_city', description: 'Endereço 1 - Cidade' },
        { name: 'address1_state', description: 'Endereço 1 - Estado/Região' },
        { name: 'address1_zip', description: 'Endereço 1 - CEP' },
        { name: 'address1_country', description: 'Endereço 1 - País' },
        { name: 'company', description: 'Empresa' },
        { name: 'tags', description: 'Etiquetas' },
        { name: 'created_at', description: 'Criado às (UTC+0)' },
        { name: 'email_subscriber_status', description: 'Status do assinante de email' },
        { name: 'sms_subscriber_status', description: 'Status do assinante de SMS' },
        { name: 'last_activity_description', description: 'Última atividade' },
        { name: 'last_activity_at', description: 'Data da última atividade (UTC+0)' },
        { name: 'source', description: 'Fonte' },
        { name: 'language', description: 'Idioma' },
        ...commonFields,
        { name: 'category', description: 'Categoria no CRM' },
        { name: 'birth_date', description: 'Data de nascimento' },
        { name: 'document', description: 'CPF/CNPJ' },
      ]
    
    case 'payments':
      return [
        { name: 'amount', description: 'Valor do pagamento' },
        { name: 'due_date', description: 'Data de vencimento' },
        { name: 'payment_date', description: 'Data do pagamento' },
        { name: 'payment_method', description: 'Método de pagamento' },
        { name: 'status', description: 'Status do pagamento' },
        { name: 'description', description: 'Descrição do pagamento' }
      ]
    
    case 'products':
      return [
        { name: 'name', description: 'Nome do produto' },
        { name: 'description', description: 'Descrição do produto' },
        { name: 'price', description: 'Preço' },
        { name: 'category', description: 'Categoria' },
        { name: 'stock', description: 'Estoque' },
        { name: 'sku', description: 'Código do produto' }
      ]
    
    default:
      return commonFields
  }
}

function getRuleBasedMappings(headers: string[], sampleRows: any[], importType?: string): FieldMapping[] {
  const mappings: FieldMapping[] = []
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim()
    const values = sampleRows.map(row => row[header]).filter(v => v)
    const dataType = inferDataType(values) as any
    
    let targetField = ''
    let confidence = 0.5
    
    // Modelo CRM completo (customers/students)
    if (importType === 'customers' || importType === 'students') {
      if (normalizedHeader === 'email 1') {
        targetField = 'email'
        confidence = 0.95
      } else if (normalizedHeader === 'nome' || normalizedHeader === 'name') {
        targetField = 'first_name'
        confidence = 0.95
      } else if (normalizedHeader === 'sobrenome' || normalizedHeader === 'last name' || normalizedHeader === 'lastname') {
        targetField = 'last_name'
        confidence = 0.95
      } else if (normalizedHeader === 'email 1' || (normalizedHeader.includes('email') && !normalizedHeader.includes('2'))) {
        targetField = 'email'
        confidence = 0.95
      } else if (normalizedHeader === 'email 2') {
        targetField = 'email_2'
        confidence = 0.95
      } else if (normalizedHeader === 'telefone 1' || (normalizedHeader.includes('telefone') && !normalizedHeader.includes('2') && !normalizedHeader.includes('3'))) {
        targetField = 'phone_1'
        confidence = 0.9
      } else if (normalizedHeader === 'telefone 2') {
        targetField = 'phone_2'
        confidence = 0.9
      } else if (normalizedHeader === 'telefone 3') {
        targetField = 'phone_3'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - tipo') || normalizedHeader.includes('address1') && normalizedHeader.includes('type')) {
        targetField = 'address1_type'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - rua') || normalizedHeader.includes('rua')) {
        targetField = 'address1_street'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - cidade') || (normalizedHeader.includes('cidade') && !normalizedHeader.includes('2') && !normalizedHeader.includes('3'))) {
        targetField = 'address1_city'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - estado') || normalizedHeader.includes('estado/região')) {
        targetField = 'address1_state'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - código') || normalizedHeader.includes('cep') || normalizedHeader.includes('código postal')) {
        targetField = 'address1_zip'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 1 - país')) {
        targetField = 'address1_country'
        confidence = 0.9
      } else if (normalizedHeader.includes('endereço 2 -')) {
        if (normalizedHeader.includes('tipo')) targetField = 'address2_type'
        else if (normalizedHeader.includes('cidade')) targetField = 'address2_city'
        else if (normalizedHeader.includes('estado')) targetField = 'address2_state'
        else if (normalizedHeader.includes('código') || normalizedHeader.includes('cep')) targetField = 'address2_zip'
        else if (normalizedHeader.includes('país')) targetField = 'address2_country'
        if (targetField) confidence = 0.85
      } else if (normalizedHeader.includes('endereço 3 -')) {
        if (normalizedHeader.includes('tipo')) targetField = 'address3_type'
        else if (normalizedHeader.includes('cidade')) targetField = 'address3_city'
        else if (normalizedHeader.includes('estado')) targetField = 'address3_state'
        else if (normalizedHeader.includes('código') || normalizedHeader.includes('cep')) targetField = 'address3_zip'
        else if (normalizedHeader.includes('país')) targetField = 'address3_country'
        if (targetField) confidence = 0.85
      } else if (normalizedHeader.includes('empresa') || normalizedHeader === 'company') {
        targetField = 'company'
        confidence = 0.95
      } else if (normalizedHeader.includes('etiqueta') || normalizedHeader === 'tags') {
        targetField = 'tags'
        confidence = 0.9
      } else if (normalizedHeader.includes('criado às') || normalizedHeader.includes('criado em')) {
        targetField = 'created_at'
        confidence = 0.9
      } else if (normalizedHeader.includes('status do assinante de email')) {
        targetField = 'email_subscriber_status'
        confidence = 0.95
      } else if (normalizedHeader.includes('status do assinante de sms')) {
        targetField = 'sms_subscriber_status'
        confidence = 0.95
      } else if (normalizedHeader.includes('última atividade') && !normalizedHeader.includes('data')) {
        targetField = 'last_activity_description'
        confidence = 0.9
      } else if (normalizedHeader.includes('data da última atividade') || normalizedHeader.includes('data da última')) {
        targetField = 'last_activity_at'
        confidence = 0.95
      } else if (normalizedHeader === 'fonte' || normalizedHeader === 'source') {
        targetField = 'source'
        confidence = 0.95
      } else if (normalizedHeader === 'idioma' || normalizedHeader === 'language') {
        targetField = 'language'
        confidence = 0.95
      } else if (normalizedHeader.includes('tipo') && (normalizedHeader.includes('cliente') || normalizedHeader.includes('compra') || normalizedHeader.includes('origem'))) {
        targetField = 'category'
        confidence = 0.9
      } else if (normalizedHeader.includes('marketplace') || normalizedHeader.includes('origem') && normalizedHeader.includes('venda')) {
        targetField = 'source'
        confidence = 0.85
      } else if (normalizedHeader.includes('curso') || normalizedHeader.includes('aula experimental') || normalizedHeader.includes('trial')) {
        targetField = 'category'
        confidence = 0.9
      }
    }
    
    // Fallbacks genéricos (quando não match específico CRM)
    if (!targetField) {
      if (normalizedHeader.includes('nome') && !normalizedHeader.includes('sobrenome')) {
        targetField = 'first_name'
        confidence = 0.85
      } else if (normalizedHeader.includes('sobrenome')) {
        targetField = 'last_name'
        confidence = 0.85
      } else if (normalizedHeader.includes('email') && !targetField) {
        targetField = normalizedHeader.includes('2') ? 'email_2' : 'email'
        confidence = 0.9
      } else if (normalizedHeader.includes('telefone') || normalizedHeader.includes('phone')) {
        if (normalizedHeader.includes('2')) targetField = 'phone_2'
        else if (normalizedHeader.includes('3')) targetField = 'phone_3'
        else targetField = 'phone_1'
        confidence = 0.85
      } else if (normalizedHeader.includes('cpf') || normalizedHeader.includes('cnpj')) {
        targetField = 'document'
        confidence = 0.85
      } else if (normalizedHeader.includes('valor') || normalizedHeader.includes('amount') || normalizedHeader.includes('price')) {
        targetField = 'amount'
        confidence = 0.8
      } else if (normalizedHeader.includes('data_vencimento') || normalizedHeader.includes('vencimento')) {
        targetField = 'due_date'
        confidence = 0.85
      } else if (normalizedHeader.includes('data_pagamento') || normalizedHeader.includes('pagamento')) {
        targetField = 'payment_date'
        confidence = 0.85
      } else if (normalizedHeader.includes('data_nascimento') || normalizedHeader.includes('nascimento')) {
        targetField = 'birth_date'
        confidence = 0.85
      } else if (normalizedHeader.includes('criado') || normalizedHeader.includes('created')) {
        targetField = 'created_at'
        confidence = 0.8
      } else if (normalizedHeader.includes('atualiz') || normalizedHeader.includes('updated') || normalizedHeader.includes('última atividade')) {
        targetField = 'last_activity_at'
        confidence = 0.85
      } else if (normalizedHeader.includes('categoria') || normalizedHeader.includes('category') || normalizedHeader.includes('tipo cliente') || normalizedHeader.includes('tipo_cliente')) {
        targetField = 'category'
        confidence = 0.85
      } else if (normalizedHeader.includes('marketplace') || normalizedHeader.includes('origem compra') || normalizedHeader.includes('tipo compra')) {
        targetField = 'category'
        confidence = 0.8
      } else if (normalizedHeader.includes('status') && !normalizedHeader.includes('assinante')) {
        targetField = 'status'
        confidence = 0.8
      } else if (normalizedHeader.includes('rua') || normalizedHeader.includes('street')) {
        targetField = 'address1_street'
        confidence = 0.8
      } else if (normalizedHeader.includes('cidade') || normalizedHeader.includes('city')) {
        targetField = 'address1_city'
        confidence = 0.8
      } else if (normalizedHeader.includes('estado') || normalizedHeader.includes('state')) {
        targetField = 'address1_state'
        confidence = 0.8
      } else if (normalizedHeader.includes('cep') || normalizedHeader.includes('zip') || normalizedHeader.includes('postal')) {
        targetField = 'address1_zip'
        confidence = 0.8
      } else if (normalizedHeader.includes('país') || normalizedHeader.includes('country')) {
        targetField = 'address1_country'
        confidence = 0.8
      } else if (normalizedHeader.includes('empresa') || normalizedHeader === 'company') {
        targetField = 'company'
        confidence = 0.85
      } else if (normalizedHeader.includes('fonte') || normalizedHeader === 'source') {
        targetField = 'source'
        confidence = 0.85
      } else if (normalizedHeader.includes('idioma') || normalizedHeader === 'language') {
        targetField = 'language'
        confidence = 0.85
      }
    }
    
    if (targetField && confidence > 0.6) {
      mappings.push({
        sourceField: header,
        targetField,
        confidence,
        dataType,
        sampleValue: values[0] || '',
        suggestions: []
      })
    }
  })
  
  return mappings
}

function evaluateDataQuality(data: any[], headers: string[]): ImportAnalysis['dataQuality'] {
  const issues: string[] = []
  let totalFields = 0
  let validFields = 0
  
  headers.forEach(header => {
    const values = data.map(row => row[header])
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
    
    // Completude
    const completeness = (nonNullValues.length / values.length) * 100
    if (completeness < 70) {
      issues.push(`Campo "${header}" tem ${(100 - completeness).toFixed(1)}% de valores vazios`)
    }
    
    // Consistência
    const uniqueCount = new Set(nonNullValues).size
    if (uniqueCount === 1 && nonNullValues.length > 1) {
      issues.push(`Campo "${header}" tem o mesmo valor em todos os registros`)
    }
    
    // Validade (básica) — evitar divisão por zero
    const validCount = validateFieldValues(header, nonNullValues)
    const validity = nonNullValues.length > 0 ? (validCount / nonNullValues.length) * 100 : 100
    if (validity < 80) {
      issues.push(`Campo "${header}" tem ${(100 - validity).toFixed(1)}% de valores inválidos`)
    }
    
    totalFields += values.length
    validFields += validCount
  })
  
  const overallCompleteness = data.reduce((acc, row) => {
    const nonNullCount = Object.values(row).filter(v => v !== null && v !== undefined && v !== '').length
    return acc + (nonNullCount / Object.keys(row).length)
  }, 0) / data.length * 100
  
  const overallValidity = (validFields / totalFields) * 100
  
  // Clampar consistency entre 0 e 100 — nunca negativo
  const consistencyScore = Math.max(0, Math.min(100, 100 - issues.length * 10))

  return {
    completeness: isNaN(overallCompleteness) ? 100 : overallCompleteness,
    consistency: consistencyScore,
    validity: isNaN(overallValidity) ? 100 : overallValidity,
    issues,
  }
}

function validateFieldValues(header: string, values: string[]): number {
  if (values.length === 0) return 0
  
  const normalizedHeader = header.toLowerCase()
  
  if (normalizedHeader.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return values.filter(v => emailRegex.test(v)).length
  }
  
  if (normalizedHeader.includes('telefone') || normalizedHeader.includes('phone')) {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/
    return values.filter(v => phoneRegex.test(v)).length
  }
  
  if (normalizedHeader.includes('cpf')) {
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/
    return values.filter(v => cpfRegex.test(v)).length
  }
  
  if (normalizedHeader.includes('cnpj')) {
    const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
    return values.filter(v => cnpjRegex.test(v)).length
  }
  
  // Para outros campos, considerar válidos se não estiverem vazios
  return values.length
}

function detectEntityType(headers: string[], sampleRows: any[]): ImportAnalysis['detectedEntityType'] {
  const normalizedHeaders = headers.map(h => h.toLowerCase())
  const headerString = normalizedHeaders.join(' ')
  
  // Heurísticas para detectar tipo de entidade
  if (headerString.includes('aluno') || headerString.includes('student') || 
      headerString.includes('matricula') || headerString.includes('turma')) {
    return 'students'
  }
  
  if (headerString.includes('cliente') || headerString.includes('customer') ||
      headerString.includes('paciente') || headerString.includes('fornecedor') ||
      (headerString.includes('email 1') && headerString.includes('telefone 1')) ||
      (headerString.includes('endereço 1') && headerString.includes('sobrenome'))) {
    return 'customers'
  }
  
  if (headerString.includes('pagamento') || headerString.includes('payment') ||
      headerString.includes('valor') || headerString.includes('amount') ||
      headerString.includes('vencimento')) {
    return 'payments'
  }
  
  if (headerString.includes('produto') || headerString.includes('product') ||
      headerString.includes('estoque') || headerString.includes('price')) {
    return 'products'
  }
  
  if (headerString.includes('serviço') || headerString.includes('service') ||
      headerString.includes('ordem') || headerString.includes('os')) {
    return 'services'
  }
  
  return 'unknown'
}

function calculateConfidence(mappings: FieldMapping[], quality: ImportAnalysis['dataQuality']): number {
  if (mappings.length === 0) return 0
  
  const avgMappingConfidence = mappings.reduce((acc, m) => acc + m.confidence, 0) / mappings.length
  const qualityScore = (quality.completeness + quality.consistency + quality.validity) / 3
  
  return (avgMappingConfidence * 0.6 + qualityScore / 100 * 0.4)
}

function generateRecommendations(fieldAnalysis: any[], quality: ImportAnalysis['dataQuality'], entityType: string): string[] {
  const recommendations: string[] = []
  
  if (quality.completeness < 80) {
    recommendations.push('Considere preencher campos vazios antes da importação')
  }
  
  if (quality.validity < 80) {
    recommendations.push('Verifique e corrija dados inválidos (emails, telefones, documentos)')
  }
  
  if (entityType === 'unknown') {
    recommendations.push('Não foi possível identificar o tipo de dados. Verifique se os nomes das colunas são descritivos.')
  }
  
  if (quality.issues.length > 5) {
    recommendations.push('Muitos problemas detectados. Considere limpar os dados antes de importar.')
  }
  
  recommendations.push('Revise o mapeamento sugerido pela IA antes de confirmar a importação')
  
  return recommendations
}
