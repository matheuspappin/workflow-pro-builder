"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  QrCode,
  ArrowLeft,
  ChevronRight,
  LayoutDashboard, 
  User, 
  Calendar,
  Plus,
  FileText
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { useOrganization } from "@/components/providers/organization-provider"

export default function StudentPayments() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <StudentPaymentsContent />
    </Suspense>
  )
}

function StudentPaymentsContent() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const { businessModel, niche } = useOrganization()
  const searchParams = useSearchParams()
  
  // Nichos que usam Ordens de Serviço (OS)
  const isServiceOrderBased = ['auto_detail', 'mechanic', 'tech_repair', 'plumbing', 'electrician', 
    'construction', 'landscaping', 'tailoring', 'cleaning', 'car_wash', 
    'party_venue', 'logistics', 'dentist', 'clinic', 'beauty', 'aesthetics', 
    'spa', 'physio', 'nutrition', 'podiatry', 'tanning', 'vet', 'clinic_vet', 
    'psychology', 'law', 'consulting', 'marketing_agency', 'dev_studio', 
    'interior_design', 'real_estate', 'insurance', 'travel_agency', 'coworking', 
    'tattoo', 'photographer', 'event_planning'].includes(niche)

  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [hasActiveMonthlyPlan, setHasActiveMonthlyPlan] = useState(false)
  const [creditUsage, setCreditUsage] = useState<any[]>([])
  const [totalPending, setTotalPendente] = useState(0)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("danceflow_user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setStudent(parsedUser)
      loadInvoices(parsedUser.id, parsedUser.studio_id)
      loadPackages(parsedUser.studio_id)
      loadStudentCredits(parsedUser.id, parsedUser.studio_id)
      loadCreditUsage(parsedUser.id, parsedUser.studio_id)
      checkMonthlyPlan(parsedUser.id, parsedUser.studio_id)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success) {
      toast({
        title: "Pagamento Concluído!",
        description: "Seu pagamento foi processado com sucesso. O status será atualizado em instantes.",
      })
    }

    if (canceled) {
      toast({
        title: "Pagamento Cancelado",
        description: "A operação de pagamento foi cancelada.",
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  const loadInvoices = async (studentId: string, studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('studio_id', studioId)
        .order('due_date', { ascending: false })

      if (error) throw error
      
      setInvoices(data || [])
      
      const pending = (data || [])
        .filter((inv: any) => inv.status === 'pending')
        .reduce((acc: number, inv: any) => acc + Number(inv.amount), 0)
      
      setTotalPendente(pending)
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
    }
  }

  const loadPackages = async (studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('lesson_packages')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .order('lessons_count', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error)
    }
  }

  const loadStudentCredits = async (studentId: string, studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_lesson_credits')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle()

      if (error) throw error
      setStudentCredits(data)
    } catch (error) {
      console.error('Erro ao carregar créditos:', error)
    }
  }

  const loadCreditUsage = async (studentId: string, studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_credit_usage')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setCreditUsage(data || [])
    } catch (error) {
      console.error('Erro ao carregar uso de créditos:', error)
    }
  }

  const checkMonthlyPlan = async (studentId: string, studioId: string) => {
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('studio_id', studioId)
        .eq('status', 'active')
        .limit(1)
      
      // Se estiver matriculado em alguma turma, consideramos que tem plano ativo
      setHasActiveMonthlyPlan(!!data && data.length > 0)
    } catch (e) {}
  }

  const handlePayment = async (invoice: any) => {
    // Permitir compra de créditos sempre
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount,
          description: invoice.description || `Mensalidade ${invoice.reference_month}`,
          studentId: student.id,
          studioId: student.studio_id,
          type: invoice.type || 'student_payment'
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error(data.error || 'Erro ao gerar checkout');
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível abrir o checkout do Stripe.",
        variant: "destructive"
      });
    }
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-50 border-b">
        <div className="container flex h-16 items-center px-4 gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => window.location.href='/student'}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Financeiro</h1>
        </div>
      </div>
      
      <main className="container p-4 space-y-6 max-w-md mx-auto">
        {businessModel === 'CREDIT' && studentCredits && (
          <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Créditos de {vocabulary.service}</p>
                  <h2 className="text-4xl font-black">{studentCredits.remaining_credits}</h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${(studentCredits.remaining_credits / studentCredits.total_credits) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] opacity-80 font-bold uppercase">
                  Válido até: {new Date(studentCredits.expiry_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {businessModel === 'CREDIT' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Comprar Pacote de Créditos</h3>
            <div className="grid grid-cols-1 gap-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="border-2 border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handlePayment({
                    id: pkg.id,
                    amount: pkg.price,
                    description: `Pacote: ${pkg.name} (${pkg.lessons_count} créditos)`,
                    type: 'package'
                  })}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.lessons_count} {vocabulary.service.toLowerCase()}s</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">R$ {Number(pkg.price).toFixed(2).replace('.', ',')}</p>
                      <p className="text-[10px] text-muted-foreground italic">~ R$ {(Number(pkg.price) / pkg.lessons_count).toFixed(2)}/{vocabulary.service.toLowerCase()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {businessModel === 'CREDIT' && creditUsage.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Uso de Créditos</h3>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {creditUsage.map((usage) => (
                    <div key={usage.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          usage.usage_type === 'refund' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{usage.notes || `${vocabulary.service} de ${new Date(usage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(usage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={usage.usage_type === 'refund' ? "default" : "secondary"} className={usage.usage_type === 'refund' ? "bg-emerald-500" : ""}>
                        {usage.usage_type === 'refund' ? '+1' : '-1'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-primary text-primary-foreground border-none shadow-lg">
          <CardContent className="p-6">
            <p className="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Total Pendente</p>
            <h2 className="text-3xl font-black mb-4">R$ {totalPending.toFixed(2).replace('.', ',')}</h2>
            {totalPending > 0 ? (
              <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span>Existem pendências</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tudo em dia!</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Histórico de Mensalidades</h3>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              Nenhuma fatura encontrada.
            </div>
          ) : invoices.map((invoice) => (
            <Card key={invoice.id} className="border-none shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {invoice.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {invoice.description || `Mensalidade ${invoice.reference_month}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.status === 'paid' 
                        ? `Pago em ${invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString('pt-BR') : '...'}` 
                        : `Vence em ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                
                  <div className="text-right">
                  <p className="font-black text-sm">R$ {Number(invoice.amount).toFixed(2).replace('.', ',')}</p>
                  {invoice.status === 'pending' ? (
                    <Button 
                      size="sm" 
                      className="h-7 px-3 text-[10px] font-bold mt-1 bg-indigo-600"
                      onClick={() => {
                        // Se for um pagamento vinculado a OS, mudamos o tipo para o checkout tratar corretamente
                        const paymentWithOS = invoice.service_order_id ? { ...invoice, type: 'service_order', id: invoice.service_order_id } : invoice;
                        setSelectedInvoice(paymentWithOS);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      PAGAR
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 uppercase font-bold mt-1">PAGO</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Meios de Pagamento</h3>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Cartão final **** 4242</span>
              </div>
              <Badge variant="outline" className="text-[10px]">PADRÃO</Badge>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full border-dashed border-slate-300 text-slate-500 text-xs">
            + Adicionar novo cartão
          </Button>
        </div>
      </main>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Efetuar Pagamento</DialogTitle>
            <DialogDescription>Escolha como deseja pagar a mensalidade de {selectedInvoice?.reference_month || selectedInvoice?.description}.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button variant="outline" className="w-full h-16 justify-between px-4 border-2 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              onClick={() => {
                toast({ title: "PIX Indisponível", description: "O pagamento via PIX está em manutenção. Use cartão de crédito.", variant: "warning" as any })
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900">Pagar com PIX</p>
                  <p className="text-xs text-slate-500">Aprovação instantânea</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
            </Button>

            <Button variant="outline" className="w-full h-16 justify-between px-4 border-2 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
              onClick={() => handlePayment(selectedInvoice)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900">Cartão de Crédito</p>
                  <p className="text-xs text-slate-500">Checkout Seguro via Stripe</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600" />
            </Button>
          </div>
          
          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50">
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student'}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </Button>
        
        {isServiceOrderBased ? (
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/os'}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Minhas OS</span>
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/classes'}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">{vocabulary.service}s</span>
          </Button>
        )}

        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href='/student/payments'}>
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">Pagar</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/profile'}>
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </nav>
    </div>
  )
}
