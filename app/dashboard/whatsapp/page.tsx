"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Phone, 
  Search, 
  MoreVertical, 
  Send, 
  CheckCheck, 
  Clock, 
  User, 
  Shield, 
  Bot,
  Sparkles,
  RefreshCw,
  Filter,
  QrCode as QrCodeIcon,
  AlertCircle,
  Wifi,
  WifiOff,
  Trash2,
  Paperclip,
  Smile,
  Mic,
  MessageSquare
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { PLAN_LIMITS } from "@/lib/plan-limits"
import { ModuleGuard } from "@/components/providers/module-guard"
import logger from '@/lib/logger'
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function WhatsAppPage() {
  const { vocabulary, t, language } = useVocabulary()
  const { toast } = useToast()
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewUserMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // QRCode and Connection State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Custom API Settings
  const [apiSettings, setApiSettings] = useState({
    api_key: "",
    instance_id: "",
    api_url: ""
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("student")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('disconnected')
  const [isFetchingQr, setIsFetchingQr] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [studioPlan, setStudioPlan] = useState("gratuito")
  const [systemPlans, setSystemPlans] = useState<any[]>([])

  const checkConnection = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      
      const res = await fetch(`/api/whatsapp/connect?studioId=${user.studio_id || user.studioId}`)
      const data = await res.json()

      if (data.data?.instance?.state === 'open' || data.data?.instance?.status === 'open') {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
    }
  }

  const fetchQrCode = async () => {
    // Verificar se o plano permite WhatsApp
    const currentPlan = systemPlans.find(p => p.id === studioPlan)
    if (studioPlan === 'gratuito' || (currentPlan && !currentPlan.has_whatsapp)) {
      toast({
        title: t.whatsapp.premiumResource,
        description: t.whatsapp.premiumDesc,
        variant: "destructive"
      })
      return
    }

    setIsFetchingQr(true)
    setQrCode(null)
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      
      const pollQr = async () => {
        try {
          const res = await fetch(`/api/whatsapp/connect?studioId=${user.studio_id || user.studioId}`)
          const data = await res.json()

          if (data.success && data.data.base64) {
            setQrCode(data.data.base64)
            setIsQrModalOpen(true)
            setIsFetchingQr(false)
            return true
          } else if (data.data?.instance?.state === 'open' || data.data?.instance?.status === 'open') {
            setConnectionStatus('connected')
            toast({ title: t.whatsapp.connected, description: t.whatsapp.ready })
            setIsFetchingQr(false)
            return true
          }
          return false
        } catch (e) {
          return false
        }
      }

      let attempts = 0
      const interval = setInterval(async () => {
        const finished = await pollQr()
        attempts++
        if (finished || attempts >= 30) {
          clearInterval(interval)
          if (!finished) {
            setIsFetchingQr(false)
            toast({ 
              title: t.whatsapp.qrGenerating, 
              description: t.whatsapp.qrGeneratingDesc.replace('{connect}', t.whatsapp.connect), 
              variant: "destructive" 
            })
          }
        }
      }, 3000)

    } catch (error: any) {
      toast({ 
        title: t.whatsapp.connectionError, 
        description: error.message || t.whatsapp.connectionErrorDesc, 
        variant: "destructive" 
      })
      setIsFetchingQr(false)
    }
  }

  const loadStudioPlan = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const [studioRes, plansRes] = await Promise.all([
        supabase.from('studios').select('plan').eq('id', studioId).single(),
        supabase.from('system_plans').select('*').eq('status', 'active')
      ])

      if (!studioRes.error && studioRes.data) {
        setStudioPlan(studioRes.data.plan || "gratuito")
      }

      if (!plansRes.error && plansRes.data) {
        setSystemPlans(plansRes.data)
      }

      // Carregar chaves de API se existirem
      const { data: keys } = await supabase
        .from('studio_api_keys')
        .select('*')
        .eq('studio_id', studioId)
        .eq('service_name', 'whatsapp')
        .maybeSingle()
      
      if (keys) {
        setApiSettings({
          api_key: keys.api_key || "",
          instance_id: keys.instance_id || "",
          api_url: keys.settings?.api_url || ""
        })
      }
    } catch (e) {
      logger.error('Erro ao carregar plano:', e)
    }
  }

  const handleSaveApiSettings = async () => {
    setIsSavingSettings(true)
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { error } = await supabase
        .from('studio_api_keys')
        .upsert({
          studio_id: studioId,
          service_name: 'whatsapp',
          api_key: apiSettings.api_key,
          instance_id: apiSettings.instance_id,
          settings: { api_url: apiSettings.api_url },
          updated_at: new Date().toISOString()
        }, { onConflict: 'studio_id, service_name' })

      if (error) throw error

      toast({ title: t.whatsapp.settingsSaved, description: t.whatsapp.settingsSavedDesc })
      setIsSettingsModalOpen(false)
      checkConnection() // Re-verificar status com as novas chaves
    } catch (error: any) {
      toast({ 
        title: "Erro ao salvar configurações", 
        description: (
          <div className="flex flex-col">
            <p><b>Código:</b> {error.code}</p>
            <p><b>Mensagem:</b> {error.message}</p>
            {error.details && <p><b>Detalhes:</b> {error.details}</p>}
            {error.hint && <p><b>Dica:</b> {error.hint}</p>}
          </div>
        ),
        variant: "destructive" 
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm("Tem certeza que deseja desconectar este WhatsApp? Isso pausará todas as automações de IA.")) return
    
    setIsDisconnecting(true)
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      
      const res = await fetch('/api/whatsapp/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioId: user.studio_id || user.studioId })
      })

      const data = await res.json()
      if (data.success) {
        setConnectionStatus('disconnected')
        setQrCode(null)
        toast({ title: t.whatsapp.disconnectSuccess, description: t.whatsapp.disconnectedDesc })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: t.whatsapp.disconnectError, description: error.message, variant: "destructive" })
    } finally {
      setIsDisconnecting(false)
    }
  }

  useEffect(() => {
    loadChats()
    checkConnection()
    loadStudioPlan()
    
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, () => loadChats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        if (selectedChat && payload.new.chat_id === selectedChat.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChat])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
   
  const loadChats = async () => {
    const studioId = JSON.parse(localStorage.getItem('danceflow_user') || '{}').studio_id

    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .eq('studio_id', studioId)
      .order('updated_at', { ascending: false })

    if (error) {
      logger.error('Erro ao carregar chats:', error)
    } else {
      setChats(data || [])
      if (!selectedChat && data?.length > 0) {
        handleSelectChat(data[0])
      }
    }
    setIsLoading(false)
  }

  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat)
    setEditName(chat.contact_name || "")
    setEditType(chat.contact_type || "student")
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('timestamp', { ascending: true })

    if (!error) {
      setMessages(data || [])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    const studioId = JSON.parse(localStorage.getItem('danceflow_user') || '{}').studio_id
    const messageToSend = newMessage.trim()
    
    const tempMsg = {
      id: Date.now().toString(),
      content: messageToSend,
      from_me: true,
      timestamp: new Date().toISOString(),
      sender_name: 'Você'
    }
    setMessages(prev => [...prev, tempMsg])
    setNewUserMessage("")

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedChat.remote_jid,
          message: messageToSend,
          studioId: studioId
        })
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      await supabase.from('whatsapp_messages').insert({
        studio_id: studioId,
        chat_id: selectedChat.id,
        content: messageToSend,
        from_me: true,
        timestamp: new Date().toISOString()
      })

      await supabase.from('whatsapp_chats').update({
        last_message: messageToSend,
        updated_at: new Date().toISOString()
      }).eq('id', selectedChat.id)

    } catch (error) {
      toast({ title: t.whatsapp.sendError, description: t.whatsapp.sendErrorDesc, variant: "destructive" })
    }
  }

  const deleteChat = async () => {
    if (!selectedChat) return
    if (!confirm("Tem certeza que deseja excluir esta conversa do histórico local? (Não apagará no WhatsApp)")) return

    try {
      const { error } = await supabase
        .from('whatsapp_chats')
        .delete()
        .eq('id', selectedChat.id)

      if (error) throw error

      toast({ title: t.whatsapp.deleteChatSuccess, description: t.whatsapp.deleteLocalHistorySuccess })
      setSelectedChat(null)
      setMessages([])
      loadChats()
    } catch (error) {
      toast({ title: t.whatsapp.deleteChatError, description: "Não foi possível remover a conversa.", variant: "destructive" })
    }
  }

  const handleUpdateContact = async () => {
    if (!selectedChat) return

    try {
      const { error } = await supabase
        .from('whatsapp_chats')
        .update({
          contact_name: editName,
          contact_type: editType
        })
        .eq('id', selectedChat.id)

      if (error) throw error

      toast({ title: t.whatsapp.contactUpdated, description: t.whatsapp.contactUpdatedDesc })
      setIsEditModalOpen(false)
      loadChats()
      setSelectedChat((prev: any) => prev ? ({ ...prev, contact_name: editName, contact_type: editType }) : null)
    } catch (error) {
      toast({ title: t.whatsapp.updateError, description: t.whatsapp.updateErrorDesc, variant: "destructive" })
    }
  }

  const getContactBadge = (type: string) => {
    switch (type) {
      case 'admin': return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-[10px]">ADMIN</Badge>
      case 'student': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">{vocabulary.client.toUpperCase()}</Badge>
      case 'lead': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">LEAD</Badge>
      default: return null
    }
  }

  return (
    <ModuleGuard module="whatsapp" showFullError>
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="flex-shrink-0">
          <Header title={t.whatsapp.title} />
        </div>
        {/* ... restante do código ... */}
      
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar de Chats */}
        <Card className="w-80 flex flex-col border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 h-full min-h-0">
          {/* Status de Conexão */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.whatsapp.connected}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{t.whatsapp.disconnected}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {connectionStatus === 'connected' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={isDisconnecting}
                    title={t.whatsapp.disconnectTitle}
                  >
                    {isDisconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                  onClick={() => setIsSettingsModalOpen(true)}
                  title={t.whatsapp.apiSettings}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  onClick={fetchQrCode}
                  disabled={isFetchingQr || isDisconnecting}
                >
                  {isFetchingQr ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <QrCodeIcon className="w-3 h-3" />
                      {connectionStatus === 'connected' ? t.whatsapp.reconnect : t.whatsapp.connect}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t.whatsapp.chats}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder={t.whatsapp.searchPlaceholder} 
                className="pl-9 bg-slate-50 dark:bg-slate-800 border-none h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 h-full min-h-0" type="always">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  {t.common.loading}
                </div>
              ) : chats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  {t.whatsapp.noChats}
                </div>
              ) : (
                chats.filter(c => c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.remote_jid.includes(searchTerm)).map((chat) => (
                  <div 
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedChat?.id === chat.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                  >
                    <Avatar className="h-12 w-12 border border-slate-100 dark:border-slate-800">
                      <AvatarFallback className={chat.contact_type === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}>
                        {chat.contact_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-sm truncate pr-2">{chat.contact_name || chat.remote_jid.split('@')[0]}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(chat.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 truncate max-w-[140px]">{chat.last_message || 'Nenhuma mensagem'}</p>
                        {getContactBadge(chat.contact_type)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Área do Chat */}
        <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 relative h-full min-h-0">
          {selectedChat ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 sticky top-0 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-10 w-10 border border-slate-100 dark:border-slate-800 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <AvatarFallback className={selectedChat.contact_type === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}>
                      {selectedChat.contact_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="cursor-pointer group" onClick={() => setIsEditModalOpen(true)}>
                    <h4 className="font-bold text-sm flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                      {selectedChat.contact_name || selectedChat.remote_jid.split('@')[0]}
                      {getContactBadge(selectedChat.contact_type)}
                    </h4>
                    <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t.whatsapp.onlineIA}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={deleteChat} title={t.whatsapp.deleteLocalHistory}><Trash2 className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="text-slate-400"><Phone className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/30 relative h-full min-h-0" viewportRef={scrollRef} type="always">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
                     style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
                
                <div className="space-y-6 relative z-10">
                  {messages.map((msg, idx) => {
                    const isNewDay = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(messages[idx-1].timestamp).toDateString();
                    
                    return (
                      <div key={msg.id}>
                        {isNewDay && (
                          <div className="flex justify-center my-6">
                            <span className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                              {new Date(msg.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] group relative ${msg.from_me ? 'order-2' : 'order-1'}`}>
                            {!msg.from_me && (
                              <span className="text-[10px] text-slate-400 ml-3 mb-1.5 block font-medium">
                                {msg.sender_name || 'Contato'}
                              </span>
                            )}
                            <div className={`p-3.5 rounded-2xl text-[13px] shadow-sm transition-all hover:shadow-md ${
                              msg.from_me 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                            }`}>
                              {msg.is_ai && !msg.from_me && (
                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-[0.15em]">
                                  <Sparkles className="w-3 h-3 animate-pulse" /> Workflow AI
                                </div>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1.5 mt-1.5 opacity-50 text-[9px] font-medium`}>
                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                {msg.from_me && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex gap-1 mb-1.5">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-full">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-full">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="relative flex-1">
                    <textarea 
                      placeholder={t.whatsapp.typeMessage} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl py-3 px-4 text-sm resize-none min-h-[44px] max-h-[120px] transition-all"
                      value={newMessage}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      onChange={(e) => {
                        setNewUserMessage(e.target.value);
                        e.target.style.height = 'inherit';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                  </div>

                  <div className="flex gap-2 mb-0.5">
                    {!newMessage.trim() ? (
                      <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:text-indigo-600 rounded-full bg-slate-50 dark:bg-slate-800">
                        <Mic className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 w-11 rounded-full flex-shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95">
                        <Send className="w-5 h-5 text-white" />
                      </Button>
                    )}
                  </div>
                </form>
                <div className="flex items-center justify-between mt-3 px-2">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1 font-medium uppercase tracking-tighter">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" /> {t.whatsapp.activeIA}
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 font-bold border-indigo-100 text-indigo-600 bg-indigo-50/30">
                    {t.whatsapp.secretaryMode}
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Central WhatsApp</h3>
              <p className="max-w-xs text-sm text-slate-500">{t.whatsapp.selectChat.replace('{clients}', vocabulary.clients.toLowerCase())}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
              <QrCodeIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl font-black">{t.whatsapp.connect}</DialogTitle>
            <DialogDescription>
              {t.whatsapp.qrCodeDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden">
            {qrCode ? (
              <div className="bg-white p-4 rounded-xl shadow-inner relative z-10">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-xl pointer-events-none animate-pulse" />
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-400 animate-pulse">{t.whatsapp.connecting}</p>
              </div>
            )}
            
            <div className="mt-8 grid grid-cols-1 gap-3 w-full">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">1</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: t.whatsapp.step1 }} />
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">2</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: t.whatsapp.step2 }} />
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">3</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: t.whatsapp.step3 }} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">{t.whatsapp.expertTip}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-relaxed">
                  {t.whatsapp.expertTipDesc}
                </p>
              </div>
            </div>

            <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold">
              {t.whatsapp.qrCodeExpired}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Contato */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{t.whatsapp.editContact}</DialogTitle>
            <DialogDescription>
              Atualize as informações deste contato para facilitar a organização.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.whatsapp.contactName}</Label>
              <Input 
                id="name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.whatsapp.profileType}</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-none focus:ring-indigo-500">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="student">{vocabulary.client}</SelectItem>
                  <SelectItem value="lead">Lead (Interessado)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="font-bold">{t.common.cancel}</Button>
            <Button type="button" onClick={handleUpdateContact} className="bg-indigo-600 hover:bg-indigo-700 font-bold">{t.whatsapp.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Configurações de API */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{t.whatsapp.apiSettings}</DialogTitle>
            <DialogDescription>
              {t.whatsapp.apiSettingsDesc}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api_url" className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.whatsapp.apiUrl}</Label>
              <Input 
                id="api_url" 
                value={apiSettings.api_url} 
                onChange={(e) => setApiSettings({...apiSettings, api_url: e.target.value})}
                placeholder="https://sua-api.com"
                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api_key" className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.whatsapp.apiKey}</Label>
              <Input 
                id="api_key" 
                type="password"
                value={apiSettings.api_key} 
                onChange={(e) => setApiSettings({...apiSettings, api_key: e.target.value})}
                placeholder="Sua Global API Key"
                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instance_id" className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.whatsapp.instanceId}</Label>
              <Input 
                id="instance_id" 
                value={apiSettings.instance_id} 
                onChange={(e) => setApiSettings({...apiSettings, instance_id: e.target.value})}
                placeholder="df_meu-studio"
                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 italic">{t.whatsapp.instanceIdDesc.replace('{establishment}', vocabulary.establishment.toLowerCase())}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsSettingsModalOpen(false)} className="font-bold text-xs">{t.common.close.toUpperCase()}</Button>
            <Button 
              type="button"
              onClick={handleSaveApiSettings} 
              disabled={isSavingSettings}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs"
            >
              {isSavingSettings ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : null}
              {t.common.save.toUpperCase()} CONFIGURAÇÕES
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleGuard>
  )
}
