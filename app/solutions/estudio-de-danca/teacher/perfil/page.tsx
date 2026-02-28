"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCircle, Mail, Phone, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TeacherPerfilPage() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setForm({
        name: user?.user_metadata?.name || "",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || "",
      })
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { name: form.name, phone: form.phone } })
      toast({ title: "Perfil atualizado!" })
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-pink-600" />
          Meu Perfil
        </h1>
        <p className="text-slate-500 text-sm mt-1">Seus dados profissionais</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-pink-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-pink-600/20">
          {form.name?.[0]?.toUpperCase() || "P"}
        </div>
        <div>
          <p className="font-black text-slate-900 dark:text-white text-lg">{form.name || "Professor"}</p>
          <p className="text-sm text-slate-500">{form.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-600/20 text-pink-700 dark:text-pink-400 text-[10px] font-black uppercase tracking-widest">
            Professor
          </span>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Dados Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome Completo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" /> E-mail
            </Label>
            <Input
              value={form.email}
              disabled
              className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11 opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3" /> WhatsApp
            </Label>
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
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl w-full h-11"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
