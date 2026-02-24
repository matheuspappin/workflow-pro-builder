'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAvailableSlots(studioId: string, professionalId: string, date: string) {
  const supabase = await createClient()
  
  // 1. Buscar agendamentos existentes para o dia
  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`
  
  const { data: existingAppointments, error } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('studio_id', studioId)
    .eq('professional_id', professionalId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled')

  if (error) throw new Error(`Erro ao buscar disponibilidade: ${error.message}`)

  // 2. Definir horários de trabalho (Exemplo: 08:00 às 18:00)
  // TODO: Buscar isso das configurações do estúdio/profissional futuramente
  const slots = []
  const workingStart = 8
  const workingEnd = 18
  
  for (let hour = workingStart; hour < workingEnd; hour++) {
    for (let min of [0, 30]) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      const slotStartTime = new Date(`${date}T${timeStr}:00Z`)
      
      // Verificar se o horário está ocupado
      const isOccupied = existingAppointments?.some(app => {
        const appStart = new Date(app.start_time)
        return appStart.getTime() === slotStartTime.getTime()
      })
      
      if (!isOccupied) {
        slots.push(timeStr)
      }
    }
  }

  return slots
}

export async function createAppointment(data: {
  studioId: string
  clientId: string
  professionalId: string
  serviceId: string
  startTime: string
  endTime: string
  notes?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('appointments')
    .insert({
      studio_id: data.studioId,
      client_id: data.clientId,
      professional_id: data.professionalId,
      service_id: data.serviceId,
      start_time: data.startTime,
      end_time: data.endTime,
      notes: data.notes,
      status: 'scheduled'
    })

  if (error) throw new Error(`Erro ao criar agendamento: ${error.message}`)
  
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

export async function getClientAppointments(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      professional:teachers(name),
      service:services(name, price)
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: false })

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
  return data
}
