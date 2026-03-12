/**
 * FiscalProvider — Comunicação com o microserviço PHP de emissão NF-e.
 * O worker é stateless e recebe certificado + dados da nota via payload.
 */

import { getDecryptedForStudio } from './certificate-service'
import type {
  FiscalWorkerEmitRequest,
  FiscalWorkerEmitResponse,
  FiscalEmitResult,
} from './types'

export interface NFeEmitData {
  studio_id: string
  order_id: string
  customer: {
    name: string
    cpf_cnpj?: string
    email?: string
    phone?: string
    address?: {
      street?: string
      number?: string
      city?: string
      state?: string
      zip_code?: string
    }
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    ncm?: string
    cfop?: string
    unit?: string
  }>
  total_amount: number
  observations?: string
}

export interface StudioData {
  name: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
}

const FISCAL_WORKER_URL = process.env.FISCAL_WORKER_URL
const FISCAL_SERVICE_KEY = process.env.FISCAL_SERVICE_KEY
const FISCAL_AMBIENTE = process.env.FISCAL_AMBIENTE || '2' // 1=produção, 2=homologação

function mapToWorkerFormat(
  data: NFeEmitData,
  studio: StudioData,
  ambienteOverride?: '1' | '2'
): FiscalWorkerEmitRequest['nfe'] {
  const cep = (studio.zip_code || '01001000').replace(/\D/g, '')
  const cnpj = (studio.cnpj || '00000000000000').replace(/\D/g, '')
  const cpfCnpjDest = (data.customer.cpf_cnpj || '').replace(/\D/g, '')

  const ambiente = ambienteOverride ?? (FISCAL_AMBIENTE === '1' ? '1' : '2')
  return {
    ambiente: ambiente as '1' | '2',
    emitente: {
      cnpj,
      razao_social: studio.name,
      nome_fantasia: studio.name,
      endereco: {
        logradouro: studio.address || 'Endereço não informado',
        numero: '1',
        municipio: studio.city || 'São Paulo',
        uf: studio.state || 'SP',
        cep: cep.padStart(8, '0'),
      },
    },
    destinatario: {
      cpf_cnpj: cpfCnpjDest,
      nome: data.customer.name,
      email: data.customer.email,
      endereco: data.customer.address
        ? {
            logradouro: data.customer.address.street,
            numero: data.customer.address.number,
            municipio: data.customer.address.city,
            uf: data.customer.address.state,
            cep: data.customer.address.zip_code?.replace(/\D/g, ''),
          }
        : undefined,
    },
    itens: data.items.map((item, idx) => ({
      numero: idx + 1,
      codigo: `PROD-${idx + 1}`,
      descricao: item.description,
      ncm: item.ncm || '99999999',
      cfop: item.cfop || '5102',
      unidade: item.unit || 'UN',
      quantidade: item.quantity,
      valor_unitario: item.unit_price,
      valor_total: item.quantity * item.unit_price,
    })),
    total: {
      valor_produtos: data.total_amount,
      valor_total: data.total_amount,
    },
    natureza_operacao: 'Prestação de Serviços',
    finalidade: '1',
    informacoes_adicionais:
      data.observations || `Pedido #${data.order_id.slice(0, 8)}`,
  }
}

export async function emit(
  data: NFeEmitData,
  studio: StudioData
): Promise<FiscalEmitResult> {
  if (!FISCAL_WORKER_URL) {
    throw new Error(
      'Emissor fiscal não configurado. Configure FISCAL_WORKER_URL no .env'
    )
  }

  const cert = await getDecryptedForStudio(data.studio_id)
  if (!cert) {
    throw new Error(
      'Certificado não cadastrado. Configure o certificado A1 nas configurações do estúdio.'
    )
  }

  const ambiente = cert.environment === 'production' ? '1' : '2'
  const payload: FiscalWorkerEmitRequest = {
    certificate_base64: cert.pfxBase64,
    certificate_password: cert.password,
    nfe: mapToWorkerFormat(data, studio, ambiente as '1' | '2'),
  }

  const ref = `nfe-${data.order_id.slice(0, 8)}-${Date.now()}`

  const fiscalHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
  if (FISCAL_SERVICE_KEY) {
    fiscalHeaders['X-Fiscal-Service-Key'] = FISCAL_SERVICE_KEY
  }

  const response = await fetch(`${FISCAL_WORKER_URL}/emitir`, {
    method: 'POST',
    headers: fiscalHeaders,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  })

  const result: FiscalWorkerEmitResponse = await response.json()

  if (!result.success) {
    throw new Error(
      result.error || result.codigo_sefaz || 'Erro ao emitir NF-e na SEFAZ'
    )
  }

  return {
    provider: 'fiscal',
    ref,
    status: 'authorized',
    invoice_number: result.numero || result.chave?.slice(25, 34) || ref,
    access_key: result.chave || '',
    protocol: result.protocolo,
    pdf_url: null,
    xml_url: result.xml_autorizado ? `data:application/xml;base64,${Buffer.from(result.xml_autorizado).toString('base64')}` : null,
    simulated: false,
  }
}
