"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, CreditCard, MessageCircle, LogOut } from "lucide-react"
import Link from "next/link"

export default function SubscriptionExpiredPage() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem("danceflow_user")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden">
        <div className="h-2 bg-red-500 w-full" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Assinatura Expirada</CardTitle>
          <CardDescription className="text-slate-500">
            O acesso ao painel do seu estúdio foi temporariamente suspenso por falta de pagamento ou fim do período de teste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Para recuperar o acesso e manter seus dados salvos, escolha uma opção:
            </p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 h-12">
              <CreditCard className="w-5 h-5" /> Renovar Assinatura agora
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12 border-slate-200">
              <MessageCircle className="w-5 h-5 text-emerald-500" /> Falar com Suporte
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">Ou</p>
            <button 
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair da conta
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
