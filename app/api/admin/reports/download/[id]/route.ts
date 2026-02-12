import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Permite baixar um relatório de contexto da IA pelo ID
 * SEGURANÇA: Verifica sessão do usuário e garante acesso apenas ao estúdio correspondente via RLS e validação.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { id: reportId } = await params;
    const studioId = searchParams.get('studioId');

    if (!reportId || !studioId) {
      return NextResponse.json({ error: 'ID do relatório ou Studio ID ausente' }, { status: 400 });
    }

    // 1. Obter cookies para autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value || 
                  cookieStore.get('sb-auth-token')?.value ||
                  cookieStore.getAll().find(c => c.name.includes('auth-token'))?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    // 2. Criar cliente autenticado (respeita RLS)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 3. Verificar validade da sessão
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
         return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // 4. Buscar relatório com verificação estrita de studio_id
    // Se o RLS estiver ativo na tabela studio_ai_reports, isso retornará vazio se o usuário não for do estúdio.
    // Mesmo sem RLS, verificamos se o studio_id bate com o solicitado.
    const { data: report, error } = await supabaseClient
      .from('studio_ai_reports')
      .select('content')
      .eq('id', reportId)
      .eq('studio_id', studioId)
      .single();

    if (error || !report) {
      console.error('❌ Erro ao buscar relatório ou acesso negado:', error);
      return NextResponse.json({ error: 'Relatório não encontrado ou acesso negado para este estúdio.' }, { status: 404 });
    }

    // 5. Retornar conteúdo
    return new NextResponse(report.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai-context-report-${reportId}.txt"`,
      },
    });

  } catch (error: any) {
    console.error('💥 Erro ao baixar relatório:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
