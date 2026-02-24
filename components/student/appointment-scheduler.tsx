'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfDay, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock, Scissors, User, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAvailableSlots, createAppointment } from '@/lib/actions/appointments'
import { toast } from 'sonner'

interface AppointmentSchedulerProps {
  student: any
  vocabulary: any
}

export function AppointmentScheduler({ student, vocabulary }: AppointmentSchedulerProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Carregar serviços e profissionais
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  async function loadInitialData() {
    try {
      const { data: servData } = await supabase
        .from('services')
        .select('*')
        .eq('studio_id', student.studio_id)
        .eq('is_active', true)
      
      const { data: profData } = await supabase
        .from('teachers')
        .select('*')
        .eq('studio_id', student.studio_id)
        .eq('status', 'active')
      
      setServices(servData || [])
      setProfessionals(profData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  // Carregar horários disponíveis quando profissional ou data mudam
  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadSlots()
    }
  }, [selectedProfessional, selectedDate])

  async function loadSlots() {
    if (!selectedDate) return
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await getAvailableSlots(student.studio_id, selectedProfessional, dateStr)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return
    
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const startIso = `${dateStr}T${selectedTime}:00Z`
      
      // Calcular end_time (estimado 1h por enquanto ou baseado no serviço)
      const endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString()

      await createAppointment({
        studioId: student.studio_id,
        clientId: student.id,
        professionalId: selectedProfessional,
        serviceId: selectedService,
        startTime: startIso,
        endTime: endIso,
      })

      setStep(3)
      toast.success('Agendamento realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao agendar')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedService('')
    setSelectedProfessional('')
    setSelectedDate(new Date())
    setSelectedTime('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 gap-2">
          <CalendarIcon className="w-5 h-5" />
          AGENDAR {vocabulary.service.toUpperCase()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-3xl border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">
            {step === 3 ? 'Confirmado!' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                O que você precisa?
              </Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder="Escolha o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - R$ {s.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                Com quem?
              </Label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder="Escolha o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold" 
              disabled={!selectedService || !selectedProfessional}
              onClick={() => setStep(2)}
            >
              Ver Horários Disponíveis
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-2">
               <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="rounded-md border-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
              </Label>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {availableSlots.length > 0 ? (
                    availableSlots.map(slot => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        className={`h-10 rounded-lg text-xs font-bold ${selectedTime === slot ? 'bg-indigo-600 text-white' : 'border-slate-200 text-slate-600'}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))
                  ) : (
                    <p className="col-span-3 text-center py-4 text-xs text-muted-foreground italic">
                      Nenhum horário disponível para esta data.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="ghost" className="flex-1 font-bold text-slate-500" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button 
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100" 
                disabled={!selectedTime || loading}
                onClick={handleConfirm}
              >
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Agendado com sucesso!</h3>
              <p className="text-sm text-slate-500 mt-2 px-6">
                Seu horário para <b>{services.find(s => s.id === selectedService)?.name}</b> foi reservado para o dia <b>{format(selectedDate!, "dd/MM")}</b> às <b>{selectedTime}</b>.
              </p>
            </div>
            <Button className="w-full mt-6 bg-slate-900 text-white font-bold h-12 rounded-xl" onClick={resetForm}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
