"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Mail, Phone, MapPin } from "lucide-react"

export default function FireClientPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetch("/api/fire-protection/client/dashboard", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (!d.error && d.student) setStudent(d.student)
        })
        .finally(() => setLoading(false))
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Meu Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Seus dados cadastrais
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {student ? (
            <>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Nome</p>
                  <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                </div>
              </div>
              {student.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">E-mail</p>
                    <p className="font-medium text-slate-900 dark:text-white">{student.email}</p>
                  </div>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Telefone</p>
                    <p className="font-medium text-slate-900 dark:text-white">{student.phone}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500">Carregando dados...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
