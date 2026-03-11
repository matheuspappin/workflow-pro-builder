import * as XLSX from 'xlsx'
import { XMLParser } from 'fast-xml-parser'

// RFC 4180-compliant CSV parser — suporta campos entre aspas, escape de aspas duplas
function parseCSV(text: string, options: { header?: boolean; delimiter?: string } = {}) {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedText.split('\n')
  
  // Detectar delimitador a partir da primeira linha
  const firstLine = lines.find(l => l.trim()) || ''
  const delimiter = options.delimiter || detectDelimiter(firstLine)

  // Parser de linha que respeita campos entre aspas (RFC 4180)
  function parseLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    while (i < line.length) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            // Aspas duplas dentro de campo: "" → "
            current += '"'
            i += 2
          } else {
            inQuotes = false
            i++
          }
        } else {
          current += ch
          i++
        }
      } else {
        if (ch === '"') {
          inQuotes = true
          i++
        } else if (ch === delimiter) {
          fields.push(current.trim())
          current = ''
          i++
        } else {
          current += ch
          i++
        }
      }
    }
    fields.push(current.trim())
    return fields
  }

  const nonEmptyLines = lines.filter(l => l.trim())
  if (nonEmptyLines.length === 0) return { data: [], meta: { fields: [] as string[] }, errors: [] }

  if (options.header !== false) {
    const headers = parseLine(nonEmptyLines[0]).map(h => h.trim())
    const data = nonEmptyLines.slice(1).map(line => {
      const values = parseLine(line)
      const obj: Record<string, string> = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index] : ''
      })
      return obj
    })
    return { data, meta: { fields: headers }, errors: [] }
  }

  const data = nonEmptyLines.map(line => parseLine(line))
  return { data, meta: { fields: [] as string[] }, errors: [] }
}

function detectDelimiter(line: string): string {
  // Conta ocorrências fora de aspas para determinar delimitador predominante
  const candidates = [';', ',', '\t', '|']
  let best = ','
  let bestCount = 0
  for (const delim of candidates) {
    let count = 0
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes
      else if (!inQuotes && ch === delim) count++
    }
    if (count > bestCount) {
      bestCount = count
      best = delim
    }
  }
  return best
}

// Detectar encoding a partir do BOM do buffer
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength))
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8'
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'
  // Windows-1252 é comum em exports de ERP/Excel brasileiros
  // Tentamos detectar bytes acima de 0x7F sem BOM como Windows-1252
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > 0x7F) return 'windows-1252'
  }
  return 'utf-8'
}

function decodeBuffer(buffer: ArrayBuffer): string {
  const encoding = detectEncoding(buffer)
  try {
    return new TextDecoder(encoding).decode(buffer)
  } catch {
    // fallback
    return new TextDecoder('utf-8').decode(buffer)
  }
}

export type FileType = 'excel' | 'csv' | 'json' | 'xml' | 'txt' | 'unknown'

export interface ParsedData {
  headers: string[]
  rows: any[]
  metadata: {
    fileName: string
    fileType: FileType
    rowCount: number
    columnCount: number
    detectedEncoding?: string
  }
}

export function detectFileType(buffer: ArrayBuffer, fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase()
  // Usar view sem cópia de memória
  const bytes = new Uint8Array(buffer, 0, Math.min(10, buffer.byteLength))

  // Assinatura PK (ZIP) — pode ser XLSX, DOCX, PPTX, etc.
  // Priorizar a extensão do arquivo para distinguir
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    if (extension === 'xlsx' || extension === 'xls' || extension === 'xlsm') return 'excel'
    if (extension === 'csv') return 'csv'
    // Para outros formatos ZIP sem extensão reconhecida, tenta como Excel
    return 'excel'
  }

  // Assinatura OLE2 (Excel antigo .xls)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF) return 'excel'

  // Detectar por extensão
  switch (extension) {
    case 'xlsx':
    case 'xls':
    case 'xlsm':
      return 'excel'
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'xml':
      return 'xml'
    case 'txt':
    case 'log':
      return 'txt'
    default:
      return 'unknown'
  }
}

export async function parseFile(
  buffer: ArrayBuffer,
  fileType: FileType,
  fileName = ''
): Promise<ParsedData> {
  switch (fileType) {
    case 'excel':
      return parseExcel(buffer, fileName)
    case 'csv':
      return parseCSVFile(buffer, fileName)
    case 'json':
      return parseJSON(buffer, fileName)
    case 'xml':
      return parseXML(buffer, fileName)
    case 'txt':
      return parseTXT(buffer, fileName)
    default:
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`)
  }
}

function parseExcel(buffer: ArrayBuffer, fileName: string): ParsedData {
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

    // Avisar se há múltiplas planilhas — processa apenas a primeira
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Nenhuma planilha encontrada')
    const worksheet = workbook.Sheets[sheetName]

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    if (jsonData.length === 0) throw new Error('Planilha vazia')

    // Garantir que os headers sejam strings
    const rawHeaders = (jsonData[0] as any[])
    const headers = rawHeaders.map((h, i) =>
      h !== null && h !== undefined && String(h).trim() !== ''
        ? String(h).trim()
        : `Coluna_${i + 1}`
    )

    const rows = (jsonData.slice(1) as any[][]).map(row => {
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        const val = row[index]
        obj[header] = val !== undefined && val !== null ? val : ''
      })
      return obj
    })

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileType: 'excel',
        rowCount: rows.length,
        columnCount: headers.length,
      },
    }
  } catch (error) {
    throw new Error(`Erro ao parsear Excel: ${error instanceof Error ? error.message : error}`)
  }
}

function parseCSVFile(buffer: ArrayBuffer, fileName: string): ParsedData {
  try {
    const text = decodeBuffer(buffer)
    const encoding = detectEncoding(buffer)

    const result = parseCSV(text, { header: true })

    const headers = result.meta.fields as string[]
    const rows = result.data as any[]

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileType: 'csv',
        rowCount: rows.length,
        columnCount: headers.length,
        detectedEncoding: encoding,
      },
    }
  } catch (error) {
    throw new Error(`Erro ao parsear CSV: ${error instanceof Error ? error.message : error}`)
  }
}

function parseJSON(buffer: ArrayBuffer, fileName: string): ParsedData {
  try {
    const text = new TextDecoder('utf-8').decode(buffer)
    const data = JSON.parse(text)

    let headers: string[] = []
    let rows: any[] = []

    if (Array.isArray(data)) {
      if (data.length === 0) throw new Error('JSON array vazio')

      if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
        // Array de objetos — caso comum
        headers = Object.keys(data[0])
        rows = data
      } else if (Array.isArray(data[0])) {
        // Array de arrays — primeira linha = headers, restante = dados
        const headerRow = data[0] as any[]
        headers = headerRow.map((h, i) =>
          h !== null && h !== undefined && String(h).trim() !== ''
            ? String(h).trim()
            : `Coluna_${i + 1}`
        )
        // CORRIGIDO: usar data.slice(1), não data[0]
        rows = data.slice(1).map((row: any[]) => {
          const obj: Record<string, any> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? row[index] : ''
          })
          return obj
        })
      } else {
        throw new Error('Formato JSON não suportado: array de primitivos')
      }
    } else if (typeof data === 'object' && data !== null) {
      headers = Object.keys(data)
      rows = [data]
    } else {
      throw new Error('Formato JSON não suportado')
    }

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileType: 'json',
        rowCount: rows.length,
        columnCount: headers.length,
        detectedEncoding: 'utf-8',
      },
    }
  } catch (error) {
    throw new Error(`Erro ao parsear JSON: ${error instanceof Error ? error.message : error}`)
  }
}

function parseXML(buffer: ArrayBuffer, fileName: string): ParsedData {
  try {
    const text = decodeBuffer(buffer)
    const encoding = detectEncoding(buffer)

    // fast-xml-parser funciona em Node.js (ao contrário de DOMParser)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      trimValues: true,
    })

    const result = parser.parse(text)

    // Encontrar o array de elementos repetidos mais profundo
    function findRepeatingArray(obj: any, depth = 0): any[] | null {
      if (depth > 5) return null
      if (!obj || typeof obj !== 'object') return null
      for (const key of Object.keys(obj)) {
        const val = obj[key]
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
          return val
        }
        const nested = findRepeatingArray(val, depth + 1)
        if (nested) return nested
      }
      return null
    }

    const rowArray = findRepeatingArray(result)
    if (!rowArray) {
      throw new Error('Não foi possível identificar estrutura de linhas no XML')
    }

    // Normalizar cada elemento: extrair apenas propriedades simples (sem arrays/objetos aninhados)
    const rows = rowArray.map((el: any) => {
      const row: Record<string, string> = {}
      Object.keys(el).forEach(key => {
        if (key.startsWith('@_')) return // pular atributos
        const val = el[key]
        if (typeof val !== 'object') {
          row[key] = val !== null && val !== undefined ? String(val).trim() : ''
        } else if (val && typeof val === 'object' && '#text' in val) {
          row[key] = String(val['#text']).trim()
        }
      })
      return row
    })

    const headers = rows.length > 0 ? Object.keys(rows[0]) : []

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileType: 'xml',
        rowCount: rows.length,
        columnCount: headers.length,
        detectedEncoding: encoding,
      },
    }
  } catch (error) {
    throw new Error(`Erro ao parsear XML: ${error instanceof Error ? error.message : error}`)
  }
}

function parseTXT(buffer: ArrayBuffer, fileName: string): ParsedData {
  try {
    const text = decodeBuffer(buffer)
    const encoding = detectEncoding(buffer)

    const result = parseCSV(text, { header: false })

    if (result.data.length === 0) throw new Error('Nenhuma linha encontrada no arquivo texto')

    const firstRow = result.data[0] as string[]
    const headers = firstRow.map((h, i) =>
      h.trim() !== '' ? h.trim() : `Coluna_${i + 1}`
    )

    const rows = (result.data.slice(1) as string[][]).map(row => {
      const obj: Record<string, string> = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? String(row[index]).trim() : ''
      })
      return obj
    })

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileType: 'txt',
        rowCount: rows.length,
        columnCount: headers.length,
        detectedEncoding: encoding,
      },
    }
  } catch (error) {
    throw new Error(`Erro ao parsear TXT: ${error instanceof Error ? error.message : error}`)
  }
}
