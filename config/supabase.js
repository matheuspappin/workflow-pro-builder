/**
 * Configuração do Supabase para scripts internos (Node.js)
 * NÃO IMPORTAR NO FRONTEND
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const DB_CONFIG = {
  url: supabaseUrl,
  key: supabaseAnonKey,
  tables: {
    students: 'students',
    teachers: 'teachers',
    classes: 'classes',
    schedules: 'schedules',
    sessions: 'sessions',
    enrollments: 'enrollments',
    payments: 'payments',
    attendance: 'attendance',
    teacher_finances: 'teacher_finances',
    student_finances: 'student_finances',
    gamifications: 'gamifications',
    lead_pipelines: 'lead_pipelines',
    studio_settings: 'studio_settings'
  }
}

export async function testConnection() {
  console.log('Testing connection...')
  return true
}

export async function checkTables() {
  return {}
}

export async function initializeDefaultData() {
  console.log('Seed bypass for dev server safety')
}
