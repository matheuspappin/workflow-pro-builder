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
  Calendar, ArrowLeft, Building2, Users, ClipboardCheck,
  Loader2, CheckCircle, ShieldCheck, Info,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Customer { id: string; name: string; phone?: string }
interface Professional { id: string; name: string }

const TIPOS_VISTORIA = [
  { value: "Anual — AVCB", desc: "Vistoria anual para emissão/renovação do AVCB" },
  { value: "Preventiva Semestral", desc: "Inspeção periódica semestral de conformidade" },
  { value: "Rotineira", desc: "Verificação de rotina dos sistemas de proteção" },
  { value: "Urgente — Hidrantes", desc: "Inspeção urgente do sistema de hidrantes" },
  { value: "Urgente — Extintores", desc: "Verificação urgente dos extintores" },
  { value: "Recarga Periódica", desc: "Vistoria durante processo de recarga" },
  { value: "Laudo de Conformidade", desc: "Emissão de laudo técnico de conformidade" },
  { value: "Pré-vistoria AVCB", desc: "Preparação para vistoria do Corpo de Bombeiros" },
]

const CHECKLIST_PADRAO = [
  "Extintores com validade e carga corretos",
  "Sinalização de emergência visível e adequada",
  "Saídas de emergência desobstruídas",
  "Iluminação de emergência funcionando",
  "Hidrantes e mangueiras em bom estado",
  "Detectores de fumaça operacionais",
  "Alarmes de incêndio testados",
  "Sprinklers sem obstruções",
  "Rotas de fuga sinalizadas e livres",
  "Documentação técnica atualizada",
  "Brigada de incêndio treinada",
  "AVCB ou CLCB válido",
]

export default function NovaVistoriaPage() {
  const router = useRouter()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Professional[]>([])
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    vistoria_type: "",
    customer_id: "",
    professional_id: "",
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
    if (!form.vistoria_type || !studioId) return
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/vistorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio_id: studioId, ...form, with_checklist: true }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/solutions/fire-protection/dashboard/vistorias")
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const tipoSelecionado = TIPOS_VISTORIA.find((t) => t.value === form.vistoria_type)

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Vistoria Agendada!</h2>
        <p className="text-slate-500 dark:text-slate-400">Redirecionando para a lista de vistorias...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/solutions/fire-protection/dashboard/vistorias">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-600" />
            Agendar Vistoria
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Preencha os dados para agendar uma nova vistoria
          </p>
        </div>
      </div>

      {/* Tipo de Vistoria */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            Tipo de Vistoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIPOS_VISTORIA.map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setForm({ ...form, vistoria_type: tipo.value })}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left",
                  form.vistoria_type === tipo.value
                    ? "border-red-600 bg-red-50 dark:bg-red-600/10"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                <span className={cn(
                  "text-sm font-bold",
                  form.vistoria_type === tipo.value
                    ? "text-red-700 dark:text-red-400"
                    : "text-slate-800 dark:text-slate-200"
                )}>
                  {tipo.value}
                </span>
                <span className={cn(
                  "text-[11px] leading-tight",
                  form.vistoria_type === tipo.value
                    ? "text-red-600/70 dark:text-red-400/70"
                    : "text-slate-400"
                )}>
                  {tipo.desc}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detalhes */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-red-600" />
            Detalhes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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

          {/* Técnico */}
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

          {/* Data e Hora */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Data e Hora da Vistoria <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              className="mt-1.5"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>

          {/* Observações */}
          <div>
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Observações
            </Label>
            <Textarea
              placeholder="Requisitos especiais, pontos de atenção, acesso ao local, contato no local..."
              className="mt-1.5"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist automático */}
      <Card className="bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-600/30 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                Checklist padrão será criado automaticamente ({CHECKLIST_PADRAO.length} itens)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {CHECKLIST_PADRAO.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 pb-8">
        <Link href="/solutions/fire-protection/dashboard/vistorias" className="flex-1">
          <Button variant="outline" className="w-full h-12 font-bold rounded-xl">
            Cancelar
          </Button>
        </Link>
        <Button
          className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20"
          onClick={handleSubmit}
          disabled={loading || !form.vistoria_type}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Agendando...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Vistoria
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
