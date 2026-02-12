"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Loader2,
  QrCode
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

import { useVocabulary } from "@/hooks/use-vocabulary"

export default function TeacherFinanceiroPage() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [teacherData, setTeacherData] = useState<any>(null)
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSavingPix, setIsSavingPix] = useState(false)
  const [pixKey, setPixKey] = useState("")
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    paidAmount: 0
  })

  useEffect(() => {
    loadTeacherFinances()
  }, [])

  const loadTeacherFinances = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      // 1. Buscar dados do professor
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (teacher) {
        setTeacherData(teacher)
        setPixKey(teacher.pix_key || "")
        
        // 2. Buscar histórico financeiro
        const { data: financeRecords, error } = await supabase
          .from('teacher_finances')
          .select(`
            *,
            session:sessions(
              scheduled_date,
              class:classes(name)
            )
          `)
          .eq('teacher_id', teacher.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setFinances(financeRecords || [])

        // Calcular estatísticas
        const total = financeRecords?.reduce((sum, f) => sum + parseFloat(f.total_amount), 0) || 0
        const pending = financeRecords?.filter(f => f.payment_status === 'pending').reduce((sum, f) => sum + parseFloat(f.total_amount), 0) || 0
        const paid = financeRecords?.filter(f => f.payment_status === 'paid').reduce((sum, f) => sum + parseFloat(f.total_amount), 0) || 0

        setStats({
          totalEarned: total,
          pendingAmount: pending,
          paidAmount: paid
        })
      }
    } catch (error) {
      console.error('Erro ao carregar finanças do professor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePix = async () => {
    if (!teacherData?.id) return
    
    setIsSavingPix(true)
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ pix_key: pixKey })
        .eq('id', teacherData.id)

      if (error) throw error

      toast({
        title: "PIX Atualizado",
        description: "Sua chave PIX foi salva com sucesso."
      })
      
      setTeacherData({ ...teacherData, pix_key: pixKey })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSavingPix(false)
    }
  }

  if (loading) return null

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financeiro</h2>
        <p className="text-xs text-muted-foreground">Controle seus ganhos e recebimentos.</p>
      </div>

      {/* Stats - Scrollable on mobile */}
      <div className="flex overflow-x-auto pb-2 md:grid md:grid-cols-3 gap-4 snap-x hide-scrollbar">
        <Card className="min-w-[200px] flex-1 border-none shadow-sm bg-white dark:bg-slate-900 snap-start">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Recebido</p>
              <p className="text-lg font-black text-emerald-600 mt-1">R$ {stats.paidAmount.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[200px] flex-1 border-none shadow-sm bg-white dark:bg-slate-900 snap-start">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Pendente</p>
              <p className="text-lg font-black text-amber-600 mt-1">R$ {stats.pendingAmount.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[200px] flex-1 border-none shadow-sm bg-white dark:bg-slate-900 snap-start">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Total</p>
              <p className="text-lg font-black text-indigo-600 mt-1">R$ {stats.totalEarned.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PIX Management */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm h-fit bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                Meu PIX
              </CardTitle>
              <CardDescription className="text-xs">Para receber suas {vocabulary.service.toLowerCase()}s semanais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="pix" className="text-[10px] uppercase font-black text-muted-foreground">Chave PIX</Label>
                <div className="flex gap-2">
                  <Input 
                    id="pix"
                    placeholder="CPF ou Celular"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none h-10 text-sm"
                  />
                  <Button 
                    size="sm"
                    onClick={handleUpdatePix}
                    disabled={isSavingPix || pixKey === teacherData?.pix_key}
                    className="bg-indigo-600 hover:bg-indigo-700 h-10 font-bold"
                  >
                    {isSavingPix ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-800 dark:text-indigo-300 leading-normal">
                  Os pagamentos sao processados toda segunda-feira.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Histórico de Ganhos</h3>
          <div className="space-y-3">
            {finances.length > 0 ? (
              finances.map((record) => (
                <Card key={record.id} className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        record.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {record.payment_status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {record.session?.class?.name || `${vocabulary.service} Extra`}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                          {new Date(record.created_at).toLocaleDateString('pt-BR')} • {record.student_count} {vocabulary.client.toLowerCase()}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-slate-900 dark:text-white">R$ {parseFloat(record.total_amount).toLocaleString('pt-BR')}</p>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase h-4 px-1 mt-1 border-none",
                        record.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {record.payment_status === 'paid' ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed rounded-2xl border-slate-100 dark:border-slate-800">
                <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground text-xs italic">Nenhum registro ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
