"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { FireExtinguisher, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { cn } from "@/lib/utils"

export function SimpleHeader() {
  const { niche } = useVocabulary()
  const isFire = niche === 'fire_protection'
  const router = useRouter()

  return (
    <header className="w-full border-b bg-white dark:bg-slate-900 p-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl">
            <FireExtinguisher className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            Portal Fire Control
          </span>
        </Link>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={async () => {
          await supabase.auth.signOut()
          try {
            await fetch('/api/auth/logout', { method: 'POST' })
          } catch (e) {}
          localStorage.removeItem("danceflow_user")
          localStorage.removeItem("workflow_pro_active_studio")
          window.location.href = "/login"
        }}
        className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
      >
        <LogOut className="w-4 h-4 mr-2"/> Sair
      </Button>
    </header>
  )
}
