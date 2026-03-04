/**
 * Timezone utilities for handling appointments and scheduling
 */

export function getTimezoneOffset(timezone: string = 'America/Sao_Paulo'): number {
  try {
    const now = new Date()
    const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
    const targetTime = new Date(utcTime.toLocaleString("en-US", { timeZone: timezone }))
    return (targetTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60)
  } catch (error) {
    console.warn('Invalid timezone, falling back to BRT:', timezone)
    return -3 // BRT fallback
  }
}

export function convertToTimezone(date: Date, timezone: string = 'America/Sao_Paulo'): Date {
  try {
    const utcTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
    const targetTime = new Date(utcTime.toLocaleString("en-US", { timeZone: timezone }))
    return new Date(targetTime.getTime() - (getTimezoneOffset(timezone) * 1000 * 60 * 60))
  } catch (error) {
    console.warn('Timezone conversion failed, using original date:', error)
    return date
  }
}

export function parseDateTime(dateStr: string, timeStr: string, timezone: string = 'America/Sao_Paulo'): Date {
  // Parse date string (YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Parse time string (HH:MM)
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  // Create date in UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
  
  // Convert to target timezone
  return convertToTimezone(utcDate, timezone)
}

export function formatDateTime(date: Date, timezone: string = 'America/Sao_Paulo'): string {
  try {
    return date.toLocaleString('pt-BR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    return date.toLocaleString('pt-BR')
  }
}

export function isBusinessHours(date: Date, timezone: string = 'America/Sao_Paulo'): boolean {
  const localDate = convertToTimezone(date, timezone)
  const hours = localDate.getHours()
  const dayOfWeek = localDate.getDay()
  
  // Check if it's weekday (Monday-Friday = 1-5)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  
  // Check if it's within business hours (8:00 - 18:00)
  const isBusinessTime = hours >= 8 && hours < 18
  
  return isWeekday && isBusinessTime
}

export function addBusinessHours(date: Date, hours: number, timezone: string = 'America/Sao_Paulo'): Date {
  const result = new Date(date)
  let remainingHours = hours
  
  while (remainingHours > 0) {
    result.setHours(result.getHours() + 1)
    
    if (isBusinessHours(result, timezone)) {
      remainingHours--
    }
  }
  
  return result
}

export function getNextBusinessDay(date: Date, timezone: string = 'America/Sao_Paulo'): Date {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  
  // Keep adding days until we hit a weekday
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) { // Sunday or Saturday
    nextDay.setDate(nextDay.getDate() + 1)
  }
  
  return nextDay
}

export function generateTimeSlots(
  date: string,
  intervalMinutes: number = 30,
  startHour: number = 8,
  endHour: number = 18,
  timezone: string = 'America/Sao_Paulo'
): string[] {
  const slots: string[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeStr)
    }
  }
  
  return slots
}

export function isValidTimeSlot(timeStr: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(timeStr)) return false
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  // Check if it's a valid 30-minute interval
  return minutes === 0 || minutes === 30
}

export function getTimeSlotDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}
