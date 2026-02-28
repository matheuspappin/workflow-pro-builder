"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, Lock, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ClientPerfilPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "")
        setName(user.user_metadata?.name || "")
        setPhone(user.user_metadata?.phone || "")
      }
    })
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { name, phone } })
      if (error) throw error
      const user = JSON.parse(localStorage.getItem("workflow_user") || "{}")
      localStorage.setItem("workflow_user", JSON.stringify({ ...user, name }))
      toast({ title: "Perfil atualizado!" })
    } catch (err: any) {
      toast({ title: "Erro ao salvar perfil", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" })
      return
    }
    setSavingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({ title: "Senha alterada com sucesso!" })
      setCurrentPassword("")
      setNewPassword("")
    } catch (err: any) {
      toast({ title: "Erro ao alterar senha", description: err.message, variant: "destructive" })
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Meu Perfil</h1>
        <p className="text-slate-400 mt-1">Gerencie seus dados pessoais e segurança</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" /> Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={email} disabled className="pl-10 bg-slate-800/50 border-slate-700 text-slate-500 rounded-xl cursor-not-allowed" />
              </div>
              <p className="text-xs text-slate-600">Email não pode ser alterado</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar Alterações</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" /> Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nova Senha</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-slate-800 border-slate-700 text-white rounded-xl" />
            </div>
            <Button type="submit" disabled={savingPass} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
