"use client"

import { Bell, User, LogOut, LayoutDashboard, Calendar, Users, DollarSign, Settings, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

import { useVocabulary } from "@/hooks/use-vocabulary"

interface TechnicianHeaderProps {
  technician: any
}

export function TechnicianHeader({ technician }: TechnicianHeaderProps) {
  const router = useRouter()
  const { vocabulary } = useVocabulary()
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    localStorage.removeItem("danceflow_user")
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-indigo-100 shadow-sm">
            <AvatarImage src={technician?.avatar} alt={technician?.name} />
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-black text-xs">
              {technician?.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-tight tracking-tight">{technician?.name?.split(' ')[0]}</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
              Técnico de Campo
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-100 dark:border-slate-800 pl-4">
            <Link href="/technician">
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs font-bold text-slate-600">
                <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" /> Dashboard
              </Button>
            </Link>
            <Link href="/technician/scanner">
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs font-bold text-slate-600">
                <QrCode className="h-3.5 w-3.5 text-indigo-600" /> Scanner
              </Button>
            </Link>
            <Link href="/technician/os-list">
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs font-bold text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" /> OSs
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem onClick={() => router.push("/technician/perfil")} className="gap-2 cursor-pointer font-bold text-sm">
                <User className="h-4 w-4 text-indigo-600" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer font-bold text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                <LogOut className="h-4 w-4" /> Sair do App
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
