import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyLowCredits } from '@/lib/whatsapp'
import logger from '@/lib/logger'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'

export async function POST(request: NextRequest) {
  const { isAdmin } = await checkSuperAdminDetailed();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
  }

  // Criar cliente com Service Role para ignorar RLS nas buscas administrativas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    logger.error('CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
    return NextResponse.json({ success: false, error: 'Erro de configuração no servidor (Chave de API).' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { attendanceId, adminId } = await request.json()

    if (!attendanceId) {
      return NextResponse.json({ success: false, error: 'Código de presença ausente' }, { status: 400 })
    }

    // 0. Tentar buscar por Asset (Extintor/Equipamento)
    // Primeiro verificamos se é um Asset, pois o ID pode ser qualquer string (hash)
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('*, student:students(name)')
      .eq('qr_code', attendanceId)
      .maybeSingle();

    if (asset) {
        // Lógica de validação de Asset
        const now = new Date();
        const expiration = asset.expiration_date ? new Date(asset.expiration_date) : new Date(8640000000000000); // Se não tiver data, assume eterno
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 30);
        
        let status = 'ok';
        let message = 'Equipamento em dia.';
        let success = true;

        if (asset.expiration_date && expiration < now) {
            status = 'expired';
            message = 'Equipamento VENCIDO!';
            success = false; // Scanner deve mostrar erro/vermelho
        } else if (asset.expiration_date && expiration < warningDate) {
            status = 'warning';
            message = 'Vence em menos de 30 dias.';
            // Success true mas o frontend deve tratar warning
        }

        return NextResponse.json({
            success: success, 
            type: 'asset',
            asset: asset,
            status: status, // ok, warning, expired
            studentName: asset.student?.name || 'Sem Cliente',
            className: `${asset.name} (${asset.type || 'N/A'})`, // Reusando campo className para mostrar info do asset
            message: message,
            expirationDate: asset.expiration_date
        });
    }

    let targetId = attendanceId;

    // 0. Se for formato curto (DF-XXXXXXXX), buscar o ID completo
    if (attendanceId.toString().startsWith('DF-')) {
        const shortCode = attendanceId.replace('DF-', '').toUpperCase();
        logger.info('🔍 [BACKEND] Buscando UUID para código curto:', shortCode);
        
        // Busca robusta: Filtramos registros do dia para encontrar o UUID correspondente
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: records, error: searchError } = await supabaseAdmin
            .from('attendance')
            .select('id')
            .eq('date', todayStr);

        if (searchError) {
            logger.error('❌ [BACKEND] Erro ao buscar registros do dia:', searchError);
        }

        const match = records?.find(r => r.id.toUpperCase().endsWith(shortCode));
        
        if (!match) {
            logger.warn('⚠️ [BACKEND] Código não encontrado nos registros de hoje. Tentando busca global...');
            // Fallback: Busca global (mais lenta, mas garante se não for de hoje)
            // Nota: ilike em UUID pode falhar em alguns dialetos, por isso o find manual é mais seguro
            const { data: allRecords } = await supabaseAdmin
                .from('attendance')
                .select('id')
                .limit(100); // Limitamos para evitar sobrecarga, assumindo que códigos recentes estarão aqui
            
            const globalMatch = allRecords?.find(r => r.id.toUpperCase().endsWith(shortCode));
            
            if (!globalMatch) {
                logger.error('❌ [BACKEND] Código de acesso não localizado:', shortCode);
                return NextResponse.json({ success: false, error: 'Código de acesso não encontrado.' }, { status: 404 })
            }
            targetId = globalMatch.id;
        } else {
            targetId = match.id;
        }
        logger.info('✅ [BACKEND] UUID Localizado:', targetId);
    }

    // 1. Buscar a presença e dados do aluno/turma
    const { data: attendance, error: attError } = await supabaseAdmin
      .from('attendance')
      .select('*, student:students(id, name), class:classes(id, name, studio_id)')
      .eq('id', targetId)
      .single()

    if (attError || !attendance) {
      return NextResponse.json({ success: false, error: 'Presença não encontrada' }, { status: 404 })
    }

    if (attendance.status === 'present') {
      return NextResponse.json({ success: false, error: 'Esta presença já foi validada anteriormente.' }, { status: 400 })
    }

    // 2. Validar créditos do aluno
    const { data: credits, error: creditError } = await supabaseAdmin
      .from('student_lesson_credits')
      .select('*')
      .eq('student_id', attendance.student_id)
      .maybeSingle()

    if (!credits || credits.remaining_credits <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: `O aluno ${attendance.student.name} não possui créditos de aula disponíveis.` 
      }, { status: 402 })
    }

    // 3. ATUALIZAR TUDO EM TRANSAÇÃO VIA RPC
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('confirm_attendance_with_credit', {
      p_attendance_id: targetId,
      p_admin_id: adminId
    })

    if (rpcError) throw rpcError

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 })
    }

    // 4. Notificar se os créditos estiverem baixos (assíncrono)
    if (result.new_balance <= 2) {
      notifyLowCredits(attendance.student_id, attendance.class.studio_id, result.new_balance).catch(e => {
        logger.error('Erro ao enviar notificação de crédito baixo:', e);
      });
    }

    return NextResponse.json({ 
      success: true, 
      studentName: result.student_name,
      className: result.class_name
    })

  } catch (error: any) {
    logger.error('Erro ao validar scan admin:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
