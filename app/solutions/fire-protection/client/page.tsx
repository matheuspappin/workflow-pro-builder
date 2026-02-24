"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FireExtinguisher,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  Phone,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function FireClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [solicitarOpen, setSolicitarOpen] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [tipo, setTipo] = useState("vistoria")
  const [descricao, setDescricao] = useState("")
  const [prioridade, setPrioridade] = useState("normal")
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    fetch("/api/fire-protection/client/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
      })
      .catch(() => {})
  }, [user])

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSolicitando(true)
    try {
      const res = await fetch("/api/fire-protection/client/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tipo, descricao, prioridade }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({
          title: "Solicitação enviada!",
          description: json.message,
        })
        setSolicitarOpen(false)
        setDescricao("")
        if (data) {
          fetch("/api/fire-protection/client/dashboard", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => !d.error && setData(d))
            .catch(() => {})
        }
      } else {
        toast({
          title: "Erro",
          description: json.error || "Não foi possível enviar a solicitação.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação.",
        variant: "destructive",
      })
    } finally {
      setSolicitando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  const stats = data?.stats || { ativos: 0, aVencer: 0, vencidos: 0, concluidas: 0 }
  const assets = data?.assets || []
  const studioPhone = data?.studioContact?.phone

  const statusItems = [
    {
      label: "Extintores Ativos",
      value: stats.ativos,
      icon: Package,
      status: "ok",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-600/10",
      border: "border-l-emerald-500",
    },
    {
      label: "A Vencer (30d)",
      value: stats.aVencer,
      icon: Clock,
      status: "warn",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-600/10",
      border: "border-l-amber-500",
    },
    {
      label: "Vencidos",
      value: stats.vencidos,
      icon: AlertTriangle,
      status: "danger",
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-600/10",
      border: "border-l-rose-600",
    },
    {
      label: "Vistorias Concluídas",
      value: stats.concluidas,
      icon: CheckCircle,
      status: "ok",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-600/10",
      border: "border-l-blue-600",
    },
  ]

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Olá, {data?.student?.name || user?.user_metadata?.name || "Cliente"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Acompanhe o status da sua proteção contra incêndio
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {statusItems.map((item) => (
          <Card key={item.label} className={cn("border-l-4 bg-white dark:bg-slate-900/50 shadow-sm", item.border)}>
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", item.bg)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <p className={cn("text-2xl font-black", item.color)}>{item.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5 leading-tight">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extintores */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            Meus Extintores
          </CardTitle>
          <Link href="/solutions/fire-protection/client/extintores">
            <Button variant="ghost" size="sm" className="text-red-600 font-bold text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {assets.length > 0 ? (
            <ul className="space-y-2">
              {assets.slice(0, 3).map((a: any) => (
                <li key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <span className="font-medium text-slate-900 dark:text-white">{a.name}</span>
                  <span className={cn(
                    "text-xs font-bold",
                    a.status === "expired" ? "text-rose-600" : a.status === "warning" ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {a.expiration_date ? new Date(a.expiration_date).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum extintor cadastrado</p>
              <p className="text-sm mt-1">Seus extintores registrados aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Documentos & Laudos
          </CardTitle>
          <Link href="/solutions/fire-protection/client/documentos">
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum documento disponível</p>
            <p className="text-sm mt-1">Laudos e relatórios serão exibidos aqui.</p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact / Acionar Empresa */}
      <Card
        className="bg-gradient-to-r from-red-600 to-red-700 text-white border-none shadow-xl cursor-pointer transition-opacity hover:opacity-95"
        onClick={() => setSolicitarOpen(true)}
      >
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-base">Solicitar Suporte / Acionar Empresa</p>
              <p className="text-red-100 text-sm">Solicite vistoria, manutenção ou entre em contato</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studioPhone && (
              <a
                href={`https://wa.me/55${studioPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
            <FireExtinguisher className="w-8 h-8 opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* Dialog Solicitar */}
      <Dialog open={solicitarOpen} onOpenChange={setSolicitarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-600" />
              Acionar a Empresa
            </DialogTitle>
            <DialogDescription>
              Solicite uma vistoria, manutenção ou descreva sua necessidade. Nossa equipe entrará em contato em breve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSolicitar} className="space-y-4">
            <div>
              <Label>Tipo de solicitação</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vistoria">Solicitar Vistoria</SelectItem>
                  <SelectItem value="suporte">Suporte / Dúvida</SelectItem>
                  <SelectItem value="manutencao">Manutenção / Recarga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descreva sua necessidade, localização dos equipamentos ou qualquer informação relevante..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1 min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSolicitarOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={solicitando}
              >
                {solicitando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enviar Solicitação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
