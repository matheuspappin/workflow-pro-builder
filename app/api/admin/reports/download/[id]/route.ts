import { NextRequest, NextResponse } from 'next/server';
import { checkStudioAccess } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';

/**
 * Permite baixar/visualizar um relatório de contexto da IA pelo ID
 * SEGURANÇA: Usa checkStudioAccess (mesma lógica das rotas fire-protection) e supabaseAdmin.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { id: reportId } = await params;
    const studioId = searchParams.get('studioId');

    if (!reportId || !studioId) {
      return NextResponse.json({ error: 'ID do relatório ou Studio ID ausente' }, { status: 400 });
    }

    // 1. Verificar acesso ao estúdio (usa cookies Supabase padrão via createServerClient)
    const access = await checkStudioAccess(req, studioId);
    if (!access.authorized) return access.response;

    // 2. Buscar relatório (supabaseAdmin não depende de RLS - acesso já validado acima)
    const { data: report, error } = await supabaseAdmin
      .from('studio_ai_reports')
      .select('content')
      .eq('id', reportId)
      .eq('studio_id', studioId)
      .single();

    if (error || !report) {
      logger.error('❌ Erro ao buscar relatório:', error);
      return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
    }

    // 3. Retornar conteúdo
    return new NextResponse(report.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai-context-report-${reportId}.txt"`,
      },
    });

  } catch (error: any) {
    logger.error('💥 Erro ao baixar relatório:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
