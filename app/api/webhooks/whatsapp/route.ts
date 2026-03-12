import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import logger from '@/lib/logger'
import { getAiEndpointForStudio } from '@/lib/ai-router'
import { resolveContactFromWhatsApp } from '@/lib/contact-resolver'

// Deduplicação em Redis (produção) ou memória (dev)
const processedMessages = new Set<string>()

async function markMessageProcessed(messageId: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    try {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url, token })
      // SET NX EX 120 — retorna 'OK' se inserido, null se já existia
      const result = await redis.set(`wa:dedup:${messageId}`, '1', { nx: true, ex: 120 })
      return result === 'OK'
    } catch (err) {
      logger.warn('[WhatsApp dedup] Redis falhou, usando fallback em memória:', err)
    }
  }
  // Fallback em memória (instância única / dev)
  if (processedMessages.has(messageId)) return false
  processedMessages.add(messageId)
  setTimeout(() => processedMessages.delete(messageId), 120_000)
  return true
}

function validateWebhookSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.WEBHOOK_WHATSAPP_SECRET || process.env.EVOLUTION_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('⚠️ WEBHOOK_WHATSAPP_SECRET ou EVOLUTION_WEBHOOK_SECRET não configurado - webhook sem validação')
    return process.env.NODE_ENV !== 'production'
  }

  // Evolution API: HMAC-SHA256 com timestamp.payload (headers x-evolution-signature, x-evolution-time)
  const evoxSignature = request.headers.get('x-evolution-signature') || request.headers.get('x-evox-signature')
  const evoxTime = request.headers.get('x-evolution-time') || request.headers.get('x-evox-time')
  if (evoxSignature && evoxTime) {
    try {
      const payload = evoxTime + '.' + rawBody
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
      const a = Buffer.from(expected, 'hex')
      const b = Buffer.from(evoxSignature, 'hex')
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        const timestamp = parseInt(evoxTime, 10)
        const now = Math.floor(Date.now() / 1000)
        if (Math.abs(now - timestamp) <= 300) return true // 5 min tolerância anti-replay
        logger.warn('Webhook: timestamp expirado')
        return false
      }
      return false
    } catch {
      return false
    }
  }

  // Fallback: Bearer token ou X-Webhook-Token
  const auth = request.headers.get('authorization')
  const token = request.headers.get('x-webhook-token')
  const provided = auth?.startsWith('Bearer ') ? auth.slice(7) : token
  if (!provided) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(secret, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * WEBHOOK PRINCIPAL DO WHATSAPP (Versão Anti-Duplicidade Extrema)
 * Requer WEBHOOK_WHATSAPP_SECRET ou EVOLUTION_WEBHOOK_SECRET em produção.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    if (!validateWebhookSignature(request, rawBody)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // 1. IDENTIFICAÇÃO ÚNICA DA MENSAGEM (O segredo para não duplicar)
    // Pegamos o ID da mensagem que o WhatsApp gera. Ele é único no mundo.
    const messageId = body.key?.id || body.data?.key?.id || body.data?.id;
    
    if (!messageId) {
      return NextResponse.json({ success: true })
    }

    // Deduplicação: Redis (multi-instância) com fallback em DB
    const isNew = await markMessageProcessed(messageId)
    if (!isNew) {
      logger.info(`⏭️ Ignorando mensagem duplicada (Redis/cache): ${messageId}`)
      return NextResponse.json({ success: true })
    }

    // Verificação adicional no DB (garante consistência mesmo se Redis reiniciar)
    const { data: existingMsg } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle()

    if (existingMsg) {
      logger.info(`⏭️ Ignorando mensagem duplicada (DB): ${messageId}`)
      return NextResponse.json({ success: true })
    }

    // 2. FILTRO DE EVENTOS (Apenas novas mensagens)
    // Ignoramos avisos de leitura, entrega, etc.
    const event = body.event || 'messages.upsert';
    if (event !== 'messages.upsert' && event !== 'messages.set') {
      return NextResponse.json({ success: true })
    }

    // 3. EXTRAÇÃO DE CONTEÚDO
    let remoteJid = body.key?.remoteJid || body.data?.key?.remoteJid
    let fromMe = body.key?.fromMe || body.data?.key?.fromMe || false
    let messageContent = body.message?.conversation || 
                         body.message?.extendedTextMessage?.text || 
                         body.data?.message?.conversation || 
                         body.data?.message?.extendedTextMessage?.text ||
                         body.text;

    if (!remoteJid || !messageContent || fromMe || remoteJid.includes('@g.us')) {
      return NextResponse.json({ success: true })
    }

    // 4. IDENTIFICAÇÃO DO PERFIL E ESTÚDIO
    const senderNumber = remoteJid.replace(/\D/g, '')
    const instanceName = body.instance || body.data?.instance;
    
    let studioId = '00000000-0000-0000-0000-000000000000';

    // 4.1 Tentar identificar estúdio pela instância (Mais confiável no multi-tenant)
    if (instanceName) {
      // Se for o formato df_slug
      if (instanceName.startsWith('df_')) {
        const slug = instanceName.replace('df_', '');
        const { data: studio } = await supabaseAdmin.from('studios').select('id').eq('slug', slug).maybeSingle();
        if (studio) studioId = studio.id;
      } else {
        // Tentar buscar na tabela de chaves de API
        const { data: keys } = await supabaseAdmin.from('studio_api_keys').select('studio_id').eq('instance_id', instanceName).maybeSingle();
        if (keys) studioId = keys.studio_id;
      }
    }

    // 4.2 Resolver identidade do contato (admin, técnico, aluno, cliente, lead)
    const contact = await resolveContactFromWhatsApp(studioId, senderNumber, body.pushName)
    studioId = contact.studio_id
    const { is_admin: isAdmin, is_student: isStudent } = contact
    const userName = contact.contact_name

    logger.info(`📩 [SECRETARIA] Nova mensagem de ${userName} (${contact.contact_type_label}): ${messageContent}`)

    // 4.3 LÓGICA DE CONFIRMAÇÃO DE AULA (SIM/NAO) - requer student_id
    const normalizedMsg = messageContent.trim().toUpperCase()
    if (isStudent && contact.student_id && (normalizedMsg === 'SIM' || normalizedMsg === 'NAO' || normalizedMsg === 'NÃO')) {
      const isConfirming = normalizedMsg === 'SIM'
      const todayStr = new Date().toISOString().split('T')[0]

      // Buscar presença pendente para hoje
      const { data: pendingAttendance } = await supabaseAdmin
        .from('attendance')
        .select('*, class:classes(name)')
        .eq('student_id', contact.student_id)
        .eq('date', todayStr)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pendingAttendance) {
        await supabaseAdmin
          .from('attendance')
          .update({ status: isConfirming ? 'confirmed' : 'declined' })
          .eq('id', pendingAttendance.id)

        const reply = isConfirming 
          ? `Ótimo, ${userName}! sua presença na aula de *${pendingAttendance.class.name}* está pré-confirmada. 💃✨\n\nAcesse seu portal para ver seu *QR Code de Aula* e apresente ao professor ao chegar para validar seu crédito!\n\nLink: ${process.env.NEXT_PUBLIC_APP_URL}/student`
          : `Entendido, ${userName}. Registramos que você não poderá vir hoje para a aula de *${pendingAttendance.class.name}*. Até a próxima! 👋`

        await sendWhatsAppMessage({
          to: remoteJid,
          message: reply,
          studioId: studioId
        })

        return NextResponse.json({ success: true })
      }
    }

    // 5. PERSISTÊNCIA E IA (roteamento por nicho: DanceFlow, FireControl, AgroFlowAI)
    const chat = await syncToDb(remoteJid, messageContent, studioId, userName, messageId)

    // 5.1 Buscar histórico da conversa (últimas 20 mensagens, exceto a atual) para contexto da IA
    const history = chat ? await fetchWhatsAppChatHistory(chat.id, studioId, 20, messageId) : []

    const aiEndpoint = await getAiEndpointForStudio(studioId)
    const internalKey = process.env.INTERNAL_AI_SECRET
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (internalKey && !aiEndpoint.includes('/api/gemini')) {
      headers['x-internal-ai-key'] = internalKey
    }

    const geminiRes = await fetch(aiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: messageContent,
        history,
        context: {
          studio_id: studioId,
          contact_layer: contact.contact_layer,
          contact_type_label: contact.contact_type_label,
          contact_name: contact.contact_name,
          is_admin: isAdmin,
          is_student: isStudent,
          user_name: userName,
        },
      })
    })

    const geminiData = await geminiRes.json().catch(() => ({}))
    const aiResponse = geminiData.response ?? geminiData.content ?? ''

    // 6. DETECÇÃO E CAPTURA DE LEADS (NOVA LÓGICA)
    let finalMessage = aiResponse;
    const leadRegex = /\[LEAD_DETECTED:\s*({[\s\S]*?})\]/m;
    const match = aiResponse.match(leadRegex);

    if (match && !isAdmin && !isStudent && studioId !== '00000000-0000-0000-0000-000000000000') {
      try {
        const leadData = JSON.parse(match[1]);
        logger.info('🎯 LEAD DETECTADO PELA IA:', leadData);

        // Remover o bloco JSON da mensagem que vai para o usuário
        finalMessage = aiResponse.replace(match[0], '').trim();

        // Salvar ou Atualizar Lead
        const { data: existingLead } = await supabaseAdmin
          .from('leads')
          .select('id, notes')
          .eq('studio_id', studioId)
          .eq('phone', senderNumber)
          .maybeSingle();

        if (existingLead) {
          // Atualizar
          await supabaseAdmin.from('leads').update({
            interest_level: leadData.interest_level,
            stage: leadData.stage !== 'new' ? leadData.stage : undefined, // Só muda estágio se avançou
            last_contact_date: new Date().toISOString(),
            notes: existingLead.notes ? `${existingLead.notes}\n[IA]: ${leadData.notes}` : `[IA]: ${leadData.notes}`
          }).eq('id', existingLead.id);
        } else {
          // Criar Novo
          await supabaseAdmin.from('leads').insert({
            studio_id: studioId,
            name: userName, // O nome que veio do WhatsApp
            phone: senderNumber,
            source: 'WhatsApp',
            stage: leadData.stage || 'new',
            interest_level: leadData.interest_level || 3,
            notes: `[IA]: ${leadData.notes}`,
            status: 'active'
          });
        }
      } catch (e) {
        logger.error('❌ Erro ao processar Lead AI:', e);
        // Se der erro no JSON, apenas limpamos a mensagem para não mostrar código pro usuário
        finalMessage = aiResponse.replace(/\[LEAD_DETECTED:[\s\S]*?\]/, '').trim();
      }
    } else if (match) {
      // Se for admin/aluno mas a IA alucinou e gerou lead, apenas limpamos
      finalMessage = aiResponse.replace(match[0], '').trim();
    }

    // 7. ENVIO DA RESPOSTA
    if (finalMessage) {
      await sendWhatsAppMessage({
        to: remoteJid,
        message: finalMessage,
        studioId: studioId
      })
      logger.info(`✅ Resposta enviada para ${userName}`)
      // Persistir resposta da IA no histórico para contexto em mensagens futuras
      if (chat) {
        await storeAiResponseInChat(chat.id, studioId, finalMessage, remoteJid)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('💥 Erro Webhook:', error)
    return NextResponse.json({ success: false })
  }
}

async function syncToDb(remoteJid: string, content: string, studioId: string, name: string, messageId: string): Promise<{ id: string } | null> {
  try {
    const { data: chat } = await supabaseAdmin
      .from('whatsapp_chats')
      .upsert({
        studio_id: studioId,
        remote_jid: remoteJid,
        contact_name: name,
        last_message: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'studio_id, remote_jid' })
      .select().single()

    if (chat) {
      const senderNumber = remoteJid.replace(/\D/g, '')
      await supabaseAdmin.from('whatsapp_messages').insert({
        studio_id: studioId,
        chat_id: chat.id,
        content: content,
        from_me: false,
        message_id: messageId,
        sender_number: senderNumber,
        timestamp: new Date().toISOString()
      })
      return chat
    }
  } catch (e) {
    logger.error('❌ Erro ao sincronizar mensagem no DB:', e)
  }
  return null
}

/**
 * Busca últimas N mensagens do chat para contexto da IA.
 * Formato: [{ role: 'user', content }, { role: 'assistant', content }]
 * Exclui a mensagem atual (messageId) do histórico.
 */
async function fetchWhatsAppChatHistory(
  chatId: string,
  studioId: string,
  limit: number,
  excludeMessageId?: string
): Promise<Array<{ role: string; content: string }>> {
  try {
    let query = supabaseAdmin
      .from('whatsapp_messages')
      .select('content, from_me, is_ai, message_id')
      .eq('chat_id', chatId)
      .eq('studio_id', studioId)
      .order('timestamp', { ascending: false })

    if (excludeMessageId) {
      query = query.neq('message_id', excludeMessageId)
    }

    const { data: messages } = await query.limit(limit * 2) // *2 pois alternamos user/assistant

    if (!messages?.length) return []

    const history: Array<{ role: string; content: string }> = []
    for (const m of [...messages].reverse()) {
      const role = m.from_me || m.is_ai ? 'assistant' : 'user'
      if (m.content?.trim()) {
        history.push({ role, content: m.content.trim() })
      }
    }
    return history.slice(-limit)
  } catch (e) {
    logger.warn('Erro ao buscar histórico WhatsApp:', e)
    return []
  }
}

/**
 * Persiste a resposta da IA no histórico do chat para contexto em mensagens futuras.
 */
async function storeAiResponseInChat(
  chatId: string,
  studioId: string,
  content: string,
  remoteJid: string
): Promise<void> {
  try {
    const senderNumber = remoteJid.replace(/\D/g, '')
    await supabaseAdmin.from('whatsapp_messages').insert({
      studio_id: studioId,
      chat_id: chatId,
      content,
      from_me: true,
      is_ai: true,
      message_id: `ai_${Date.now()}_${senderNumber}`,
      sender_number: senderNumber,
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    logger.warn('Erro ao salvar resposta IA no histórico:', e)
  }
}

export async function GET() {
  return NextResponse.json({ active: true })
}
