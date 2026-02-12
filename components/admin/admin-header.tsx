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
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar estúdio, usuário..."
            className="pl-9 bg-slate-100 dark:bg-slate-900 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-600 relative h-9 w-9">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
        </Button>

        <Link href="/" target="_blank" className="hidden sm:block">
          <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-2 border-slate-200 dark:border-slate-800 h-9">
            <Globe className="w-4 h-4" />
            Ver Landing Page
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 md:gap-3 pl-2 pr-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full h-10">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-none">{userName}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Super Admin</p>
              </div>
              <Avatar className="w-8 h-8 border border-indigo-100 dark:border-indigo-900">
                <AvatarImage src="" />
                <AvatarFallback className="bg-indigo-600 text-white text-xs">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <DropdownMenuLabel className="md:hidden">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-black leading-none text-slate-900 dark:text-slate-50">{userName}</p>
                <p className="text-[10px] leading-none text-indigo-500 font-bold uppercase tracking-widest mt-1">Super Admin</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="md:hidden bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-900 mb-1" />
            <DropdownMenuItem 
              className="cursor-pointer focus:bg-indigo-50 dark:focus:bg-indigo-900/50 focus:text-indigo-600 dark:focus:text-indigo-400 rounded-xl px-3 py-2.5 transition-all"
              onClick={() => router.push("/admin/settings?tab=profile")}
            >
              <User className="w-4 h-4 mr-3 text-slate-400" /> 
              <span className="font-bold text-sm">Perfil Admin</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer focus:bg-indigo-50 dark:focus:bg-indigo-900/50 focus:text-indigo-600 dark:focus:text-indigo-400 rounded-xl px-3 py-2.5 transition-all"
              onClick={() => router.push("/admin/settings?tab=system")}
            >
              <Settings className="w-4 h-4 mr-3 text-slate-400" /> 
              <span className="font-bold text-sm">Configurações Globais</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-slate-50 dark:bg-slate-900" />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 rounded-xl px-3 py-2.5 transition-all" 
              onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' })
              } catch (e) {}
              localStorage.removeItem("danceflow_user")
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
