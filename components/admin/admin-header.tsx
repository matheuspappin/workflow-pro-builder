"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User, Globe, ExternalLink, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface AdminHeaderProps {
  title: string
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const router = useRouter()
  const [userName, setUserName] = useState("Admin")

  useEffect(() => {
    const user = localStorage.getItem("danceflow_user")
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || "Admin")
    }
  }, [])

  return (
    <header className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <h1 className="text-lg md:text-xl font-black tracking-tight text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar estúdio, usuário..."
            className="pl-9 bg-white/5 border border-white/10 h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white relative h-9 w-9">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full border-2 border-black" />
        </Button>

        <Link href="/" target="_blank" className="hidden sm:block">
          <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-2 border-white/20 hover:border-white/40 text-white/80 h-9">
            <Globe className="w-4 h-4" />
            Ver Landing Page
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 md:gap-3 pl-2 pr-1 hover:bg-white/5 rounded-full h-10">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-white leading-none">{userName}</p>
                <p className="text-xs text-white/50 mt-1 uppercase tracking-wider font-bold">Super Admin</p>
              </div>
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-white/10 text-white text-xs font-black">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-white/10 bg-black">
            <DropdownMenuLabel className="md:hidden">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-black leading-none text-white">{userName}</p>
                <p className="text-[10px] leading-none text-white/50 font-bold uppercase tracking-widest mt-1">Super Admin</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="md:hidden bg-white/10" />
            <DropdownMenuLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-3 py-2">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 mb-1" />
            <DropdownMenuItem 
              className="cursor-pointer focus:bg-white/10 focus:text-white rounded-xl px-3 py-2.5 transition-all text-white/80"
              onClick={() => router.push("/admin/settings?tab=profile")}
            >
              <User className="w-4 h-4 mr-3 text-white/50" /> 
              <span className="font-bold text-sm">Perfil Admin</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer focus:bg-white/10 focus:text-white rounded-xl px-3 py-2.5 transition-all text-white/80"
              onClick={() => router.push("/admin/settings?tab=system")}
            >
              <Settings className="w-4 h-4 mr-3 text-white/50" /> 
              <span className="font-bold text-sm">Configurações Globais</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-white/10" />
            <DropdownMenuItem 
              className="cursor-pointer text-white/80 focus:bg-white/10 focus:text-white rounded-xl px-3 py-2.5 transition-all" 
              onClick={async () => {
              try {
                await supabase.auth.signOut()
                await fetch('/api/auth/logout', { method: 'POST' })
              } catch (e) {}
              localStorage.removeItem("danceflow_user")
              localStorage.removeItem("workflow_pro_active_studio")
              window.location.href = "/login"
            }}>
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-bold text-sm">Sair do Painel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
