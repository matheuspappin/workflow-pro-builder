"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Building2, Phone, QrCode, Save, Loader2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracoesPage() {
  const [user, setUser] = useState<any>(null)
  const [studioData, setStudioData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studioSlug, setStudioSlug] = useState("")
  const [copiedSlug, setCopiedSlug] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const stored = localStorage.getItem("danceflow_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        setStudioSlug(parsed.studioSlug || parsed.studio_slug || "")
        setForm({
          name: parsed.studioName || parsed.name || "",
          email: user?.email || "",
          phone: parsed.phone || "",
        })
        setStudioData(parsed)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast({ title: "Configurações salvas!", description: "Dados do estúdio atualizados." })
    setSaving(false)
  }

  const copySlugLink = async () => {
    const link = `${window.location.origin}/s/${studioSlug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedSlug(true)
      toast({ title: "Link copiado!" })
      setTimeout(() => setCopiedSlug(false), 2000)
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" />
          Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie os dados do seu estúdio</p>
      </div>

      {/* Dados do Estúdio */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
            <Building2 className="w-5 h-5 text-violet-600" />
            Dados do Estúdio
          </CardTitle>
          <CardDescription>Informações públicas e de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome do Estúdio</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">E-mail de Contato</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WhatsApp</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl w-full h-11"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Link do Estúdio */}
      {studioSlug && (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Link do Estúdio
            </CardTitle>
            <CardDescription>Compartilhe com seus alunos e professores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <code className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-mono truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/s/${studioSlug}` : `/s/${studioSlug}`}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copySlugLink}
                className="flex-shrink-0 text-violet-600 hover:text-violet-700"
              >
                {copiedSlug ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Alunos e professores usam este link para se cadastrar e acessar o portal.
            </p>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
            <Phone className="w-5 h-5 text-emerald-600" />
            Integração WhatsApp
          </CardTitle>
          <CardDescription>Conecte seu WhatsApp para envios automáticos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm">Status da Conexão</p>
              <p className="text-xs text-slate-500 mt-0.5">WhatsApp não conectado</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">
              <QrCode className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
