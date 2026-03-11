import { NextRequest, NextResponse } from 'next/server'
import { getStudentsData, getTeachersData, getFinancialData, getClassesData } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'
import { buildCatarinaSystemPrompt, getContextTimestamp } from '@/lib/catarina'
import { resolveContactLayer } from '@/lib/ai-router'

/**
 * ENGINE DE IA - Catarina (Secretária Virtual)
 * Dance/Estúdio de Dança - Atendimento via WhatsApp e Chat
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history, context, model } = await request.json()
    if (!message) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const studioId = context?.studio_id || context?.studioId || "00000000-0000-0000-0000-000000000000"
    const isAdmin = context?.is_admin || false
    const isStudent = context?.is_student || false
    const contactLayerFromContext = context?.contact_layer

    // 0. BUSCAR DADOS DO ESTÚDIO E CHAVE DE API
    let apiKey = process.env.GOOGLE_AI_API_KEY
    let studioName = "Workflow AI";

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

    // 2. CONSTRUIR O SYSTEM PROMPT (Catarina)
    const contactLayer = resolveContactLayer(isAdmin, isStudent, 'dance', contactLayerFromContext)
    const systemPrompt = buildCatarinaSystemPrompt({
      studioName,
      niche: 'dance',
      contextContent,
      contactLayer: contactLayer as 'admin' | 'student' | 'lead',
      channel: 'whatsapp',
      includeLeadDetection: true,
      contextTimestamp: getContextTimestamp(),
      contactName: context?.contact_name,
      contactTypeLabel: context?.contact_type_label,
    })

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

    // 4. CHAMADA AO GEMINI (com fallback de modelos)
    const modelFallbacks = [model || 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    let lastError: string | null = null

    for (const modelToUse of modelFallbacks) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          const errMsg = result?.error?.message || result?.error?.status || `HTTP ${response.status}`
          lastError = errMsg
          logger.warn(`Gemini ${modelToUse} falhou:`, errMsg)
          continue
        }

        if (result.promptFeedback?.blockReason) {
          logger.warn('⚠️ Gemini bloqueou o prompt:', result.promptFeedback)
        }

        const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (aiResponse) {
          return NextResponse.json({ response: aiResponse })
        }
      } catch (e: any) {
        lastError = e?.message || 'Erro de conexão'
        logger.warn(`Gemini ${modelToUse} erro:`, lastError)
      }
    }

    const userMsg = lastError?.toLowerCase().includes('api key') || lastError?.toLowerCase().includes('invalid')
      ? 'Chave da API inválida. Verifique GOOGLE_AI_API_KEY no .env.'
      : lastError || 'Não foi possível obter resposta da IA. Tente novamente.'
    return NextResponse.json({ error: userMsg }, { status: 500 })

  } catch (error: any) {
    logger.error('💥 Erro Gemini:', error)
    const msg = error?.message || 'Erro interno no servidor.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
