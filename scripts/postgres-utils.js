/**
 * Utilitários PostgreSQL para Workflow AI
 * Funções helper para operações avançadas no banco
 */

import sql from '../db.js'
import logger from '../lib/logger.js'

/**
 * Estatísticas gerais do sistema
 */
export async function getSystemStats() {
  try {
    const [students, teachers, classes, sessions] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM students WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM teachers WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM classes WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM sessions WHERE status = 'realizada'`
    ])

    return {
      activeStudents: students[0].count,
      activeTeachers: teachers[0].count,
      activeClasses: classes[0].count,
      completedSessions: sessions[0].count
    }
  } finally {
    await sql.end()
  }
}

/**
 * Receita mensal detalhada
 */
export async function getMonthlyRevenue(year, month) {
  try {
    const referenceMonth = `${year}-${month.toString().padStart(2, '0')}`

    const revenue = await sql`
      SELECT
        SUM(amount) as total_revenue,
        COUNT(*) as total_payments,
        AVG(amount) as avg_payment
      FROM payments
      WHERE
        status = 'paid'
        AND reference_month = ${referenceMonth}
    `

    return revenue[0]
  } finally {
    await sql.end()
  }
}

/**
 * Presença por aluno em um período
 */
export async function getStudentAttendance(studentId, startDate, endDate) {
  try {
    const attendance = await sql`
      SELECT
        s.scheduled_date,
        s.status as session_status,
        c.name as class_name,
        c.dance_style,
        a.status as attendance_status,
        a.notes
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = ${studentId}
      WHERE s.scheduled_date BETWEEN ${startDate} AND ${endDate}
      ORDER BY s.scheduled_date
    `

    return attendance
  } finally {
    await sql.end()
  }
}

/**
 * Ranking de alunos por presença
 */
export async function getAttendanceRanking(limit = 10) {
  try {
    const ranking = await sql`
      SELECT
        s.name,
        s.email,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        ROUND(
          COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal /
          NULLIF(COUNT(a.*), 0) * 100, 1
        ) as attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.email
      HAVING COUNT(a.*) > 0
      ORDER BY attendance_rate DESC
      LIMIT ${limit}
    `

    return ranking
  } finally {
    await sql.end()
  }
}

/**
 * Relatório financeiro de professores
 */
export async function getTeacherPayments(teacherId, startDate, endDate) {
  try {
    const payments = await sql`
      SELECT
        s.scheduled_date,
        c.name as class_name,
        c.dance_style,
        tf.amount,
        tf.payment_date,
        tf.status as payment_status
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teacher_finances tf ON s.id = tf.session_id
      WHERE
        s.actual_teacher_id = ${teacherId}
        AND s.scheduled_date BETWEEN ${startDate} AND ${endDate}
      ORDER BY s.scheduled_date DESC
    `

    return payments
  } finally {
    await sql.end()
  }
}

/**
 * Limpar dados de teste (use com cuidado!)
 */
export async function clearTestData() {
  try {
    logger.info('🧹 Limpando dados de teste...')

    // Desabilitar triggers temporariamente para performance
    await sql`SET session_replication_role = 'replica'`

    // Limpar em ordem (respeitando foreign keys)
    await sql`DELETE FROM teacher_finances`
    await sql`DELETE FROM student_finances`
    await sql`DELETE FROM attendance`
    await sql`DELETE FROM gamifications`
    await sql`DELETE FROM lead_pipelines`
    await sql`DELETE FROM sessions`
    await sql`DELETE FROM enrollments`
    await sql`DELETE FROM payments`
    await sql`DELETE FROM classes`
    await sql`DELETE FROM teachers`
    await sql`DELETE FROM students`

    // Reabilitar triggers
    await sql`SET session_replication_role = 'origin'`

    logger.info('✅ Dados de teste removidos!')
  } finally {
    await sql.end()
  }
}

/**
 * Backup das configurações do estúdio
 */
export async function backupStudioSettings() {
  try {
    const settings = await sql`SELECT * FROM studio_settings ORDER BY setting_key`

    const backup = {
      timestamp: new Date().toISOString(),
      settings: settings
    }

    logger.debug('💾 Backup das configurações criado:', backup)
    return backup
  } finally {
    await sql.end()
  }
}

// Exportar todas as funções
export default {
  getSystemStats,
  getMonthlyRevenue,
  getStudentAttendance,
  getAttendanceRanking,
  getTeacherPayments,
  clearTestData,
  backupStudioSettings
}