/**
 * Utilitários para operações no banco de dados DanceFlow AI
 * Funções helper para operações CRUD comuns com suporte a Multi-Tenancy
 */

import { supabase } from './supabase'

/**
 * Obtém o ID do estúdio atual do localStorage (apenas no cliente)
 */
function getCurrentStudioId() {
  if (typeof window === 'undefined') return null
  try {
    const userData = localStorage.getItem('danceflow_user')
    if (userData) {
      const user = JSON.parse(userData)
      return user.studio_id || user.studioId || null
    }
  } catch (e) {
    console.error('Erro ao ler studio_id do localStorage:', e)
  }
  return null
}

// ========== ALUNOS ==========

/**
 * Busca todos os alunos com paginação
 */
async function getStudents(options = {}) {
  const { 
    studioId = getCurrentStudioId(), 
    status, 
    search, 
    page = 1, 
    limit = 20 
  } = options

  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar alunos.')
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
  }

  let query = supabase
    .from('students')
    .select(`
      *,
      student_lesson_credits(remaining_credits, expiry_date)
    `, { count: 'exact' })
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

/**
 * Busca aluno por ID com relacionamentos
 */
async function getStudentById(id, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para buscar aluno')
  
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      enrollments:enrollments(
        class_id,
        classes:class_id(id, name, dance_style, level)
      ),
      payments:payments(*),
      attendance:attendance(*)
    `)
    .eq('id', id)
    .eq('studio_id', studioId)
    .single()

  if (error) throw error
  return data
}

/**
 * Cria ou atualiza aluno
 */
async function saveStudent(studentData, studioId = studentData.studio_id || getCurrentStudioId()) {
  const { id, ...data } = studentData

  if (!studioId) throw new Error('Studio ID é obrigatório para salvar aluno')

  const finalData = { ...data, studio_id: studioId }

    if (id) {
    // Update
    const { data: result, error } = await supabase
      .from('students')
      .update(finalData)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Erro Supabase updateStudent:', error)
      throw error
    }
    return result
  } else {
    // Create
    console.log('📝 Tentando inserir aluno:', finalData)
    const { data: result, error } = await supabase
      .from('students')
      .insert(finalData)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Erro Supabase insertStudent (DETALHADO):', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
      const errorMsg = error.message || 'Erro ao inserir aluno no banco de dados'
      throw new Error(errorMsg)
    }
    return result
  }
}

/**
 * Exclui um aluno permanentemente
 */
async function deleteStudent(id, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para excluir aluno')

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) throw error
  return true
}

// ========== PROFESSORES ==========

/**
 * Busca todos os professores
 */
async function getTeachers(options = {}) {
  const { 
    studioId = getCurrentStudioId(), 
    status, 
    search 
  } = options

  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar professores.')
    return []
  }

  let query = supabase
    .from('teachers')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Busca professor por ID com relacionamentos
 */
async function getTeacherById(id, studioId = getCurrentStudioId()) {
  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar professor.')
    return null
  }

  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      classes:classes(id, name, dance_style, level, current_students, max_students),
      finances:teacher_finances(*)
    `)
    .eq('id', id)
    .eq('studio_id', studioId)
    .single()

  if (error) throw error
  return data
}

async function saveTeacher(teacherData, studioId = teacherData.studio_id || getCurrentStudioId()) {
  const { id, ...data } = teacherData

  if (!studioId) throw new Error('Studio ID é obrigatório para salvar professor')

  const finalData = { ...data, studio_id: studioId }

    if (id) {
    // Update
    const { data: result, error } = await supabase
      .from('teachers')
      .update(finalData)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Erro Supabase updateTeacher:', error)
      throw error
    }
    return result
  } else {
    // Create
    const { data: result, error } = await supabase
      .from('teachers')
      .insert(finalData)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Erro Supabase insertTeacher:', error)
      throw error
    }
    return result
  }
}

/**
 * Exclui um professor permanentemente
 */
async function deleteTeacher(id, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para excluir professor')

  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) throw error
  return true
}

// ========== TURMAS ==========

/**
 * Busca todas as turmas ativas
 */
async function getClasses(options = {}) {
  const { 
    studioId = getCurrentStudioId(), 
    status, 
    teacherId 
  } = options

  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar turmas.')
    return []
  }

  let query = supabase
    .from('classes')
    .select(`
      *,
      teacher:teacher_id(name)
    `)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Erro no Supabase getClasses:', error)
    throw error
  }
  return data || []
}

/**
 * Cria ou atualiza uma turma
 */
async function saveClass(classData, studioId = classData.studio_id || getCurrentStudioId()) {
  const { id, ...data } = classData

  if (!studioId) throw new Error('Studio ID é obrigatório para salvar turma')

  const finalData = { ...data, studio_id: studioId }

  if (id) {
    const { data: result, error } = await supabase
      .from('classes')
      .update(finalData)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error
    return result
  } else {
    const { data: result, error } = await supabase
      .from('classes')
      .insert(finalData)
      .select()
      .single()

    if (error) throw error
    return result
  }
}

// ========== PRESENÇA ==========

/**
 * Registra presença/falta
 */
async function registerAttendance(attendanceData, studioId = attendanceData.studio_id || getCurrentStudioId()) {
  const { studentId, classId, date, status, notes } = attendanceData

  if (!studioId) throw new Error('Studio ID é obrigatório para registrar presença')

  // Verificar se já existe registro
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('studio_id', studioId)
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('date', date)
    .single()

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Insert
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        studio_id: studioId,
        student_id: studentId,
        class_id: classId,
        date,
        status,
        notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Busca presença de um aluno
 */
async function getStudentAttendance(studentId, options = {}) {
  const { startDate, endDate, limit = 30, studioId = options.studioId || getCurrentStudioId() } = options
  
  if (!studioId) throw new Error('Studio ID é obrigatório para buscar presença')

  let query = supabase
    .from('attendance')
    .select(`
      *,
      class:classes(name, dance_style)
    `)
    .eq('studio_id', studioId)
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// ========== FINANCEIRO ==========

/**
 * Busca pagamentos de um aluno
 */
async function getStudentPayments(studentId, options = {}) {
  const { status = null, limit = 12, studioId = options.studioId || getCurrentStudioId() } = options

  if (!studioId) throw new Error('Studio ID é obrigatório para buscar pagamentos')

  let query = supabase
    .from('payments')
    .select('*')
    .eq('studio_id', studioId)
    .eq('student_id', studentId)
    .order('due_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Registra pagamento
 */
async function registerPayment(paymentData, studioId = paymentData.studio_id || getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para registrar pagamento')
  
  const finalData = { ...paymentData, studio_id: studioId }
  
  const { data, error } = await supabase
    .from('payments')
    .insert(finalData)
    .select()
    .single()

  if (error) throw error
  return data
}

// ========== DASHBOARD ==========

/**
 * Busca estatísticas para dashboard
 */
async function getDashboardStats(studioId = getCurrentStudioId()) {
  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para estatísticas. Retornando dados zerados.')
    return {
      activeStudents: 0,
      activeTeachers: 0,
      activeClasses: 0,
      monthlyRevenue: 0,
      chartRevenueData: [],
      chartClassesData: [],
      evasionAlerts: [],
      upcomingClasses: []
    }
  }

  try {
    // Alunos ativos
    const { count: activeStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'active')

    // Professores ativos
    const { count: activeTeachers } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'active')

    // Turmas ativas
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'active')

    // Receita mensal (último mês)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toISOString().slice(0, 7) // YYYY-MM

    const { data: monthlyRevenue } = await supabase
      .from('payments')
      .select('amount')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .like('reference_month', `${lastMonthStr}%`)

    const revenue = monthlyRevenue?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    // Inadimplência (Total vencido e não pago)
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: overduePayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('studio_id', studioId)
      .in('status', ['pending', 'overdue'])
      .lt('due_date', todayStr)

    const totalOverdue = overduePayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    // --- NOVOS DADOS PARA GRÁFICOS ---
    
    // Receita dos últimos 6 meses e Despesas Reais
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1) // Início do mês
    
    // 1. Buscar Receita Real
    const { data: recentRevenue } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0])

    // 2. Buscar Despesas Reais
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('amount, due_date, status')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .gte('due_date', sixMonthsAgo.toISOString().split('T')[0])
      
    // Agrupar por mês
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const dataByMonth = {}
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthName = months[d.getMonth()]
      dataByMonth[monthName] = { receita: 0, despesas: 0 }
    }
    
    recentRevenue?.forEach(p => {
      const d = new Date(p.payment_date)
      const monthName = months[d.getMonth()]
      if (dataByMonth[monthName]) {
        dataByMonth[monthName].receita += parseFloat(p.amount)
      }
    })

    recentExpenses?.forEach(e => {
      const d = new Date(e.due_date)
      const monthName = months[d.getMonth()]
      if (dataByMonth[monthName]) {
        dataByMonth[monthName].despesas += parseFloat(e.amount)
      }
    })
    
    const chartRevenueData = Object.keys(dataByMonth).map(month => ({
      month,
      receita: dataByMonth[month].receita,
      despesas: dataByMonth[month].despesas
    }))

    // Alunos por modalidade (contando matrículas reais)
    const { data: enrollmentsByModality } = await supabase
      .from('enrollments')
      .select(`
        status,
        classes:class_id(dance_style)
      `)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      
    const modalityDistribution = {}
    enrollmentsByModality?.forEach(e => {
      const style = e.classes?.dance_style || 'Outros'
      modalityDistribution[style] = (modalityDistribution[style] || 0) + 1
    })
    
    const chartClassesData = Object.keys(modalityDistribution).map(name => ({
      name,
      alunos: modalityDistribution[name]
    }))

    // --- ALERTAS DE EVASÃO (INTELIGENTE BASEADO EM FALTAS E TEMPO) ---
    const { data: studentsWithAttendance } = await supabase
      .from('students')
      .select(`
        id, 
        name, 
        attendance(date, status)
      `)
      .eq('studio_id', studioId)
      .eq('status', 'active')

    const evasionAlerts = studentsWithAttendance?.map(student => {
      const absences = student.attendance?.filter((a: any) => a.status === 'absent') || []
      const lastAttendance = student.attendance?.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]

      let risk = 'baixo'
      let lastClassText = 'Nenhuma aula'

      if (lastAttendance) {
        const lastDate = new Date(lastAttendance.date)
        const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24))
        
        if (diffDays > 21) risk = 'alto'
        else if (diffDays > 14) risk = 'medio'
        
        lastClassText = diffDays === 0 ? 'Hoje' : (diffDays < 7 ? `${diffDays} dias` : `${Math.floor(diffDays / 7)} semanas`)
      } else {
        risk = 'medio' // Novo aluno sem aulas ainda
      }

      return {
        id: student.id,
        name: student.name,
        lastClass: lastClassText,
        risk
      }
    })
    .filter(a => a.risk !== 'baixo')
    .sort((a, b) => (a.risk === 'alto' ? -1 : 1))
    .slice(0, 3) || []

    // --- PRÓXIMAS AULAS (AULAS DE HOJE) ---
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().getDay()
    
    // Tentar pegar das sessões reais primeiro
    const { data: todaySessions } = await supabase
      .from('sessions')
      .select('id, classes(name, schedule), teachers:actual_teacher_id(name), scheduled_date, attendance_count')
      .eq('studio_id', studioId)
      .eq('scheduled_date', today)
      .order('created_at', { ascending: true })
      .limit(3)

    let upcomingClasses = []
    
    if (todaySessions && todaySessions.length > 0) {
      upcomingClasses = todaySessions.map(s => {
        const schedule = (s.classes as any)?.schedule as any[]
        const schedToday = schedule?.find((sc: any) => sc.day_of_week === dayOfWeek)
        const time = schedToday?.start_time || '14:00'
        
        return {
          id: s.id,
          name: (s.classes as any)?.name || 'Aula',
          time: time,
          students: s.attendance_count || 0,
          teacher: (s.teachers as any)?.name || 'Prof. Titular'
        }
      })
    } else {
      // Se não houver sessões criadas, buscar da grade horária das turmas
      const { data: scheduledClasses } = await supabase
        .from('classes')
        .select('id, name, schedule, teachers(name)')
        .eq('studio_id', studioId)
        .eq('status', 'active')

      upcomingClasses = scheduledClasses
        ?.filter(c => {
          const schedule = c.schedule as any[]
          return Array.isArray(schedule) && schedule.some(s => s.day_of_week === dayOfWeek)
        })
        .map(c => {
          const schedule = c.schedule as any[]
          const s = schedule.find(sc => sc.day_of_week === dayOfWeek)
          return {
            id: c.id,
            name: c.name,
            time: s.start_time,
            students: 0, // Não sabemos ainda sem a sessão
            teacher: (c.teachers as any)?.name || 'Prof. Titular'
          }
        })
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 3) || []
    }

    // --- DISTRIBUIÇÃO POR FAIXA ETÁRIA ---
    const { data: studentAges } = await supabase
      .from('students')
      .select('birth_date')
      .eq('studio_id', studioId)
      .eq('status', 'active')

    const now = new Date()
    let kids = 0, teens = 0, adults = 0

    studentAges?.forEach(s => {
      if (!s.birth_date) {
        adults++ // Fallback
        return
      }
      const birth = new Date(s.birth_date)
      const age = now.getFullYear() - birth.getFullYear()
      
      if (age < 12) kids++
      else if (age < 18) teens++
      else adults++
    })

    const totalStudentsForAge = kids + teens + adults || 1
    const studentDistribution = [
      { name: "Crianças", value: Math.round((kids / totalStudentsForAge) * 100), fill: "#9333ea" },
      { name: "Adolescentes", value: Math.round((teens / totalStudentsForAge) * 100), fill: "#db2777" },
      { name: "Adultos", value: Math.round((adults / totalStudentsForAge) * 100), fill: "#06b6d4" },
    ]

    // --- PERCENTUAIS DE CRESCIMENTO ---
    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    lastMonthStart.setDate(1)
    const lastMonthEnd = new Date(lastMonthStart)
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1)
    lastMonthEnd.setDate(0)

    // Alunos novos este mês vs mês passado
    const { count: studentsThisMonth } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('enrollment_date', lastMonthEnd.toISOString().split('T')[0])

    const { count: studentsLastMonth } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('enrollment_date', lastMonthStart.toISOString().split('T')[0])
      .lt('enrollment_date', lastMonthEnd.toISOString().split('T')[0])

    const studentGrowth = studentsLastMonth ? Math.round(((studentsThisMonth || 0) / studentsLastMonth) * 100) : (studentsThisMonth ? 100 : 0)

    // Receita este mês vs mês passado
    const { data: revenueLastMonth } = await supabase
      .from('payments')
      .select('amount')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .gte('payment_date', lastMonthStart.toISOString().split('T')[0])
      .lt('payment_date', lastMonthEnd.toISOString().split('T')[0])

    const revLastMonth = revenueLastMonth?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
    const revenueGrowth = revLastMonth ? Math.round(((revenue / revLastMonth) - 1) * 100) : (revenue ? 100 : 0)

    return {
      activeStudents: activeStudents || 0,
      activeTeachers: activeTeachers || 0,
      activeClasses: activeClasses || 0,
      monthlyRevenue: revenue,
      totalOverdue: totalOverdue,
      studentGrowth: studentGrowth > 0 ? `+${studentGrowth}%` : `${studentGrowth}%`,
      revenueGrowth: revenueGrowth > 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`,
      chartRevenueData,
      chartClassesData,
      evasionAlerts,
      upcomingClasses,
      studentDistribution
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      activeStudents: 0,
      activeTeachers: 0,
      activeClasses: 0,
      monthlyRevenue: 0,
      totalOverdue: 0,
      chartRevenueData: [],
      chartClassesData: []
    }
  }
}

// ========== CONFIGURAÇÕES ==========

/**
 * Busca configuração do estúdio
 */
async function getStudioSetting(key, studioId = getCurrentStudioId()) {
  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar configurações.')
    return null
  }

  const { data, error } = await supabase
    .from('studio_settings')
    .select('setting_value')
    .eq('studio_id', studioId)
    .eq('setting_key', key)
    .single()

  if (error) throw error
  return data?.setting_value
}

/**
 * Atualiza configuração do estúdio
 */
async function updateStudioSetting(key, value, description = '', studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para salvar configurações')

  try {
    const { data, error } = await supabase
      .from('studio_settings')
      .upsert({
        studio_id: studioId,
        setting_key: key,
        setting_value: String(value), // Garantir que é string
        setting_description: description,
        updated_at: new Date().toISOString()
      }, { onConflict: 'studio_id, setting_key' })
      .select()
      .single()

    if (error) {
      const errorDetail = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }
      console.error(`❌ Erro no Supabase updateStudioSetting (${key}):`, errorDetail)
      throw errorDetail
    }
    return data
  } catch (error) {
    console.error(`💥 Exceção em updateStudioSetting (${key}):`, error)
    throw error
  }
}

// ========== MODALIDADES ==========

/**
 * Busca todas as modalidades do estúdio
 */
async function getModalities(studioId = getCurrentStudioId()) {
  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar modalidades.')
    return []
  }

  const { data, error } = await supabase
    .from('modalities')
    .select('*')
    .eq('studio_id', studioId)
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Erro ao buscar modalidades:', error)
    return []
  }
  return data || []
}

/**
 * Cria ou atualiza uma modalidade
 */
async function saveModality(modalityData, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para salvar modalidade')

  const { id, ...data } = modalityData
  const finalData = { ...data, studio_id: studioId }

  if (id) {
    const { data: result, error } = await supabase
      .from('modalities')
      .update(finalData)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error
    return result
  } else {
    const { data: result, error } = await supabase
      .from('modalities')
      .insert(finalData)
      .select()
      .single()

    if (error) throw error
    return result
  }
}

// ========== DESPESAS ==========

/**
 * Busca todas as despesas do estúdio
 */
async function getExpenses(options = {}) {
  const { 
    studioId = getCurrentStudioId(), 
    status, 
    category,
    startDate,
    endDate
  } = options

  if (!studioId) {
    console.warn('⚠️ Studio ID não disponível para buscar despesas.')
    return []
  }

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('studio_id', studioId)
    .order('due_date', { ascending: false })

  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (startDate) query = query.gte('due_date', startDate)
  if (endDate) query = query.lte('due_date', endDate)

  const { data, error } = await query

  if (error) {
    console.error('❌ Erro ao buscar despesas:', error)
    return []
  }
  return data || []
}

/**
 * Salva ou atualiza uma despesa
 */
async function saveExpense(expenseData, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para salvar despesa')

  const { id, ...data } = expenseData
  const finalData = { ...data, studio_id: studioId }

  if (id) {
    const { data: result, error } = await supabase
      .from('expenses')
      .update(finalData)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error

    // Lógica de Recorrência: Se foi marcada como paga e é recorrente, gera a próxima
    if (result.status === 'paid' && result.is_recurring) {
      await generateNextOccurrence(result)
    }

    return result
  } else {
    const { data: result, error } = await supabase
      .from('expenses')
      .insert(finalData)
      .select()
      .single()

    if (error) throw error
    return result
  }
}

/**
 * Gera a próxima ocorrência de uma despesa recorrente
 */
async function generateNextOccurrence(expense) {
  const nextDueDate = new Date(expense.due_date)
  
  if (expense.recurrence_period === 'monthly') {
    nextDueDate.setMonth(nextDueDate.getMonth() + 1)
  } else if (expense.recurrence_period === 'weekly') {
    nextDueDate.setDate(nextDueDate.getDate() + 7)
  } else if (expense.recurrence_period === 'yearly') {
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
  }

  // Verificar se já existe a próxima ocorrência (para evitar duplicatas)
  const { data: existing } = await supabase
    .from('expenses')
    .select('id')
    .eq('studio_id', expense.studio_id)
    .eq('description', expense.description)
    .eq('due_date', nextDueDate.toISOString().split('T')[0])
    .single()

  if (existing) return

  // Criar nova despesa baseada na atual
  const { error } = await supabase
    .from('expenses')
    .insert({
      studio_id: expense.studio_id,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      due_date: nextDueDate.toISOString().split('T')[0],
      status: 'pending',
      is_recurring: true,
      recurrence_period: expense.recurrence_period,
      parent_id: expense.id,
      notes: expense.notes
    })

  if (error) console.error('Erro ao gerar próxima despesa recorrente:', error)
}

/**
 * Deleta uma despesa
 */
async function deleteExpense(id, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório para deletar despesa')

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) throw error
  return true
}

async function getTeacherByUserId(userId, studioId = getCurrentStudioId()) {
  if (!userId) throw new Error('User ID é obrigatório')
  
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export {
  getStudents,
  getStudentById,
  saveStudent,
  deleteStudent,
  getTeachers,
  getTeacherById,
  getTeacherByUserId,
  saveTeacher,
  deleteTeacher,
  getClasses,
  saveClass,
  registerAttendance,
  getStudentAttendance,
  getStudentPayments,
  registerPayment,
  getDashboardStats,
  getStudioSetting,
  updateStudioSetting,
  getModalities,
  saveModality,
  getExpenses,
  saveExpense,
  deleteExpense,
  saveChatSession,
  getChatSessions,
  getChatSessionById,
  deleteChatSession,
  getStudioApiKey,
  saveStudioApiKey
}

// ========== API KEYS ==========

/**
 * Busca chave de API do estúdio
 */
async function getStudioApiKey(serviceName, studioId = getCurrentStudioId()) {
  if (!studioId) return null

  const { data, error } = await supabase
    .from('studio_api_keys')
    .select('api_key')
    .eq('studio_id', studioId)
    .eq('service_name', serviceName)
    .maybeSingle()

  if (error) {
    console.error(`Erro ao buscar API key (${serviceName}):`, error.message)
    return null
  }
  return data?.api_key
}

/**
 * Salva chave de API do estúdio
 */
async function saveStudioApiKey(serviceName, apiKey, studioId = getCurrentStudioId()) {
  if (!studioId) throw new Error('Studio ID é obrigatório')

  const { data, error } = await supabase
    .from('studio_api_keys')
    .upsert({
      studio_id: studioId,
      service_name: serviceName,
      api_key: apiKey,
      updated_at: new Date().toISOString()
    }, { onConflict: 'studio_id, service_name' })
    .select()
    .single()

  if (error) throw error
  return data
}

// ========== CHAT IA ==========

/**
 * Salva ou atualiza uma sessão de chat
 */
async function saveChatSession(sessionData, studioId = getCurrentStudioId()) {
  if (!studioId) return null

  const { id, title, messages } = sessionData
  
  // Garantir que messages é um JSON válido
  const messagesJson = Array.isArray(messages) ? messages : []

  const payload = {
    studio_id: studioId,
    title: title || (messagesJson.length > 0 ? messagesJson[messagesJson.length - 1].content.substring(0, 50) + '...' : 'Nova Conversa'),
    messages: messagesJson,
    updated_at: new Date().toISOString()
  }

  if (id) {
    payload['id'] = id
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    // Silencioso para não quebrar o chat se a tabela não existir
    console.warn('Erro ao salvar sessão de chat (verifique se a tabela chat_sessions existe):', error.message)
    return null
  }
  return data
}

/**
 * Busca sessões de chat recentes (últimos 15 dias)
 */
async function getChatSessions(studioId = getCurrentStudioId()) {
  if (!studioId) return []

  const fifteenDaysAgo = new Date()
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, updated_at')
    .eq('studio_id', studioId)
    .gte('updated_at', fifteenDaysAgo.toISOString())
    .order('updated_at', { ascending: false })

  if (error) {
    console.warn('Erro ao buscar sessões de chat:', error.message)
    return []
  }
  return data || []
}

/**
 * Busca uma sessão específica
 */
async function getChatSessionById(id) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Deleta uma sessão
 */
async function deleteChatSession(id) {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
