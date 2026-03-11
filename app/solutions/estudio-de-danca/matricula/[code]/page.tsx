"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Music, User, Mail, Phone, Loader2, CheckCircle2, ArrowRight, Sparkles, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"

const MODALITIES = [
  "Ballet Clássico", "Jazz", "Contemporâneo", "Hip Hop",
  "Forró", "Zouk", "Salsa", "Dança do Ventre", "Sapateado", "Outro",
]

type Stage = "loading" | "invalid" | "form" | "success"

export default function MatriculaPublicPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string)?.toUpperCase()

  const [stage, setStage] = useState<Stage>("loading")
  const [studioName, setStudioName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", modality: "" })
  const [leadName, setLeadName] = useState("")

  useEffect(() => {
    if (!code) { setStage("invalid"); return }
    fetch(`/api/dance-studio/matricula?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.studio_name) { setStudioName(data.studio_name); setStage("form") }
        else setStage("invalid")
      })
      .catch(() => setStage("invalid"))
  }, [code])

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "")
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/dance-studio/matricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...form }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setLeadName(form.name.split(" ")[0])
        setStage("success")
      }
    } catch { /* ignorar */ } finally {
      setSubmitting(false)
    }
  }

  const registerUrl = `/solutions/estudio-de-danca/register?role=student&code=${code}`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/3 -left-1/3 w-[80vw] h-[80vw] rounded-full bg-violet-600"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-1/3 -right-1/3 w-[70vw] h-[70vw] rounded-full bg-pink-600"
        />
      </div>

      <AnimatePresence mode="wait">
        {stage === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-white">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Carregando informações do estúdio...</p>
          </motion.div>
        )}

        {stage === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-sm w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Music className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white mb-2">Link Inválido</h1>
              <p className="text-slate-400 text-sm">Este link de convite é inválido ou expirou. Peça ao seu estúdio um novo link.</p>
            </div>
          </motion.div>
        )}

        {stage === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-6 relative z-10">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto shadow-2xl shadow-violet-600/40">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-violet-400 text-xs font-black uppercase tracking-widest mb-1">Pré-Matrícula</p>
                <h1 className="text-3xl font-black text-white tracking-tight">{studioName}</h1>
                <p className="text-slate-400 text-sm mt-1">Preencha seus dados e aguarde o contato do estúdio.</p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nome Completo *
                  </Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="bg-slate-800/60 border-white/8 text-white h-12 rounded-xl placeholder:text-slate-500 focus:border-violet-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> E-mail
                  </Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="bg-slate-800/60 border-white/8 text-white h-12 rounded-xl placeholder:text-slate-500 focus:border-violet-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                    className="bg-slate-800/60 border-white/8 text-white h-12 rounded-xl placeholder:text-slate-500 focus:border-violet-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Modalidade de Interesse
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {MODALITIES.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, modality: f.modality === m ? "" : m }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                          form.modality === m
                            ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20"
                            : "bg-slate-800/60 border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-14 rounded-2xl text-base shadow-xl shadow-violet-600/25 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {submitting
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enviando...</>
                    : <><Sparkles className="w-5 h-5 mr-2" />Quero me Matricular</>
                  }
                </Button>
              </form>
            </div>

            {/* Already have account? */}
            <p className="text-center text-sm text-slate-500">
              Já tem conta no DanceFlow?{" "}
              <Link href={registerUrl} className="text-violet-400 hover:text-violet-300 font-bold underline underline-offset-4">
                Entrar com login
              </Link>
            </p>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6 relative z-10">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white">
                Incrível, {leadName}! 🎉
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sua solicitação foi enviada para <strong className="text-white">{studioName}</strong>.
                Em breve eles entrarão em contato.
              </p>
            </div>

            {/* Próximo passo */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Próximo Passo</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Crie sua conta de aluno para acessar o <strong className="text-white">Portal do Aluno</strong>,
                ver sua agenda de aulas e gerenciar suas mensalidades.
              </p>
              <Link href={registerUrl}>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-12 rounded-2xl shadow-lg shadow-violet-600/25 hover:scale-[1.01] transition-all">
                  Criar Minha Conta Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
