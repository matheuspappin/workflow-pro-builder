"use client"

import { useEffect, useState } from "react"
import { Bell, Search, User, Settings, UserCircle, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

import { useOrganization } from "@/components/providers/organization-provider"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { getLoginUrlForNiche } from "@/config/portal-routes"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

interface UserData {
  name: string
  email: string
  studioName: string
}

export function Header({ title, children }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { language, vocabulary, studios, studioId, switchStudio, t, niche } = useOrganization()

  const isDanceStudio = pathname?.startsWith("/solutions/estudio-de-danca")
  const settingsHref = isDanceStudio
    ? "/solutions/estudio-de-danca/dashboard/configuracoes"
    : "/dashboard/configuracoes"
  const profileHref = isDanceStudio
    ? "/solutions/estudio-de-danca/dashboard/configuracoes"
    : "/dashboard/configuracoes"
  const [user, setUser] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("danceflow_user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      loadNotifications(parsedUser.id, parsedUser.studio_id || parsedUser.studioId)
    }
  }, [])

  const loadNotifications = async (userId: string, studioId: string) => {
    if (!userId || !studioId) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setNotifications(data || [])
    } catch (e) {
      console.error('Erro ao carregar notificações:', e)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error('Erro ao marcar como lida:', e)
    }
  }

  const handleLogout = async () => {
    const loginUrl = getLoginUrlForNiche(niche)
    try {
      await supabase.auth.signOut()
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Erro ao realizar logout:', e)
    }
    localStorage.removeItem("danceflow_user")
    localStorage.removeItem("workflow_pro_active_studio")
    window.location.href = loginUrl
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
        {children}

        {studios.length > 1 && (
          <div className="hidden lg:block ml-4">
            <Select value={studioId || ""} onValueChange={switchStudio}>
              <SelectTrigger className="h-9 w-[220px] bg-white/5 border-white/10 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-red-500 shrink-0" />
                  <SelectValue placeholder="Selecionar Unidade" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id} className="hover:bg-red-600 focus:bg-red-600">
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder={t.common.searchPlaceholder}
            className="w-64 pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-red-500/50"
          />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher variant="ghost" showIcon={true} className="hidden md:flex text-slate-400 hover:text-white hover:bg-white/10" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs border-none">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-white/10 text-white">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
               <span className="font-bold text-sm uppercase tracking-widest text-slate-400">{t.common.notifications}</span>
               {unreadCount > 0 && <Badge className="bg-red-600 text-white border-none text-[10px]">{unreadCount} {t.common.newNotifications}</Badge>}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">{t.common.loading}</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex flex-col items-start gap-1 p-4 cursor-default border-b border-white/5 last:border-0 hover:bg-white/5 focus:bg-white/5"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      )}
                      <span className={`text-sm font-bold truncate ${!notification.is_read ? 'text-white' : 'text-slate-500'}`}>
                        {notification.title}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 pl-4">
                      {notification.message}
                    </p>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                   {t.common.noNotifications}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 border-t border-white/10">
                 <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-white/5">{t.dashboard.viewAll}</Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/5 group">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-white leading-none">{user?.name || t.common.user}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{user?.studioName || vocabulary.establishment}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-white">
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.common.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => router.push(profileHref)} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
              <UserCircle className="w-4 h-4 mr-2 text-red-500" />
              {t.common.adminProfile}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(settingsHref)} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
              <Settings className="w-4 h-4 mr-2 text-red-500" />
              {t.common.systemSettings}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer font-bold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.sidebar.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
