import { NextRequest, NextResponse } from 'next/server'
import { getStudentsData, getTeachersData, getFinancialData, getClassesData } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger';
import { detectIntent, executeIntent, generateConfirmationMessage } from '@/lib/intent-detection'
import { aiMessageSchema } from '@/lib/validation/ai-chat-schema'

export async function POST(request: NextRequest) {
  try {
    // 1. Validar entrada
    const body = await request.json()
    const validated = aiMessageSchema.parse(body)
    const { message, context, history } = validated

    // Buscar dados reais do banco (com fallback para dados mockados)
    let studentsData, teachersData, financialData, classesData
    const studioId = context?.studio_id || "00000000-0000-0000-0000-000000000000"

    // Verificar se a chave da API está configurada
    let apiKey = process.env.OPENAI_API_KEY
    
    // Buscar API key do estúdio se disponível
    if (studioId && studioId !== "00000000-0000-0000-0000-000000000000") {
      const { data: studioKeys } = await supabase
        .from('studio_api_keys')
        .select('api_key')
        .eq('studio_id', studioId)
        .eq('service_name', 'openai')
        .eq('status', 'active')
        .maybeSingle();
      
      if (studioKeys?.api_key) {
        apiKey = studioKeys.api_key;
      }
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key não configurada. Configure nas configurações do estúdio.' },
        { status: 500 }
      )
    }

    // 1. BUSCAR O RELATÓRIO DE CONTEXTO MAIS RECENTE (Fonte da Verdade)
    const { data: latestReport } = await supabase
      .from('studio_ai_reports')
      .select('content, created_at')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let contextContent = latestReport?.content || "";

    if (!contextContent) {
      // Fallback para buscar dados se não houver relatório
      try {
        const results = await Promise.allSettled([
          getStudentsData(studioId),
          getTeachersData(studioId),
          getFinancialData(studioId),
          getClassesData(studioId)
        ])

        studentsData = results[0].status === 'fulfilled' ? results[0].value : {
          total: 0, active: 0, newThisMonth: 0, retentionRate: 0
        }
        teachersData = results[1].status === 'fulfilled' ? results[1].value : {
          total: 0, active: 0, totalClasses: 0, averageRating: 0
        }
        financialData = results[2].status === 'fulfilled' ? results[2].value : {
          monthlyRevenue: 0, pendingPayments: 0, overduePayments: 0, totalPaidThisMonth: 0
        }
        classesData = results[3].status === 'fulfilled' ? results[3].value : {
          total: 0, active: 0, totalEnrollments: 0, occupancyRate: 0
        }

        contextContent = `
DADOS ATUAIS DO ESTÚDIO:
📊 ALUNOS:
- Total: ${studentsData.total} | Ativos: ${studentsData.active}
👨‍🏫 PROFESSORES:
- Total: ${teachersData.total} | Ativos: ${teachersData.active}
💰 FINANCEIRO:
- Receita: R$ ${financialData.monthlyRevenue} | Atrasados: R$ ${financialData.overduePayments}
        `;
      } catch (error) {
        logger.warn('Erro ao buscar dados do Supabase:', error)
      }
    }

    // Contexto do sistema para o Workflow AI com dados reais
    const systemPrompt = `Você é um assistente IA especializado em gestão de estúdios de dança chamado Workflow AI.

FONTE DA VERDADE (USE ESTES DADOS E NÃO INVENTE NADA):
${contextContent}

DIRETRIZES:
- Use APENAS os dados fornecidos acima para responder perguntas específicas sobre o estúdio.
- Se o usuário for um ALUNO (não-admin), nunca mencione faturamento, lucro ou devedores (seções EXCLUSIVO ADMIN).
- Foque em ajudar o usuário com decisões baseadas em dados se for Admin, ou com informações de aulas se for Aluno.
- Seja profissional, amigável e focado em métricas.
- Responda em português brasileiro.
- NUNCA invente horários, preços ou estatísticas.`;

    // Formatar histórico para o ChatGPT
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Fazer chamada para a API do OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...formattedHistory,
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      let errorMsg = 'Erro ao processar a resposta da IA'
      try {
        const errorData = await response.json()
        logger.error('Erro na API do OpenAI:', errorData)
        const openaiError = errorData?.error?.message || errorData?.message
        if (response.status === 401 || openaiError?.toLowerCase().includes('invalid') || openaiError?.toLowerCase().includes('api key')) {
          errorMsg = 'Chave da API inválida ou não configurada. Configure em Configurações do estúdio ou no .env (OPENAI_API_KEY).'
        } else if (response.status === 429 || openaiError?.toLowerCase().includes('rate limit')) {
          errorMsg = 'Limite de requisições excedido. Aguarde alguns minutos e tente novamente.'
        } else if (openaiError) {
          errorMsg = openaiError
        }
      } catch {
        logger.error('Erro ao parsear resposta da OpenAI:', response.status)
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      )
    }

    const data = await response.json()
    let aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Resposta vazia da IA' },
        { status: 500 }
      )
    }

    // Detectar intenção na mensagem do usuário
    const intent = await detectIntent(message, context)

    // Lidar com diferentes tipos de intenção
    if (intent.type === 'attendance_cancel' && intent.confidence > 0.6) {
      // Se é uma nova intenção de cancelamento, pedir confirmação
      if (!context?.pendingAction) {
        const confirmationMessage = generateConfirmationMessage(intent)
        aiResponse = `${confirmationMessage}\n\n${aiResponse}`

        return NextResponse.json({
          response: aiResponse,
          intent: intent.type,
          confidence: intent.confidence,
          actionExecuted: false,
          pendingAction: {
            type: intent.type,
            data: intent.data
          }
        })
      } else {
        // Se já havia uma ação pendente, executar agora
        const actionResult = await executeIntent(intent)

        if (actionResult.success) {
          aiResponse = `${actionResult.message}\n\n${aiResponse}`
        } else {
          aiResponse = `${actionResult.message}\n\n${aiResponse}`
        }

        return NextResponse.json({
          response: aiResponse,
          intent: intent.type,
          confidence: intent.confidence,
          actionExecuted: true
        })
      }
    }

    // Se é cancelamento de ação pendente
    if (intent.type === 'action_cancelled') {
      const actionResult = await executeIntent(intent)
      aiResponse = `${actionResult.message}\n\n${aiResponse}`

      return NextResponse.json({
        response: aiResponse,
        intent: intent.type,
        confidence: intent.confidence,
        actionExecuted: false
      })
    }

    return NextResponse.json({
      response: aiResponse,
      intent: intent.type,
      confidence: intent.confidence,
      actionExecuted: false
    })

  } catch (error) {
    logger.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}