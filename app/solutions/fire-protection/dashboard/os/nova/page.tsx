"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList, ArrowLeft, Wrench, Building2, Users,
  Calendar, AlertCircle, Loader2, CheckCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Customer { id: string; name: string; phone?: string }
interface Professional { id: string; name: string }

const TIPOS_OS = [
  "Recarga de Extintores",
  "Manutenção Preventiva",
  "Instalação de Detectores",
  "Manutenção de Hidrantes",
  "Instalação de Sprinklers",
  "Revisão de Alarmes",
  "Troca de Sinalização",
  "Laudo Técnico",
  "Outro",
]

const prioridadeConfig = [
  {
    value: "urgente",
    label: "Urgente",
    desc: "Risco imediato à segurança",
    color: "border-red-500 bg-red-50 dark:bg-red-600/10 text-red-700 dark:text-red-400",
    selected: "border-red-600 bg-red-600 text-white",
    icon: AlertCircle,
  },
  {
    value: "alta",
    label: "Alta",
    desc: "Requer atenção em breve",
    color: "border-orange-400 bg-orange-50 dark:bg-orange-600/10 text-orange-700 dark:text-orange-400",
    selected: "border-orange-500 bg-orange-500 text-white",
    icon: AlertCircle,
  },
  {
    value: "normal",
    label: "Normal",
    desc: "Sem urgência imediata",
    color: "border-slate-200 bg-white dark:bg-slate-900/50 dark:border-white/10 text-slate-700 dark:text-slate-300",
    selected: "border-slate-600 bg-slate-700 text-white",
    icon: CheckCircle,
  },
]

export default function NovaOSPage() {
  const router = useRouter()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Professional[]>([])
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    title: "",
    customer_id: "",
    professional_id: "",
    priority: "normal",
    scheduled_at: "",
    description: "",
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.user_metadata?.studio_id ?? null
      setStudioId(id)
      if (id) {
        Promise.all([
          fetch(`/api/fire-protection/customers?studioId=${id}`).then((r) => r.json()),
          fetch(`/api/fire-protection/technicians?studioId=${id}`).then((r) => r.json()),
        ]).then(([c, t]) => {
          setCustomers(Array.isArray(c) ? c : [])
          setTechnicians(Array.isArray(t) ? t : [])
          setLoadingData(false)
        }).catch(() => setLoadingData(false))
      } else {
        setLoadingData(false)
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!form.title || !studioId) return
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio_id: studioId, ...form, project_type: "common" }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/solutions/fire-protection/dashboard/os")
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">OS Criada!</h2>
        <p className="text-slate-500 dark:text-slate-400">Redirecionando para a lista de OS...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/solutions/fire-protection/dashboard/os">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-red-600" />
            Nova Ordem de Serviço
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Preencha os dados para abrir uma nova OS
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-600" />
            Dados do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tipo de Serviço */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tipo de Serviço <span className="text-red-500">*</span>
            </Label>
            <Select value={form.title} onValueChange={(v) => setForm({ ...form, title: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecionar o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Cliente / Edificação
            </Label>
            {loadingData ? (
              <div className="mt-1.5 h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            ) : customers.length === 0 ? (
              <div className="mt-1.5 p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-sm text-slate-400 text-center">
                Nenhum cliente cadastrado.{" "}
                <Link href="/solutions/fire-protection/dashboard/clientes" className="text-red-600 hover:underline font-bold">
                  Cadastrar cliente
                </Link>
              </div>
            ) : (
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecionar cliente ou edificação" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Técnico Responsável */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Técnico Responsável
            </Label>
            {loadingData ? (
              <div className="mt-1.5 h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            ) : (
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecionar técnico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Data Agendada */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Data Agendada
            </Label>
            <Input
              type="datetime-local"
              className="mt-1.5"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Descrição do Serviço
            </Label>
            <Textarea
              placeholder="Descreva detalhes do serviço a ser realizado, equipamentos envolvidos, localização específica..."
              className="mt-1.5"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prioridade */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {prioridadeConfig.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, priority: p.value })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-medium text-sm",
                  form.priority === p.value ? p.selected : p.color
                )}
              >
                <p.icon className="w-5 h-5" />
                <span className="font-bold">{p.label}</span>
                <span className={cn(
                  "text-[10px] text-center leading-tight",
                  form.priority === p.value ? "text-white/80" : "opacity-60"
                )}>
                  {p.desc}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 pb-8">
        <Link href="/solutions/fire-protection/dashboard/os" className="flex-1">
          <Button variant="outline" className="w-full h-12 font-bold rounded-xl">
            Cancelar
          </Button>
        </Link>
        <Button
          className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20"
          onClick={handleSubmit}
          disabled={loading || !form.title}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Criando OS...
            </>
          ) : (
            <>
              <ClipboardList className="w-4 h-4 mr-2" />
              Abrir Ordem de Serviço
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
