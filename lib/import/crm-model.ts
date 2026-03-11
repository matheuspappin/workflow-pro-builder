/**
 * Molde profissional do CRM — base oficial para importação e exibição
 * Labels em português <-> campos internos do banco
 */

export const CRM_PROFESSIONAL_HEADERS = [
  "Nome",
  "Sobrenome",
  "Email 1",
  "Email 2",
  "Telefone 1",
  "Telefone 2",
  "Telefone 3",
  "Endereço 1 - Tipo",
  "Endereço 1 - Rua",
  "Endereço 1 - Cidade",
  "Endereço 1 - Estado/Região",
  "Endereço 1 - Código postal (CEP)",
  "Endereço 1 - País",
  "Endereço 2 - Tipo",
  "Endereço 2 - Cidade",
  "Endereço 2 - Estado/Região",
  "Endereço 2 - Código postal (CEP)",
  "Endereço 2 - País",
  "Endereço 3 - Tipo",
  "Endereço 3 - Cidade",
  "Endereço 3 - Estado/Região",
  "Endereço 3 - Código postal (CEP)",
  "Endereço 3 - País",
  "Empresa",
  "Etiquetas",
  "Criado às (UTC+0)",
  "Status do assinante de email",
  "Status do assinante de SMS",
  "Última atividade",
  "Data da última atividade (UTC+0)",
  "Fonte",
  "Idioma",
] as const

/** Mapeamento: label profissional -> campo interno */
export const CRM_LABEL_TO_FIELD: Record<string, string> = {
  "Nome": "first_name",
  "Sobrenome": "last_name",
  "Email 1": "email",
  "Email 2": "email_2",
  "Telefone 1": "phone_1",
  "Telefone 2": "phone_2",
  "Telefone 3": "phone_3",
  "Endereço 1 - Tipo": "address1_type",
  "Endereço 1 - Rua": "address1_street",
  "Endereço 1 - Cidade": "address1_city",
  "Endereço 1 - Estado/Região": "address1_state",
  "Endereço 1 - Código postal (CEP)": "address1_zip",
  "Endereço 1 - País": "address1_country",
  "Endereço 2 - Tipo": "address2_type",
  "Endereço 2 - Cidade": "address2_city",
  "Endereço 2 - Estado/Região": "address2_state",
  "Endereço 2 - Código postal (CEP)": "address2_zip",
  "Endereço 2 - País": "address2_country",
  "Endereço 3 - Tipo": "address3_type",
  "Endereço 3 - Cidade": "address3_city",
  "Endereço 3 - Estado/Região": "address3_state",
  "Endereço 3 - Código postal (CEP)": "address3_zip",
  "Endereço 3 - País": "address3_country",
  "Empresa": "company",
  "Etiquetas": "tags",
  "Criado às (UTC+0)": "created_at",
  "Status do assinante de email": "email_subscriber_status",
  "Status do assinante de SMS": "sms_subscriber_status",
  "Última atividade": "last_activity_description",
  "Data da última atividade (UTC+0)": "last_activity_at",
  "Fonte": "source",
  "Idioma": "language",
}

/** Mapeamento inverso: campo interno -> label profissional */
export const CRM_FIELD_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CRM_LABEL_TO_FIELD).map(([k, v]) => [v, k])
)

/** Converte registro interno para formato profissional (para exibição/preview) */
export function toProfessionalRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [label, field] of Object.entries(CRM_LABEL_TO_FIELD)) {
    let val = record[field]
    if (field === "tags" && Array.isArray(val)) val = val.join(", ")
    if (field === "email" && !val && record.email_1) val = record.email_1
    if (field === "phone_1" && !val && record.phone) val = record.phone
    if (field && field.startsWith("address2_") && val == null && record.address2 && typeof record.address2 === "object") {
      const key = field.replace("address2_", "")
      val = (record.address2 as Record<string, unknown>)[key]
    }
    if (field && field.startsWith("address3_") && val == null && record.address3 && typeof record.address3 === "object") {
      const key = field.replace("address3_", "")
      val = (record.address3 as Record<string, unknown>)[key]
    }
    if (field && field.startsWith("address1_") && val == null && record.address1 && typeof record.address1 === "object") {
      const key = field.replace("address1_", "")
      val = (record.address1 as Record<string, unknown>)[key]
    }
    out[label] = val ?? ""
  }
  return out
}

/** Converte registro profissional (do arquivo) para interno usando mapeamento */
export function fromProfessionalRecord(
  record: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [targetField, sourceLabel] of Object.entries(mapping)) {
    const val = record[sourceLabel]
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      if (targetField === "tags" && typeof val === "string") {
        out[targetField] = val.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      } else {
        out[targetField] = val
      }
    }
  }
  return out
}

/** Retorna headers profissionais na ordem do molde */
export function getProfessionalHeaders(): string[] {
  return [...CRM_PROFESSIONAL_HEADERS]
}
