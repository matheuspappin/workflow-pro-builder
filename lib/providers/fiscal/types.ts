/**
 * Tipos do contrato entre Node.js (orquestrador) e o microserviço PHP (worker fiscal).
 * O worker é stateless e não conhece o conceito de tenant.
 */

export interface FiscalWorkerEmitRequest {
  certificate_base64: string
  certificate_password: string
  nfe: {
    ambiente: '1' | '2'
    emitente: {
      cnpj: string
      razao_social: string
      nome_fantasia?: string
      ie?: string
      crt?: string
      endereco: {
        logradouro: string
        numero: string
        bairro?: string
        municipio: string
        uf: string
        cep: string
      }
    }
    destinatario: {
      cpf_cnpj: string
      nome: string
      email?: string
      endereco?: {
        logradouro?: string
        numero?: string
        bairro?: string
        municipio?: string
        uf?: string
        cep?: string
      }
    }
    itens: Array<{
      numero: number
      codigo: string
      descricao: string
      ncm: string
      cfop: string
      unidade: string
      quantidade: number
      valor_unitario: number
      valor_total: number
    }>
    total: { valor_produtos: number; valor_desconto?: number; valor_total: number }
    natureza_operacao: string
    finalidade: string
    informacoes_adicionais?: string
  }
}

export interface FiscalWorkerEmitResponse {
  success: boolean
  chave?: string
  protocolo?: string
  xml_autorizado?: string
  numero?: string
  error?: string
  codigo_sefaz?: string
}

export interface FiscalEmitResult {
  provider: string
  ref: string
  status: string
  invoice_number: string
  access_key: string
  protocol?: string
  pdf_url?: string | null
  xml_url?: string | null
  simulated?: boolean
}
