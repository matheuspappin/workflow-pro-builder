"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Phone, MessageCircle, Send, Users, Bell, CheckCircle2, Zap, QrCode as QrCodeIcon, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ModuleGuard } from "@/components/providers/module-guard"

export default function WhatsAppPage() {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isFetchingQr, setIsFetchingQr] = useState(false)

  const getStudioId = () => {
    const raw = localStorage.getItem("danceflow_user")
    if (!raw) return null
    const user = JSON.parse(raw)
    return user?.studio_id || user?.studioId || null
  }

  const checkConnection = async () => {
    const studioId = getStudioId()
    if (!studioId) {
      setConnectionStatus('disconnected')
      return
    }
    try {
      const res = await fetch(`/api/whatsapp/connect?studioId=${studioId}`)
      const data = await res.json()
      if (data.data?.instance?.state === 'open' || data.data?.instance?.status === 'open') {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const fetchQrCode = async () => {
    const studioId = getStudioId()
    if (!studioId) {
      toast({ title: "Erro", description: "Estúdio não identificado. Faça login novamente.", variant: "destructive" })
      return
    }
    setIsFetchingQr(true)
    setQrCode(null)
    try {
      const pollQr = async (): Promise<boolean> => {
        const res = await fetch(`/api/whatsapp/connect?studioId=${studioId}`)
        const data = await res.json()
        if (data.success && data.data?.base64) {
          setQrCode(data.data.base64)
          setIsQrModalOpen(true)
          return true
        }
        if (data.data?.instance?.state === 'open' || data.data?.instance?.status === 'open') {
          setConnectionStatus('connected')
          toast({ title: "Conectado!", description: "Seu WhatsApp já está vinculado." })
          return true
        }
        return false
      }
      let attempts = 0
      const interval = setInterval(async () => {
        const finished = await pollQr()
        attempts++
        if (finished || attempts >= 30) {
          clearInterval(interval)
          setIsFetchingQr(false)
          if (!finished) {
            toast({ title: "QR Code não gerado", description: "Verifique se a Evolution API está rodando.", variant: "destructive" })
          }
        }
      }, 3000)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível obter o QR Code.", variant: "destructive" })
      setIsFetchingQr(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <ModuleGuard module="whatsapp" showFullError>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Phone className="w-6 h-6 text-emerald-500" />
          WhatsApp
        </h1>
        <p className="text-slate-500 text-sm mt-1">Comunicação automática com alunos e responsáveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { icon: Bell, title: "Avisos de Falta", desc: "Notificação automática para responsáveis quando o aluno não comparecer.", color: "text-amber-500 bg-amber-100 dark:bg-amber-600/20", status: "Automático", statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
          { icon: Send, title: "Cobranças de Mensalidade", desc: "Lembrete automático antes e após vencimento da mensalidade.", color: "text-violet-500 bg-violet-100 dark:bg-violet-600/20", status: "Automático", statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
          { icon: MessageCircle, title: "Comunicados do Estúdio", desc: "Envie avisos de reposições, recitais e feriados para todos.", color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-600/20", status: "Manual", statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
          { icon: Users, title: "Boas-vindas Automáticas", desc: "Mensagem de boas-vindas para novos alunos matriculados.", color: "text-pink-500 bg-pink-100 dark:bg-pink-600/20", status: "Automático", statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
          { icon: CheckCircle2, title: "Confirmação de Aula", desc: "Lembrete 24h antes da aula para reduzir faltas.", color: "text-teal-500 bg-teal-100 dark:bg-teal-600/20", status: "Automático", statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
          { icon: Zap, title: "Campanhas Personalizadas", desc: "Crie disparos customizados para segmentos de alunos.", color: "text-orange-500 bg-orange-100 dark:bg-orange-600/20", status: "Em breve", statusColor: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
        ].map((item) => (
          <Card key={item.title} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-emerald-900 to-teal-900 border-0 text-white overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black mb-2">Conectar WhatsApp</h3>
            <p className="text-emerald-200 text-sm max-w-sm mb-2">
              Escaneie o QR Code para vincular seu número e ativar a Catarina IA + todos os envios automáticos.
            </p>
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-emerald-200 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Conectado</span>
              </div>
            )}
          </div>
          <Button
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-black rounded-xl px-8 h-12 shadow-lg"
            onClick={fetchQrCode}
            disabled={isFetchingQr}
          >
            {isFetchingQr ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <QrCodeIcon className="w-5 h-5 mr-2" />
            )}
            {connectionStatus === 'connected' ? 'Reconectar' : 'Conectar Agora'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no celular → Menu (⋮) → Aparelhos conectados → Conectar um aparelho
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCode ? (
              <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 object-contain bg-white p-2 rounded-lg" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                <RefreshCw className="w-12 h-12 animate-spin text-slate-400" />
              </div>
            )}
            <p className="text-xs text-slate-500 text-center">
              O QR Code atualiza automaticamente. Mantenha esta janela aberta até escanear.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleGuard>
  )
}
