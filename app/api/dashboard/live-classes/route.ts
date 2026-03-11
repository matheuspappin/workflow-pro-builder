import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    logger.error('❌ [LIVE-CLASSES] SUPABASE_SERVICE_ROLE_KEY não configurada.');
    return NextResponse.json({ error: 'Configuração de segurança (Service Key) ausente no servidor.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const studioId = req.nextUrl.searchParams.get('studioId');

    if (!studioId) {
      return NextResponse.json({ error: 'ID do estúdio não fornecido.' }, { status: 400 });
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    // 1. Pegar dia da semana e hora atual (Ajustado para o fuso de Brasília)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'long'
    });
    
    const parts = formatter.formatToParts(now);
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const currentTime = `${hour || '00'}:${minute || '00'}`; // Garante que hour/minute não sejam undefined
    
    const dayMap: { [key: string]: number } = {
      'domingo': 0, 'segunda-feira': 1, 'terça-feira': 2, 'quarta-feira': 3, 
      'quinta-feira': 4, 'sexta-feira': 5, 'sábado': 6
    };
    
    const dayName = new Intl.DateTimeFormat('pt-BR', { 
      timeZone: 'America/Sao_Paulo', 
      weekday: 'long' 
    }).format(now).toLowerCase();
    
    const dayOfWeek = dayMap[dayName] ?? now.getDay();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);

    logger.info(`🔍 [LIVE-CLASSES] Buscando para Studio: ${studioId}, Dia: ${dayOfWeek}, Hora: ${currentTime}`);

    // 2. Buscar turmas ativas
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*, professionals(name)')
      .eq('studio_id', studioId)
      .eq('status', 'active');

    if (classesError) {
      logger.error('❌ [LIVE-CLASSES] Erro ao buscar turmas:', classesError);
      throw classesError;
    }

    // 3. Filtrar turmas agora (Margem de 10 min antes e depois)
    const liveClasses = (classes || []).filter(cls => {
      const schedule = cls.schedule || [];
      return schedule.some((s: any) => {
        if (s.day_of_week !== dayOfWeek) return false;
        
        // Validar e usar horários padrão se ausentes
        const startTime = s.start_time || '00:00';
        const durationMinutes = s.duration_minutes || 60;

        if (!startTime.includes(':')) {
            logger.warn(`⚠️ [LIVE-CLASSES] Formato de horário inválido para turma ${cls.name}: start=${startTime}`);
            return false;
        }

        const [startH, startM] = startTime.split(':').map(Number);
        const [nowH, nowM] = currentTime.split(':').map(Number);
        
        const startTotal = startH * 60 + startM;
        const endTotal = startTotal + durationMinutes;
        const nowTotal = nowH * 60 + nowM;

        // Liberar visualização 15 minutos antes de começar até o fim da aula
        return nowTotal >= (startTotal - 15) && nowTotal <= endTotal;
      });
    });

    // 4. Buscar detalhes dos alunos
    const results = await Promise.all(liveClasses.map(async (cls) => {
      // Identificar o agendamento atual para extrair horários corretos
      const currentSchedule = cls.schedule.find((s: any) => s.day_of_week === dayOfWeek);
      const startTime = currentSchedule?.start_time || '00:00';
      const durationMinutes = currentSchedule?.duration_minutes || 60;
      
      const [startH, startM] = startTime.split(':').map(Number);
      const endTotalMinutes = (startH * 60 + startM) + durationMinutes;
      const endH = Math.floor(endTotalMinutes / 60) % 24;
      const endM = endTotalMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Buscar matrículas
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id, students(name, phone)')
        .eq('class_id', cls.id)
        .eq('status', 'active');

      if (enrollError) logger.warn(`⚠️ [LIVE-CLASSES] Erro enrollments para turma ${cls.name} (${cls.id}):`, enrollError);

      // Buscar presenças
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', cls.id)
        .eq('date', todayStr);

      if (attError) logger.warn(`⚠️ [LIVE-CLASSES] Erro attendance para turma ${cls.name} (${cls.id}):`, attError);

      const students = (enrollments || []).map((en: any) => {
        const studentData = en.students || en.student || {};
        const att = (attendance || []).find(a => a.student_id === en.student_id);
        
        return {
          id: en.student_id,
          name: studentData.name || 'Aluno s/ Nome',
          phone: studentData.phone || '',
          photo: '',
          status: att ? att.status : 'pending',
          checkInTime: att?.updated_at || null
        };
      });

      return {
        id: cls.id,
        name: cls.name,
        teacher: cls.professionals?.name || 'Não definido',
        style: cls.dance_style,
        level: cls.level,
        startTime: startTime,
        endTime: endTime,
        duration: durationMinutes,
        totalStudents: students.length,
        presentCount: students.filter(s => s.status === 'present').length,
        students: students.sort((a, b) => (a.status === 'present' ? -1 : 1))
      };
    }));

    return NextResponse.json({ 
      classes: results,
      currentTime,
      today: todayStr,
      count: results.length
    });

  } catch (error: any) {
    logger.error('💥 [LIVE-CLASSES] Erro fatal:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
