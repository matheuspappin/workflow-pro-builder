"use client"

import { useEffect, useState } from "react"
import { Bell, Search, User, Settings, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const { language } = useOrganization()
  const [user, setUser] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  const t = {
    searchPlaceholder: language === 'pt' ? "Buscar alunos, turmas..." : "Search students, classes...",
    notifications: language === 'pt' ? "Notificações" : "Notifications",
    newNotifications: language === 'pt' ? "novas" : "new",
    loading: language === 'pt' ? "Carregando..." : "Loading...",
    noNotifications: language === 'pt' ? "Nenhuma notificação por aqui." : "No notifications here.",
    viewAll: language === 'pt' ? "Ver Todas" : "View All",
    myAccount: language === 'pt' ? "Minha Conta" : "My Account",
    adminProfile: language === 'pt' ? "Perfil Admin" : "Admin Profile",
    systemSettings: language === 'pt' ? "Configurações do Sistema" : "System Settings",
    logout: language === 'pt' ? "Sair" : "Logout",
    dashboard: language === 'pt' ? "Dashboard" : "Dashboard"
  }

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
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Erro ao limpar cookie de sessão:', e)
    }
    localStorage.removeItem("danceflow_user")
    window.location.href = "/login"
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-card-foreground">{title === 'Dashboard' ? t.dashboard : title}</h1>
        {children}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="w-64 pl-9 bg-background"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-4 border-b border-border">
               <span className="font-bold text-sm">{t.notifications}</span>
               {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} {t.newNotifications}</Badge>}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-4 text-center text-xs text-muted-foreground italic">{t.loading}</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex flex-col items-start gap-1 p-4 cursor-default border-b border-border/50 last:border-0 hover:bg-muted/50"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className={`text-sm font-bold truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-4">
                      {notification.message}
                    </p>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                   {t.noNotifications}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 border-t border-border">
                 <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.viewAll}</Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{user?.name || (language === 'pt' ? "Usuário" : "User")}</p>
                <p className="text-xs text-muted-foreground">{user?.studioName || "Studio"}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/configuracoes")}>
              <UserCircle className="w-4 h-4 mr-2" />
              {t.adminProfile}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/configuracoes?tab=estudio")}>
              <Settings className="w-4 h-4 mr-2" />
              {t.systemSettings}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              {t.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
