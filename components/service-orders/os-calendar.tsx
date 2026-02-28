'use client'

import React, { useState, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Wrench, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getServiceOrders } from '@/lib/actions/service-orders'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ServiceOrderForm } from './os-form'

interface OSCalendarProps {
  studioId: string
}

export function OSCalendar({ studioId }: OSCalendarProps) {
  const { t, language, vocabulary } = useVocabulary()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayOrders, setSelectedDayOrders] = useState<any[]>([])
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)

  const dateLocale = language === 'en' ? enUS : ptBR

  useEffect(() => {
    fetchOrders()
  }, [studioId, currentMonth])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Simplificado: busca todas as OS do estúdio. 
      // Em produção, filtrar pelo mês atual para performance.
      const data = await getServiceOrders(studioId)
      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao buscar OS para o calendário:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  })

  const getOrdersForDay = (day: Date) => {
    return orders.filter(order => {
      if (!order.scheduled_at) return false
      return isSameDay(parseISO(order.scheduled_at), day)
    })
  }

  const handleDayClick = (day: Date, dayOrders: any[]) => {
    setSelectedDate(day)
    setSelectedDayOrders(dayOrders)
    setIsDayDetailOpen(true)
  }

  const handleEditOrder = (order: any) => {
    setEditingOrder(order)
    setIsFormOpen(true)
    setIsDayDetailOpen(false)
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    waiting_parts: 'bg-orange-100 text-orange-700',
    finished: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="space-y-4">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-none h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())} className="rounded-none border-x h-8 px-2 text-xs font-bold">
              {language === 'en' ? 'Today' : 'Hoje'}
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-none h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button onClick={() => { setEditingOrder(null); setIsFormOpen(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t.service_orders.newOS}
        </Button>
      </div>

      {/* Grid do Calendário */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-slate-50 dark:bg-slate-800/50">
          {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-bold uppercase text-slate-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {calendarDays.map((day, idx) => {
            const dayOrders = getOrdersForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, monthStart)

            return (
              <div 
                key={idx} 
                className={`border-r border-b p-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer relative ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-40' : ''}`}
                onClick={() => handleDayClick(day, dayOrders)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayOrders.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-indigo-50 text-indigo-700 border-indigo-100">
                      {dayOrders.length} {dayOrders.length === 1 ? 'OS' : 'OSs'}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-hide">
                  {dayOrders.slice(0, 3).map((order) => (
                    <div 
                      key={order.id} 
                      className={`text-[9px] p-1 rounded border-l-2 truncate ${statusColors[order.status] || 'bg-slate-100'} border-l-current opacity-90`}
                    >
                      <span className="font-bold mr-1">{format(parseISO(order.scheduled_at), 'HH:mm')}</span>
                      {order.customer?.name}
                    </div>
                  ))}
                  {dayOrders.length > 3 && (
                    <div className="text-[9px] text-center text-slate-400 font-medium">
                      + {dayOrders.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dialog de Detalhes do Dia */}
      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              <span>OS agendadas para {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: dateLocale })}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {selectedDayOrders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground italic">Nenhuma OS agendada para este dia.</p>
            ) : (
              selectedDayOrders.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).map((order) => (
                <Card key={order.id} className="overflow-hidden hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => handleEditOrder(order)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold">{format(parseISO(order.scheduled_at), 'HH:mm')}</span>
                      </div>
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {(t.service_orders.status as Record<string, string>)[order.status] || order.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <User className="w-3 h-3" /> {order.customer?.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Wrench className="w-3 h-3" /> {order.description || 'Sem descrição'}
                      </p>
                      {order.professional && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-2 pt-2 border-t">
                          Técnico: {order.professional.name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={() => { setEditingOrder(null); setIsFormOpen(true); setIsDayDetailOpen(false); }} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Novo Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Formulário de OS */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? `${t.service_orders.editOS} #${editingOrder.tracking_code}` : t.service_orders.newOS}</DialogTitle>
          </DialogHeader>
          <ServiceOrderForm 
            studioId={studioId} 
            initialData={editingOrder} 
            onSuccess={() => {
              setIsFormOpen(false)
              fetchOrders()
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
