"use client"

import { Bell, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface StudentHeaderProps {
  student: any
}

import { useVocabulary } from "@/hooks/use-vocabulary"

export function StudentHeader({ student }: StudentHeaderProps) {
  const router = useRouter()
  const { vocabulary } = useVocabulary()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (student?.id && student?.studio_id) {
      fetchNotifications()

      // Inscrição Realtime para notificações
      const channel = fetchNotificationsRealtime()
      
      return () => {
        if (channel) supabase.removeChannel(channel)
      }
    }
  }, [student])

  const fetchNotificationsRealtime = () => {
    return supabase
      .channel(`notifications-${student.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${student.id}`
      }, () => {
        fetchNotifications()
      })
      .subscribe()
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${student.id}&studioId=${student.studio_id}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, read: true })
      })
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Usar a mesma API para marcar todas (precisa de suporte no backend)
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: student.id, studioId: student.studio_id })
      })
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error("Erro ao realizar logout:", e)
    }
    localStorage.removeItem("danceflow_user")
    localStorage.removeItem("workflow_pro_active_studio")
    
    // Redireciona para o login específico do estúdio se possível
    if (student?.studioSlug) {
      window.location.href = `/s/${student.studioSlug}/login`
    } else {
      window.location.href = "/login"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarImage src={student?.avatar} alt={student?.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {student?.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none">{student?.name}</span>
            <span className="text-[10px] text-muted-foreground">{student?.studioName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-background">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    className="text-[10px] h-6 px-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAllAsRead()
                    }}
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação encontrada
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className={`font-bold text-sm ${!n.read ? 'text-primary' : ''}`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = "/student/profile"}>
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/student/payments"}>
                Financeiro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
