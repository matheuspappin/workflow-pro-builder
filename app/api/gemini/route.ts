import { NextRequest, NextResponse } from 'next/server'
import { getStudentsData, getTeachersData, getFinancialData, getClassesData } from '@/lib/supabase'
import { detectIntent, executeIntent, generateConfirmationMessage } from '@/lib/intent-detection'
import { supabase } from '@/lib/supabase'

/**
 * ENGINE DE IA - DanceFlow AI (Modo Secretaria / Atendimento)
 * Focado em atendimento ao aluno, agendamentos e informações básicas.
 * Bloqueia informações sensíveis para não-admins.
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history, context, model } = await request.json()
    if (!message) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const studioId = context?.studio_id || context?.studioId || "00000000-0000-0000-0000-000000000000"
    const isAdmin = context?.is_admin || false; // Identifica se quem fala é o dono ou aluno

    // 0. BUSCAR DADOS DO ESTÚDIO E CHAVE DE API
    let apiKey = process.env.GOOGLE_AI_API_KEY
    let studioName = "DanceFlow AI";

    const { data: studioData } = await supabase
      .from('studios')
      .select('name')
      .eq('id', studioId)
      .maybeSingle();
    
    if (studioData?.name) {
      studioName = studioData.name;
    }

    if (studioId && studioId !== "00000000-0000-0000-0000-000000000000") {
      const { data: studioKeys } = await supabase
        .from('studio_api_keys')
        .select('api_key')
        .eq('studio_id', studioId)
        .eq('service_name', 'gemini')
        .maybeSingle();
      if (studioKeys?.api_key) apiKey = studioKeys.api_key;
    }

    if (!apiKey) return NextResponse.json({ error: 'Chave API não configurada' }, { status: 500 })

    // 1. BUSCAR O RELATÓRIO DE CONTEXTO MAIS RECENTE (Fonte da Verdade)
    const { data: latestReport } = await supabase
      .from('studio_ai_reports')
      .select('content, created_at')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Se não houver relatório recente, gera um contexto básico na hora (fallback)
    let contextContent = latestReport?.content || "";
    
    if (!contextContent) {
      // Fallback: Busca dados básicos se não houver relatório
      const [sStats, tStats, fStats, cStats] = await Promise.all([
        getStudentsData(studioId), getTeachersData(studioId), getFinancialData(studioId), getClassesData(studioId)
      ])
      contextContent = `
        RESUMO ATUAL (Sincronização Direta):
        - Alunos Ativos: ${sStats.active}
        - Financeiro Mensal: R$ ${fStats.monthlyRevenue}
        - Turmas: ${cStats.active}
      `;
    }

    // 2. CONSTRUIR O SYSTEM PROMPT
    const systemPrompt = `Você é a Secretaria Virtual do estúdio de dança "${studioName}". 
Seu objetivo é ser educada, prestativa e eficiente no atendimento ao público e alunos via WhatsApp.

FONTE DA VERDADE (USE ESTES DADOS E NÃO INVENTE NADA):
${contextContent}

SAUDAÇÃO OBRIGATÓRIA:
- Sempre comece o primeiro contato mencionando que você é a assistente virtual da "${studioName}".

DETECÇÃO DE LEADS (MUITO IMPORTANTE):
- Se o usuário NÃO for identificado como Admin ou Aluno (ou seja, um número desconhecido/lead):
  1. Analise se ele demonstra interesse em: Matrícula, Preços, Horários, Endereço ou Aula Experimental.
  2. Se SIM, você DEVE incluir um bloco JSON OCULTO no INÍCIO da sua resposta, estritamente neste formato:
     
     [LEAD_DETECTED: {"interest_level": 1-5, "stage": "new", "notes": "Resumo do interesse"}]

     Onde:
     - interest_level: 1 (Curioso) a 5 (Quer matricular agora).
     - stage: "contacted" (apenas perguntou), "trial_scheduled" (pediu aula exp), "negotiating" (pediu desconto).
     - notes: Breve resumo (ex: "Quer Ballet Adulto noite").

  3. Logo após o bloco JSON, escreva sua resposta normal e amigável para o cliente.

CONDIÇÕES DE ATENDIMENTO:
1. SE FOR ALUNO (NÃO-ADMIN): 
   - Nunca mostre faturamento, lucros, dados de outros alunos ou qualquer informação da seção "EXCLUSIVO ADMIN" do relatório.
   - Use os dados de turmas, horários e PACOTES DE CRÉDITOS presentes no "FONTE DA VERDADE" acima.
   - Sua missão é converter interessados em alunos e tirar dúvidas sobre a escola.
   - Se a informação não estiver no relatório, diga: "Infelizmente não tenho essa informação no momento, mas vou verificar com a equipe e te aviso!"

2. SE FOR ADMIN (DONO):
   - Você pode fornecer todos os dados do relatório, incluindo financeiro e devedores.
   - Seja um consultor: analise os números e sugira melhorias.

REGRAS CRÍTICAS:
- NUNCA mostre a lista de devedores ou faturamento para quem não for ADMIN.
- NUNCA invente horários, preços ou nomes de turmas que não estão no relatório.
- Se o usuário perguntar por algo que não existe no relatório, assuma que não existe ou que você não sabe.
- Responda de forma CURTA e OBJETIVA (máximo 3 parágrafos).
- Use Emojis 💃✨🚀`;

    // 3. PREPARAR HISTÓRICO
    let contents = []
    const validHistory = (history || []).filter((msg: any) => msg.content && msg.content.trim() !== "")
    let lastRole = ""
    for (const msg of validHistory) {
      const role = msg.role === 'user' ? 'user' : 'model'
      if (role !== lastRole) {
        contents.push({ role: role, parts: [{ text: msg.content }] })
        lastRole = role
      }
    }
    if (contents.length > 0 && contents[0].role === 'model') contents.shift()
    contents.push({ role: 'user', parts: [{ text: message }] })

    // 4. CHAMADA AO GEMINI
    const modelToUse = model || 'gemini-2.0-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 800 }, // Temperatura menor para ser mais assertiva
      }),
    })

    if (!response.ok) throw new Error('Erro na comunicação com a IA');

    const result = await response.json()
    
    // Log para depuração profunda
    console.log('🔍 Resposta Gemini RAW:', JSON.stringify(result, null, 2));

    if (result.promptFeedback?.blockReason) {
       console.warn('⚠️ Gemini bloqueou o prompt:', result.promptFeedback);
    }

    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Olá! Como posso te ajudar hoje?'

    return NextResponse.json({ response: aiResponse })

  } catch (error: any) {
    console.error('💥 Erro Gemini:', error)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
