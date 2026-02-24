"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Check, ArrowRight, Shield, CreditCard, QrCode, 
  DollarSign, Layout, 
  ChevronRight, Menu, X, Truck, FireExtinguisher,
  ClipboardCheck, HardHat, AlertTriangle, FileText, CheckCircle2, MapPin,   TrendingUp, FileDown, Download,
  Users, Calendar, MessageSquare, Bot, Box, Trophy, UserPlus, ShoppingBag, Building2, Layers, ClipboardList, LogOut,
  PencilRuler, History, FilePlus
} from "lucide-react"
import QRCode from "react-qr-code"
import { cn } from "@/lib/utils"
import { FireBuildingScrollSection } from "@/components/fire-protection/building-scroll"

// --- Components ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Funcionalidades", href: "#features" },
    { name: "App do Técnico", href: "#tech-app" },
    { name: "Portal do Cliente", href: "#client-portal" },
    { name: "Gestão", href: "#management" },
    { name: "Planos", href: "#pricing" },
  ]

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500",
      scrolled 
        ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-md py-3" 
        : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-2xl tracking-tight text-white hover:opacity-80 transition-opacity">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg">
              <FireExtinguisher className="w-5 h-5 fill-current" />
            </div>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Fire<span className="text-red-500 font-black">Control</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="px-4 py-2 text-sm font-bold text-white/70 hover:text-red-500 transition-all relative group uppercase tracking-widest"
            >
              {item.name}
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/solutions/fire-protection/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="font-semibold text-white hover:bg-white/10 hover:text-white transition-all">
              Entrar
            </Button>
          </Link>
          <Link href="/solutions/fire-protection/register">
            <Button size="sm" className="hidden sm:flex rounded-full px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-105 transition-all duration-300 font-bold text-white border-none">
              Criar Conta Grátis
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-white/10 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4 font-semibold text-white">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="flex items-center justify-between group" onClick={() => setMobileMenuOpen(false)}>
                  {item.name} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-red-500" />
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link href="/solutions/fire-protection/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5 text-white">Entrar</Button>
                </Link>
                <Link href="/solutions/fire-protection/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white border-none">Criar Conta</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-red-900/20 via-transparent to-transparent" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md text-sm font-bold text-red-400 mb-10 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Nova Versão 2.0: Gate Scanner com Validade INMETRO
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[90px] font-black tracking-tighter mb-8 leading-[0.95]"
          >
            Gestão Inteligente de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600">
              Extintores & PPCI
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Controle validade de cargas, vistorias técnicas e logística de retirada e entrega em uma única plataforma. Elimine planilhas e modernize sua empresa.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/solutions/fire-protection/register">
              <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-red-600 hover:bg-red-700 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(220,38,38,0.6)] transition-all hover:scale-105 font-bold text-white border-none group">
                Começar Grátis
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-10 text-xl rounded-full border-2 border-white/10 hover:bg-white/10 hover:text-white hover:border-white font-bold text-slate-300 bg-transparent">
              Ver Demonstração
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'app'>('scanner')

  return (
    <section id="tech-app" className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Tecnologia na palma da mão do <span className="text-red-500">Técnico</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            O aplicativo que revoluciona a rotina de vistorias e entregas. Esqueça o papel e caneta.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
              
              <div className="w-full h-full bg-slate-50 pt-10 pb-4 px-4 flex flex-col relative">
                {activeTab === 'scanner' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                            <QrCode className="w-5 h-5 text-red-600" /> Scanner
                        </div>
                        <Badge className="bg-red-100 text-red-600 border-none">Vistoria</Badge>
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center mb-4 border-2 border-red-500">
                        <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative z-10 animate-pulse flex items-center justify-center p-6">
                            <QRCode 
                                value="FIRE-CONTROL-DEMO-123456"
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                fgColor="#ffffff"
                                bgColor="transparent"
                            />
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-[scan-line_2s_infinite]" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm">PQS 4kg - Hall Térreo</p>
                                <p className="text-xs text-slate-500">Selo: 12345678</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 border-t pt-2">
                            <span className="text-xs font-bold text-emerald-600 uppercase">Validade OK</span>
                            <span className="text-xs text-slate-400">Vence: 12/2026</span>
                        </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'app' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Olá, Carlos 👋</h3>
                            <p className="text-xs text-slate-500">Roteiro: 5 visitas</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <HardHat className="w-5 h-5 text-slate-600" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-sm text-slate-800">Cond. Solar dos Ipês</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <MapPin className="w-3 h-3 text-red-500" /> Av. Paulista, 1000
                                </div>
                                <Button size="sm" className="h-7 text-xs bg-slate-900 text-white w-full">Waze</Button>
                            </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            {[
              { id: 'scanner', title: 'Validador INMETRO', desc: 'Validação instantânea via QR Code.', icon: QrCode },
              { id: 'app', title: 'Roteiro de Logística', desc: 'Organize coletas e entregas.', icon: Truck },
              { id: 'vistoria', title: 'Vistoria Digital', desc: 'Laudos técnicos com fotos.', icon: ClipboardCheck }
            ].map((feature) => (
              <div 
                key={feature.id}
                onClick={() => feature.id !== 'vistoria' && setActiveTab(feature.id as any)}
                className={cn(
                  "p-6 rounded-2xl cursor-pointer transition-all border group",
                  activeTab === feature.id ? "bg-slate-800 border-red-500/30 shadow-lg" : "bg-slate-900/50 border-white/5",
                  feature.id === 'vistoria' && "animate-pulse group-hover:animate-shake"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", activeTab === feature.id ? "bg-red-600 text-white" : "bg-slate-700 text-slate-400")}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold mb-2", activeTab === feature.id ? "text-white" : "text-slate-300")}>{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ClientPortalMockup() {
  return (
    <section id="client-portal" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1 mb-4 uppercase tracking-widest text-[10px] font-black">Portal do Cliente</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Transparência para <span className="text-emerald-500">Condomínios</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Acompanhe a situação dos extintores, laudos e manutenções em tempo real.
          </p>
        </div>
        <div className="grid md:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
              <div className="w-full h-full bg-slate-50 pt-10 pb-4 px-4 flex flex-col relative">
                <div className="flex flex-col h-full">
                  <div className="bg-slate-950 p-4 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden mb-4">
                    <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
                        <span className="font-bold text-sm text-white">Portal FireControl</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">CLI</div>
                    </div>
                    <div className="p-8 bg-slate-900 space-y-6">
                        <div className="bg-red-800/20 border border-red-700/50 p-4 rounded-xl flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm font-bold text-red-300">Atenção: 2 Extintores Vencidos!</p>
                            <Button variant="outline" size="sm" className="bg-red-600 border-none text-white ml-auto text-xs">Recarregar</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800 p-4 rounded-xl text-center">
                                <p className="text-3xl font-black text-emerald-400">28</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Em Dia</p>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl text-center">
                                <p className="text-3xl font-black text-red-400">3</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Atenção</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="bg-slate-800 border-slate-700 gap-2 text-white"><FileDown className="w-4 h-4" /> Laudos</Button>
                            <Button variant="outline" className="bg-slate-800 border-slate-700 gap-2 text-white"><Download className="w-4 h-4" /> Notas</Button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            {[
              { id: 'transparency', title: 'Transparência Total', desc: 'Acesso a laudos e histórico de manutenção.', icon: FileText, color: "from-emerald-500 to-teal-400" },
              { id: 'alerts', title: 'Alertas Inteligentes', desc: 'Notificações sobre extintores vencidos.', icon: AlertTriangle, color: "from-orange-500 to-amber-400" },
              { id: 'payments', title: 'Pagamentos Simplificados', desc: 'Visualize e pague suas faturas online.', icon: CreditCard, color: "from-rose-500 to-pink-500" }
            ].map((feature) => (
              <div 
                key={feature.id}
                className="p-6 rounded-2xl transition-all border bg-slate-800 border-emerald-500/30 shadow-lg"
              >
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600 text-white")}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold mb-2 text-white")}>{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ArchitectPortalMockup() {
  return (
    <section id="architect-portal" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-orange-900/10 via-transparent to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 text-orange-600 border-none px-4 py-1 mb-4 uppercase tracking-widest text-[10px] font-black">Portal do Arquiteto</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Agilidade para seus <span className="text-orange-500">Projetos PPCI</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Ferramentas exclusivas para arquitetos e engenheiros gerenciarem plantas, memoriais e aprovações de forma colaborativa.
          </p>
        </div>
        
        <div className="grid md:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="md:col-span-7 space-y-6 order-2 md:order-1">
            {[
              { id: 'projects', title: 'Gestão de Projetos', desc: 'Centralize todos os seus projetos de incêndio em um único lugar.', icon: Layout, color: "from-orange-500 to-amber-400" },
              { id: 'uploads', title: 'Upload de Plantas', desc: 'Envie arquivos DWG e PDF diretamente para a equipe técnica.', icon: FilePlus, color: "from-blue-500 to-cyan-400" },
              { id: 'tracking', title: 'Acompanhamento em Tempo Real', desc: 'Siga cada etapa da aprovação no Corpo de Bombeiros.', icon: History, color: "from-purple-500 to-pink-500" }
            ].map((feature) => (
              <motion.div 
                key={feature.id}
                whileHover={{ x: 10 }}
                className="p-6 rounded-2xl transition-all border bg-slate-900/50 border-orange-500/20 hover:border-orange-500/40 shadow-lg group"
              >
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-600 text-white shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform")}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="md:col-span-5 flex justify-center order-1 md:order-2">
            <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
              <div className="w-full h-full bg-slate-50 pt-10 pb-4 px-4 flex flex-col relative">
                <div className="flex flex-col h-full">
                  <div className="bg-slate-950 p-4 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden mb-4">
                    <div className="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700">
                        <span className="font-bold text-[10px] text-white uppercase tracking-tighter">Portal FireControl</span>
                        <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-bold text-[10px] text-white">ARQ</div>
                    </div>
                    <div className="p-5 bg-slate-900 space-y-4">
                        <div className="bg-orange-800/20 border border-orange-700/50 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                                <p className="text-[11px] font-bold text-orange-300 uppercase tracking-tighter">Aprovação Pendente</p>
                            </div>
                            <p className="text-[10px] text-slate-400">Bloco B - Condomínio Solar</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800 p-3 rounded-xl text-center border border-white/5">
                                <p className="text-2xl font-black text-orange-400">12</p>
                                <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Ativos</p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl text-center border border-white/5">
                                <p className="text-2xl font-black text-blue-400">4</p>
                                <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Análise</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full bg-orange-600 border-none text-white text-[10px] font-black h-9 rounded-lg uppercase tracking-widest shadow-lg shadow-orange-600/20">
                            <FilePlus className="w-3 h-3 mr-2" /> Upload Planta
                          </Button>
                          <Button variant="outline" size="sm" className="w-full bg-slate-800 border-slate-700 text-white text-[10px] font-bold h-9 rounded-lg">
                            <PencilRuler className="w-3 h-3 mr-2" /> Memorial Descritivo
                          </Button>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3 px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividades Recentes</p>
                    {[
                      { title: "Planta Aprovada", sub: "Edifício Alpha", time: "2h atrás", color: "text-emerald-500" },
                      { title: "Novo Comentário", sub: "Eng. Ricardo", time: "5h atrás", color: "text-blue-500" }
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-slate-800">{item.title}</p>
                          <p className="text-[9px] text-slate-500">{item.sub}</p>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminDashboardMockup() {
  const modules = [
    { label: 'Dashboard', icon: Layout, color: "bg-blue-500", shadow: "shadow-blue-500/20", description: "Visão geral de métricas, faturamento e alertas em tempo real." },
    { label: 'Clientes', icon: Users, color: "bg-indigo-500", shadow: "shadow-indigo-500/20", description: "Cadastro completo de condomínios e empresas com histórico." },
    { label: 'Ordens de Serviço', icon: ClipboardList, color: "bg-red-500", shadow: "shadow-red-500/20", description: "Gestão de vistorias, rotas de técnicos e status de serviço." },
    { label: 'Financeiro', icon: DollarSign, color: "bg-emerald-500", shadow: "shadow-emerald-500/20", description: "Fluxo de caixa, faturamento e cobranças automatizadas." },
    { label: 'Estoque', icon: Box, color: "bg-orange-500", shadow: "shadow-orange-500/20", description: "Controle de carga de extintores (PQS, CO2) e peças de reposição." },
    { label: 'Scanner', icon: QrCode, color: "bg-slate-700", shadow: "shadow-slate-700/20", description: "Validação instantânea de selos INMETRO e QR Codes de equipamentos." },
    { label: 'WhatsApp', icon: MessageSquare, color: "bg-green-500", shadow: "shadow-green-500/20", description: "Comunicação direta com clientes para avisos de vencimento." },
    { label: 'Chat IA', icon: Bot, color: "bg-purple-500", shadow: "shadow-purple-500/20", description: "Assistente inteligente para suporte técnico e dúvidas operacionais." },
    { label: 'PDV', icon: CreditCard, color: "bg-pink-500", shadow: "shadow-pink-500/20", description: "Ponto de venda para balcão e vendas diretas de equipamentos." },
    { label: 'Gamificação', icon: Trophy, color: "bg-yellow-500", shadow: "shadow-yellow-500/20", description: "Incentivos e metas para técnicos de campo e equipe de vendas." },
    { label: 'CRM / Leads', icon: UserPlus, color: "bg-blue-600", shadow: "shadow-blue-600/20", description: "Gestão de funil de vendas e prospecção de novos contratos." },
    { label: 'Marketplace', icon: ShoppingBag, color: "bg-teal-500", shadow: "shadow-teal-500/20", description: "Loja de insumos e equipamentos integrada para reposição." },
    { label: 'ERP', icon: Building2, color: "bg-slate-900", shadow: "shadow-slate-900/20", description: "Gestão empresarial completa, emissão de notas e relatórios fiscais." },
    { label: 'Multi-unidade', icon: Layers, color: "bg-violet-500", shadow: "shadow-violet-500/20", description: "Controle centralizado para empresas com múltiplas filiais." },
    { label: 'Agendas', icon: Calendar, color: "bg-amber-500", shadow: "shadow-amber-500/20", description: "Organização de visitas técnicas e prazos de manutenção." },
  ]

  return (
    <section id="management" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <Badge className="bg-red-100 text-red-600 border-none px-4 py-1 mb-4 uppercase tracking-widest text-[10px] font-black">Visão do Dono</Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Gestão <span className="text-red-600">Completa</span></h2>
                  <p className="text-slate-500 max-w-xl mx-auto">Uma central de comando poderosa com todos os módulos integrados para o seu negócio.</p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
                <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="font-bold text-sm ml-4 opacity-50">fire-control-admin-v2.exe</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-slate-400">Status: <span className="text-emerald-400 uppercase font-black">Online</span></span>
                        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-red-600/20">ADM</div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50">
                    {/* Top Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {[
                            { label: "Faturamento", value: "R$ 48.250", trend: "+12%", color: "text-emerald-500", icon: TrendingUp },
                            { label: "Vistorias", value: "14/18", trend: "Em progresso", color: "text-blue-500", icon: ClipboardCheck },
                            { label: "Vencidos", value: "82", trend: "Crítico", color: "text-red-500", icon: AlertTriangle },
                            { label: "Novos Clientes", value: "6", trend: "+2 hoje", color: "text-orange-500", icon: UserPlus },
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.label}</div>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                                <div className={cn("text-[10px] font-bold mt-1 uppercase tracking-tight", stat.color)}>{stat.trend}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Modules Grid */}
                    <TooltipProvider>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
                            {modules.map((mod, i) => (
                                <Tooltip key={i}>
                                    <TooltipTrigger asChild>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ 
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 20,
                                                delay: 0.1 + i * 0.05 
                                            }}
                                            whileHover={{ 
                                                y: -5,
                                                scale: 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                            className="flex flex-col items-center gap-3 group cursor-pointer"
                                        >
                                            <div className={cn(
                                                "w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] flex items-center justify-center text-white transition-all duration-300 group-hover:rotate-6",
                                                mod.color,
                                                mod.shadow,
                                                "shadow-lg group-hover:shadow-2xl"
                                            )}>
                                                <mod.icon className="w-8 h-8 sm:w-10 sm:h-10" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-slate-600 text-center uppercase tracking-tighter group-hover:text-red-600 transition-colors">
                                                {mod.label}
                                            </span>
                                        </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[200px] text-center bg-slate-900 text-white border-slate-800 p-3 rounded-xl shadow-xl">
                                        <p className="font-bold mb-1 text-red-400 uppercase tracking-tighter text-[10px]">{mod.label}</p>
                                        <p className="text-[11px] leading-tight text-slate-300">{mod.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                </div>

                {/* Dashboard Decoration */}
                <div className="absolute bottom-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FireExtinguisher className="w-64 h-64 rotate-12" />
                </div>
            </div>
        </div>
    </section>
  )
}

function FeatureGrid() {
  const features = [
    { title: "Controle de Insumos", description: "Gestão de pó químico, CO2 e peças.", icon: Shield, color: "from-emerald-500 to-teal-400" },
    { title: "Alertas CRM", description: "Aviso automático via WhatsApp 30 dias antes.", icon: AlertTriangle, color: "from-orange-500 to-amber-400" },
    { title: "PDV Integrado", description: "Venda extintores e acessórios no balcão.", icon: CreditCard, color: "from-rose-500 to-pink-500" },
    { title: "Financeiro", description: "Cobrança recorrente automatizada.", icon: DollarSign, color: "from-cyan-500 to-blue-500" }
  ]

  return (
    <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-red-400 rounded-full blur-[128px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-blue-400 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-red-100 text-red-600 border-none px-4 py-1.5 mb-6 uppercase tracking-[0.2em] text-[10px] font-black shadow-sm">
              Recursos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Tudo em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">só lugar</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
              A tecnologia mais avançada para impulsionar a eficiência da sua empresa de proteção contra incêndio.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 relative overflow-hidden"
            >
              {/* Card Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/5 group-hover:to-red-500/5 transition-all duration-500 blur-xl opacity-0 group-hover:opacity-100" />
              
              <div className="relative z-10">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500",
                  feature.color
                )}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-red-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed group-hover:text-slate-600 transition-colors">
                  {feature.description}
                </p>
                
                <div className="mt-8 flex items-center text-sm font-bold text-red-600 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  Saiba mais <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    { name: "Start", price: "197", desc: "Pequenas empresas", features: ["200 Clientes", "1 Técnico", "App Vistoria"] },
    { name: "Growth", price: "397", desc: "Em expansão", features: ["1000 Clientes", "3 Técnicos", "Portal Cliente"], popular: true },
    { name: "Enterprise", price: "Consultar", desc: "Grandes operações", features: ["Ilimitado", "API", "Multi-Unidades"] }
  ]

  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl font-black mb-16">Planos Flexíveis</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {plans.map((plan, i) => (
                    <div key={i} className={cn("rounded-[2rem] p-8 border flex flex-col relative", plan.popular ? "bg-slate-800 border-red-500 scale-105" : "bg-slate-900 border-white/10")}>
                        {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">Popular</div>}
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="mb-8">
                            <span className="text-sm text-slate-400">R$</span>
                            <span className="text-4xl font-black mx-1">{plan.price}</span>
                            <span className="text-sm text-slate-400">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-left">
                            {plan.features.map((f, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-emerald-500" /> {f}</li>
                            ))}
                        </ul>
                        <Button className={cn("w-full h-12 rounded-xl font-bold", plan.popular ? "bg-red-600 hover:bg-red-700" : "bg-white/10 hover:bg-white/20")}>Escolher</Button>
                    </div>
                ))}
            </div>
        </div>
    </section>
  )
}

function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-500 py-12 border-t border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-6 text-white font-bold text-xl">
                <FireExtinguisher className="w-6 h-6 text-red-600" /> FireControl
            </div>
            <p className="mb-8 text-xs max-w-md mx-auto">A plataforma líder em gestão para empresas de extintores no Brasil.</p>
            <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest mb-8">
                <Link href="#">Termos</Link><Link href="#">Privacidade</Link><Link href="#">Contato</Link>
            </div>
            <p className="text-[10px] text-slate-700">© 2026 Workflow Pro Builder.</p>
        </footer>
    )
}

export default function FireProtectionLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500/30">
      <Navbar />
      <HeroSection />
      <FireBuildingScrollSection />
      <InteractiveDemo />
      <FeatureGrid />
      <AdminDashboardMockup />
      <ClientPortalMockup />
      <ArchitectPortalMockup />
      <PricingSection />
      <Footer />
    </div>
  )
}
