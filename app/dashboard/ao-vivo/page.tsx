"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Clock, 
  PlayCircle, 
  UserCheck, 
  UserPlus, 
  RefreshCw,
  Video,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Phone
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function LiveClassesPage() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [loading, setLoading] = useState(true)
  const [liveData, setLiveData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchLiveClasses = async () => {
    setLoading(true)
    try {
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) {
        setLoading(false)
        return
      }
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      if (!studioId) {
        console.error("❌ Studio ID não encontrado no localStorage")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/dashboard/live-classes?studioId=${studioId}`)
      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || `Erro HTTP: ${response.status}`)
      }
      
      setLiveData(data)
      setLastUpdate(new Date())
    } catch (error: any) {
      console.error("❌ Erro ao buscar aulas ao vivo:", error)
      toast({
        title: "Erro ao carregar aulas",
        description: error.message || "Verifique sua conexão ou se a chave de administrador está configurada.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveClasses()
    // Auto-update every 2 minutes
    const interval = setInterval(fetchLiveClasses, 120000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ModuleGuard module="classes" showFullError>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header title={`${vocabulary.services} ao Vivo`} />
        
        <main className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center animate-pulse">
                <Video className="w-6 h-6 text-white" />
              </div>
              {vocabulary.services} Acontecendo Agora
            </h2>
            <p className="text-slate-500 mt-1">Monitore quem está no {vocabulary.establishment.toLowerCase()} em tempo real.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400 font-medium">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLiveClasses} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {loading && !liveData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-[400px] border-none shadow-sm" />
            ))}
          </div>
        ) : liveData?.classes?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveData.classes.map((cls: any) => (
              <Card key={cls.id} className="border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
                <CardHeader className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-rose-500 border-none text-[10px] animate-pulse">AO VIVO</Badge>
                    <div className="flex items-center gap-1 text-sm font-bold bg-black/20 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {cls.startTime} - {cls.endTime}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black">{cls.name}</CardTitle>
                  <CardDescription className="text-indigo-100 font-medium flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    {cls.style} • {cls.level}
                  </CardDescription>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      {cls.teacher?.[0] || vocabulary.provider[0]}
                    </div>
                    <span className="text-sm font-bold">{cls.teacher || vocabulary.provider}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {vocabulary.clients} na {vocabulary.service}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {cls.presentCount} / {cls.totalStudents} PRESENTES
                    </Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-3">
                    {cls.students.map((student: any) => (
                      <div 
                        key={student.id} 
                        className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-slate-100 dark:border-slate-800">
                            <AvatarImage src={student.photo} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              {student.status === 'present' ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                  <UserCheck className="w-3 h-3" />
                                  Check-in às {new Date(student.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                  <Clock className="w-3 h-3" />
                                  Aguardando entrada...
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => {
                                if (student.phone) {
                                  const cleanPhone = student.phone.replace(/\D/g, '')
                                  const whatsappUrl = cleanPhone.startsWith('55') 
                                    ? `https://wa.me/${cleanPhone}` 
                                    : `https://wa.me/55${cleanPhone}`
                                  window.open(whatsappUrl, '_blank')
                                } else {
                                  toast({
                                    title: "Telefone não encontrado",
                                    description: `Este ${vocabulary.client.toLowerCase()} não possui um número de telefone cadastrado.`,
                                    variant: "destructive"
                                  })
                                }
                              }}
                            >
                              <Phone className="w-4 h-4" /> WhatsApp
                            </DropdownMenuItem>
                            <Link href={`/dashboard/alunos?search=${encodeURIComponent(student.name)}`}>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <ExternalLink className="w-4 h-4" /> Perfil do {vocabulary.client}
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <Link href={`/dashboard/aulas/${cls.id}/chamada`} className="w-full">
                      <Button variant="ghost" className="w-full justify-between font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 group">
                        Gerenciar Chamada
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-sm py-20 text-center">
            <CardContent>
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Silêncio no {vocabulary.establishment}...</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                Não há nenhuma {vocabulary.service.toLowerCase()} agendada acontecendo neste exato momento ({liveData?.currentTime}).
              </p>
              <Button 
                variant="outline" 
                className="mt-8 gap-2"
                onClick={fetchLiveClasses}
              >
                <RefreshCw className="w-4 h-4" />
                Verificar Novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <style jsx global>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>
      </div>
    </ModuleGuard>
  )
}
