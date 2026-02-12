import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// Cache em memória para evitar processar a mesma mensagem duas vezes seguidas
// Em produção real, isso seria um Redis, mas para dev local resolve 100%
const processedMessages = new Set<string>();

/**
 * WEBHOOK PRINCIPAL DO WHATSAPP (Versão Anti-Duplicidade Extrema)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 1. IDENTIFICAÇÃO ÚNICA DA MENSAGEM (O segredo para não duplicar)
    // Pegamos o ID da mensagem que o WhatsApp gera. Ele é único no mundo.
    const messageId = body.key?.id || body.data?.key?.id || body.data?.id;
    
    if (!messageId) {
      return NextResponse.json({ success: true })
    }

    // Se já processamos esse ID, ignoramos completamente (Check via DB em produção é melhor)
    const { data: existingMsg } = await supabase
      .from('whatsapp_messages')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle();

    if (existingMsg) {
      console.log(`⏭️ Ignorando mensagem duplicada (DB): ${messageId}`)
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

    // Marcar como processada para não repetir
    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 30000); // Limpa do cache após 30s

    // 4. IDENTIFICAÇÃO DO PERFIL E ESTÚDIO
    const senderNumber = remoteJid.replace(/\D/g, '')
    const instanceName = body.instance || body.data?.instance;
    
    let studioId = '00000000-0000-0000-0000-000000000000';

    // 4.1 Tentar identificar estúdio pela instância (Mais confiável no multi-tenant)
    if (instanceName) {
      // Se for o formato df_slug
      if (instanceName.startsWith('df_')) {
        const slug = instanceName.replace('df_', '');
        const { data: studio } = await supabase.from('studios').select('id').eq('slug', slug).maybeSingle();
        if (studio) studioId = studio.id;
      } else {
        // Tentar buscar na tabela de chaves de API
        const { data: keys } = await supabase.from('studio_api_keys').select('studio_id').eq('instance_id', instanceName).maybeSingle();
        if (keys) studioId = keys.studio_id;
      }
    }

    // 4.2 Buscar se é admin ou aluno para confirmar studioId se ainda não identificado
    const { data: adminUser } = await supabase
      .from('users_internal')
      .select('studio_id, name')
      .eq('phone', senderNumber)
      .maybeSingle()

    const { data: studentUser } = await supabase
      .from('students')
      .select('studio_id, name, id')
      .eq('phone', senderNumber)
      .maybeSingle()

    const isAdmin = !!adminUser
    const isStudent = !!studentUser
    
    // Fallback para identificação por número se a instância não resolveu
    if (studioId === '00000000-0000-0000-0000-000000000000') {
      studioId = adminUser?.studio_id || studentUser?.studio_id || '00000000-0000-0000-0000-000000000000'
    }
    
    const userName = body.pushName || adminUser?.name || studentUser?.name || 'Cliente'

    console.log(`📩 [SECRETARIA] Nova mensagem de ${userName}: ${messageContent}`)

    // 4.1 LÓGICA DE CONFIRMAÇÃO DE AULA (SIM/NAO)
    const normalizedMsg = messageContent.trim().toUpperCase()
    if (isStudent && (normalizedMsg === 'SIM' || normalizedMsg === 'NAO' || normalizedMsg === 'NÃO')) {
      const isConfirming = normalizedMsg === 'SIM'
      const todayStr = new Date().toISOString().split('T')[0]

      // Buscar presença pendente para hoje
      const { data: pendingAttendance } = await supabase
        .from('attendance')
        .select('*, class:classes(name)')
        .eq('student_id', studentUser.id)
        .eq('date', todayStr)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pendingAttendance) {
        await supabase
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

    // 5. PERSISTÊNCIA E IA
    await syncToDb(remoteJid, messageContent, studioId, userName, messageId)

    const geminiRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageContent,
        context: { studio_id: studioId, is_admin: isAdmin, user_name: userName }
      })
    })

    const { response: aiResponse } = await geminiRes.json()

    // 6. DETECÇÃO E CAPTURA DE LEADS (NOVA LÓGICA)
    let finalMessage = aiResponse;
    const leadRegex = /\[LEAD_DETECTED:\s*({.*?})\]/s;
    const match = aiResponse.match(leadRegex);

    if (match && !isAdmin && !isStudent && studioId !== '00000000-0000-0000-0000-000000000000') {
      try {
        const leadData = JSON.parse(match[1]);
        console.log('🎯 LEAD DETECTADO PELA IA:', leadData);

        // Remover o bloco JSON da mensagem que vai para o usuário
        finalMessage = aiResponse.replace(match[0], '').trim();

        // Salvar ou Atualizar Lead
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, notes')
          .eq('studio_id', studioId)
          .eq('phone', senderNumber)
          .maybeSingle();

        if (existingLead) {
          // Atualizar
          await supabase.from('leads').update({
            interest_level: leadData.interest_level,
            stage: leadData.stage !== 'new' ? leadData.stage : undefined, // Só muda estágio se avançou
            last_contact_date: new Date().toISOString(),
            notes: existingLead.notes ? `${existingLead.notes}\n[IA]: ${leadData.notes}` : `[IA]: ${leadData.notes}`
          }).eq('id', existingLead.id);
        } else {
          // Criar Novo
          await supabase.from('leads').insert({
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
        console.error('❌ Erro ao processar Lead AI:', e);
        // Se der erro no JSON, apenas limpamos a mensagem para não mostrar código pro usuário
        finalMessage = aiResponse.replace(/\[LEAD_DETECTED:.*?\]/s, '').trim();
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
      console.log(`✅ Resposta enviada para ${userName}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('💥 Erro Webhook:', error)
    return NextResponse.json({ success: false })
  }
}

async function syncToDb(remoteJid: string, content: string, studioId: string, name: string, messageId: string) {
  try {
    const { data: chat } = await supabase
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
      await supabase.from('whatsapp_messages').insert({
        studio_id: studioId,
        chat_id: chat.id,
        content: content,
        from_me: false,
        message_id: messageId,
        sender_number: senderNumber,
        timestamp: new Date().toISOString()
      })
    }
  } catch (e) {
    console.error('❌ Erro ao sincronizar mensagem no DB:', e)
  }
}

export async function GET() {
  return NextResponse.json({ active: true })
}
