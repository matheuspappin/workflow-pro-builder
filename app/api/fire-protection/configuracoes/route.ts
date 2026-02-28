import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

/** Serviços permitidos - allowlist para evitar injeção */
const ALLOWED_SERVICES = ['whatsapp', 'gemini', 'smtp', 'google_maps', 'nfe'] as const
const MAX_KEY_LENGTH = 2048
const MAX_STRING_LENGTH = 500

function sanitize(str: unknown, maxLen = MAX_STRING_LENGTH): string {
  if (str == null || typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen)
}

function validateIntegrationPayload(service: string, payload: unknown): { valid: boolean; error?: string } {
  if (!ALLOWED_SERVICES.includes(service as (typeof ALLOWED_SERVICES)[number])) {
    return { valid: false, error: 'Serviço não permitido' }
  }
  if (payload == null || typeof payload !== 'object') {
    return { valid: false, error: 'Payload inválido' }
  }
  const p = payload as Record<string, unknown>
  if (service === 'whatsapp') {
    const key = sanitize(p.apiKey, MAX_KEY_LENGTH)
    if (!key) return { valid: false, error: 'API Key é obrigatória' }
    return { valid: true }
  }
  if (service === 'gemini') {
    const key = sanitize(p.apiKey, MAX_KEY_LENGTH)
    if (!key) return { valid: false, error: 'API Key é obrigatória' }
    return { valid: true }
  }
  if (service === 'smtp') {
    const host = sanitize(p.host)
    const user = sanitize(p.user)
    const password = sanitize(p.password, MAX_KEY_LENGTH)
    if (!host || !user || !password) return { valid: false, error: 'Host, usuário e senha são obrigatórios' }
    return { valid: true }
  }
  if (service === 'google_maps') {
    const key = sanitize(p.apiKey, MAX_KEY_LENGTH)
    if (!key) return { valid: false, error: 'API Key é obrigatória' }
    return { valid: true }
  }
  if (service === 'nfe') {
    const key = sanitize(p.apiKey, MAX_KEY_LENGTH)
    if (!key) return { valid: false, error: 'API Key é obrigatória' }
    return { valid: true }
  }
  return { valid: false, error: 'Serviço não reconhecido' }
}

/** Chaves usadas em studio_settings para fire-protection */
const FP_KEYS = {
  // Empresa
  company_name: 'fp_company_name',
  company_cnpj: 'fp_company_cnpj',
  company_phone: 'fp_company_phone',
  company_email: 'fp_company_email',
  company_address: 'fp_company_address',
  crea_responsavel: 'fp_crea_responsavel',
  alvara_funcionamento: 'fp_alvara_funcionamento',
  logo_url: 'fp_logo_url',
  // Personalização
  system_name: 'fp_system_name',
  primary_color: 'fp_primary_color',
  // Notificações
  notif_extintor_vencendo: 'fp_notif_extintor_vencendo',
  notif_vistoria_proxima: 'fp_notif_vistoria_proxima',
  notif_os_nova: 'fp_notif_os_nova',
  notif_os_concluida: 'fp_notif_os_concluida',
  notif_pagamento_pendente: 'fp_notif_pagamento_pendente',
  notif_relatorio_semanal: 'fp_notif_relatorio_semanal',
  notif_email_resumo: 'fp_notif_email_resumo',
  notif_sms_alertas: 'fp_notif_sms_alertas',
} as const

function getSetting(settings: { setting_key: string; setting_value: string }[], key: string): string {
  return settings.find((s) => s.setting_key === key)?.setting_value ?? ''
}

function getBoolSetting(
  settings: { setting_key: string; setting_value: string }[],
  key: string,
  defaultValue = true
): boolean {
  const v = getSetting(settings, key)
  if (v === '') return defaultValue
  return v === 'true' || v === '1'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data: settings, error } = await supabaseAdmin
      .from('studio_settings')
      .select('setting_key, setting_value')
      .eq('studio_id', studioId!)
      .in('setting_key', Object.values(FP_KEYS))

    if (error) throw error

    const flat = settings || []

    // Buscar também nome do studio como fallback para company_name
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('name')
      .eq('id', studioId!)
      .single()

    const companyName = getSetting(flat, FP_KEYS.company_name) || studio?.name || ''

    const { data: apiKeys } = await supabaseAdmin
      .from('studio_api_keys')
      .select('service_name, status')
      .eq('studio_id', studioId!)
      .in('service_name', ALLOWED_SERVICES)

    const hasActive = (name: string) =>
      !!apiKeys?.find((k) => k.service_name === name && k.status === 'active')

    const integracoesStatus: Record<string, boolean> = {
      whatsapp: hasActive('whatsapp'),
      gemini: hasActive('gemini'),
      smtp: hasActive('smtp'),
      google_maps: hasActive('google_maps'),
      nfe: hasActive('nfe'),
    }

    return NextResponse.json({
      // Empresa
      company_name: companyName,
      company_cnpj: getSetting(flat, FP_KEYS.company_cnpj),
      company_phone: getSetting(flat, FP_KEYS.company_phone),
      company_email: getSetting(flat, FP_KEYS.company_email),
      company_address: getSetting(flat, FP_KEYS.company_address),
      crea_responsavel: getSetting(flat, FP_KEYS.crea_responsavel),
      alvara_funcionamento: getSetting(flat, FP_KEYS.alvara_funcionamento),
      logo_url: getSetting(flat, FP_KEYS.logo_url),
      // Personalização
      system_name: getSetting(flat, FP_KEYS.system_name) || 'FireControl',
      primary_color: getSetting(flat, FP_KEYS.primary_color) || '#dc2626',
      // Notificações
      notificacoes: {
        extintor_vencendo: getBoolSetting(flat, FP_KEYS.notif_extintor_vencendo, true),
        vistoria_proxima: getBoolSetting(flat, FP_KEYS.notif_vistoria_proxima, true),
        os_nova: getBoolSetting(flat, FP_KEYS.notif_os_nova, true),
        os_concluida: getBoolSetting(flat, FP_KEYS.notif_os_concluida, true),
        pagamento_pendente: getBoolSetting(flat, FP_KEYS.notif_pagamento_pendente, true),
        relatorio_semanal: getBoolSetting(flat, FP_KEYS.notif_relatorio_semanal, false),
        email_resumo: getBoolSetting(flat, FP_KEYS.notif_email_resumo, true),
        sms_alertas: getBoolSetting(flat, FP_KEYS.notif_sms_alertas, false),
      },
      integracoes_status: integracoesStatus,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function upsertSetting(
  studioId: string,
  key: string,
  value: string,
  type: 'string' | 'boolean' = 'string'
) {
  await supabaseAdmin.from('studio_settings').upsert(
    {
      studio_id: studioId,
      setting_key: key,
      setting_value: value,
      setting_type: type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'studio_id,setting_key' }
  )
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, empresa, personalizacao, notificacoes, integracoes } = body

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    if (integracoes && typeof integracoes === 'object') {
      const upsertIntegration = async (
        service: (typeof ALLOWED_SERVICES)[number],
        payload: unknown
      ) => {
        const { valid, error } = validateIntegrationPayload(service, payload)
        if (!valid) throw new Error(error)

        const p = (payload || {}) as Record<string, unknown>
        const base: Record<string, unknown> = {
          studio_id: studioId,
          service_name: service,
          status: 'active',
          updated_at: new Date().toISOString(),
        }

        if (service === 'whatsapp') {
          Object.assign(base, {
            api_key: sanitize(p.apiKey, MAX_KEY_LENGTH),
            instance_id: sanitize(p.instanceId) || null,
            settings: (p.settings && typeof p.settings === 'object' ? p.settings : {}) as object,
          })
        } else if (service === 'gemini' || service === 'google_maps' || service === 'nfe') {
          Object.assign(base, { api_key: sanitize(p.apiKey, MAX_KEY_LENGTH) })
        } else if (service === 'smtp') {
          const host = sanitize(p.host)
          const port = parseInt(String(p.port || 587), 10)
          const user = sanitize(p.user)
          const password = sanitize(p.password, MAX_KEY_LENGTH)
          const fromEmail = sanitize(p.fromEmail)
          Object.assign(base, {
            api_key: password,
            settings: {
              host,
              port: Number.isFinite(port) ? port : 587,
              user,
              from_email: fromEmail || user,
              secure: p.secure === true || p.secure === 'true',
            },
          })
        }

        await supabaseAdmin
          .from('studio_api_keys')
          .upsert(base, { onConflict: 'studio_id,service_name' })
      }

      if (integracoes.whatsapp?.apiKey) await upsertIntegration('whatsapp', integracoes.whatsapp)
      if (integracoes.gemini?.apiKey) await upsertIntegration('gemini', integracoes.gemini)
      if (integracoes.smtp?.host && integracoes.smtp?.user && integracoes.smtp?.password) {
        await upsertIntegration('smtp', integracoes.smtp)
      }
      if (integracoes.google_maps?.apiKey) await upsertIntegration('google_maps', integracoes.google_maps)
      if (integracoes.nfe?.apiKey) await upsertIntegration('nfe', integracoes.nfe)
    }

    if (empresa) {
      if (empresa.company_name) {
        await supabaseAdmin
          .from('studios')
          .update({ name: empresa.company_name, updated_at: new Date().toISOString() })
          .eq('id', studioId)
      }
      await upsertSetting(studioId, FP_KEYS.company_name, empresa.company_name || '')
      await upsertSetting(studioId, FP_KEYS.company_cnpj, empresa.company_cnpj || '')
      await upsertSetting(studioId, FP_KEYS.company_phone, empresa.company_phone || '')
      await upsertSetting(studioId, FP_KEYS.company_email, empresa.company_email || '')
      await upsertSetting(studioId, FP_KEYS.company_address, empresa.company_address || '')
      await upsertSetting(studioId, FP_KEYS.crea_responsavel, empresa.crea_responsavel || '')
      await upsertSetting(studioId, FP_KEYS.alvara_funcionamento, empresa.alvara_funcionamento || '')
      if (empresa.logo_url !== undefined) await upsertSetting(studioId, FP_KEYS.logo_url, empresa.logo_url || '')
    }

    if (personalizacao) {
      await upsertSetting(studioId, FP_KEYS.system_name, personalizacao.system_name || 'FireControl')
      await upsertSetting(studioId, FP_KEYS.primary_color, personalizacao.primary_color || '#dc2626')
    }

    if (notificacoes && typeof notificacoes === 'object') {
      const map: Record<string, string> = {
        extintor_vencendo: FP_KEYS.notif_extintor_vencendo,
        vistoria_proxima: FP_KEYS.notif_vistoria_proxima,
        os_nova: FP_KEYS.notif_os_nova,
        os_concluida: FP_KEYS.notif_os_concluida,
        pagamento_pendente: FP_KEYS.notif_pagamento_pendente,
        relatorio_semanal: FP_KEYS.notif_relatorio_semanal,
        email_resumo: FP_KEYS.notif_email_resumo,
        sms_alertas: FP_KEYS.notif_sms_alertas,
      }
      for (const [k, v] of Object.entries(notificacoes)) {
        const key = map[k]
        if (key) await upsertSetting(studioId, key, v ? 'true' : 'false', 'boolean')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
