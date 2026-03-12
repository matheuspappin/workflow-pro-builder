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
  ArrowRight, CreditCard, QrCode, 
  DollarSign, Layout, 
  ChevronRight, Menu, X, Truck, FireExtinguisher,
  ClipboardCheck, HardHat, AlertTriangle, FileText, CheckCircle2, MapPin,   TrendingUp, FileDown, Download,
  Users, Calendar, MessageSquare, Bot, Box, Trophy, UserPlus, ShoppingBag, Building2, Layers, ClipboardList,
  PencilRuler, History, FilePlus, Shield
} from "lucide-react"
import QRCode from "react-qr-code"
import { cn } from "@/lib/utils"
import { FireWaterCanvas } from "@/components/fire-protection/fire-water-canvas"
import { OFFICIAL_LOGO } from "@/config/branding"

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
    { name: "Contato", href: "#pricing" },
  ]

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500",
      scrolled 
        ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-md py-3" 
        : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/solutions/fire-protection/landing" className="flex items-center gap-2.5 font-bold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-600 to-cyan-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <FireExtinguisher className="w-5 h-5 fill-current" />
            </div>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-cyan-200/90">
            Fire<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 font-black">Control</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="px-4 py-2 text-sm font-bold text-white/70 hover:text-orange-400 transition-all relative group uppercase tracking-widest"
            >
              {item.name}
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-orange-400 to-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/solutions/fire-protection/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="h-10 px-5 rounded-xl font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200">
              Entrar
            </Button>
          </Link>
          <Link href="/solutions/fire-protection/register">
            <Button size="sm" className="hidden sm:flex h-10 px-6 rounded-xl bg-white text-slate-900 hover:bg-white/95 font-bold shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_14px_-2px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_8px_20px_-2px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all duration-200 border-0">
              Criar Conta Grátis
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-white/10 text-white transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
            className="md:hidden absolute top-full left-0 w-full bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4 font-semibold text-white">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="flex items-center justify-between group" onClick={() => setMobileMenuOpen(false)}>
                  {item.name} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-red-500" />
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href="/solutions/fire-protection/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold">Entrar</Button>
                </Link>
                <Link href="/solutions/fire-protection/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-11 rounded-xl bg-white text-slate-900 hover:bg-white/95 font-bold border-0 shadow-lg">Criar Conta</Button>
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
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden text-white">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl text-sm font-semibold text-orange-200 mb-10 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_20px_-4px_rgba(234,88,12,0.2)]"
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-cyan-400">
              Extintores & PPCI
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
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
              <Button size="lg" className="h-14 px-10 text-lg rounded-2xl bg-white text-slate-900 hover:bg-white/95 font-bold shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_16px_40px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_20px_50px_-8px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 border-0 group">
                Começar Grátis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border border-white/25 bg-white/5 hover:bg-white/10 hover:border-white/40 font-semibold text-white backdrop-blur-sm transition-all duration-200">
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
    <section id="tech-app" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Tecnologia na palma da mão do <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Técnico</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
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
                        <Badge className="bg-red-500/90 text-white border-none rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-[0_2px_8px_rgba(239,68,68,0.4)]">Vistoria</Badge>
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
                                <Button size="sm" className="h-8 text-xs bg-green-500 hover:bg-green-400 text-white w-full rounded-xl font-bold shadow-[0_2px_8px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_12px_rgba(34,197,94,0.4)] transition-all">Waze</Button>
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
                onClick={() => feature.id !== 'vistoria' && setActiveTab(feature.id as 'scanner' | 'app')}
                className={cn(
                  "p-6 rounded-2xl cursor-pointer transition-all border group backdrop-blur-xl",
                  activeTab === feature.id 
                    ? "border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-500/10" 
                    : "border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-orange-500/20",
                  feature.id === 'vistoria' && "animate-pulse group-hover:animate-shake"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", activeTab === feature.id ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30" : "bg-slate-700/80 text-slate-400")}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold mb-2", activeTab === feature.id ? "text-white" : "text-slate-300")}>{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.desc}</p>
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
    <section id="client-portal" className="py-24 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-2 mb-4 rounded-2xl uppercase tracking-widest text-[10px] font-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">Portal do Cliente</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Transparência para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">Condomínios</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
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
                            <Button variant="outline" size="sm" className="bg-red-600 hover:bg-red-500 border-none text-white ml-auto text-xs rounded-xl font-semibold shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition-colors">Recarregar</Button>
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
<Button variant="outline" className="bg-slate-800 hover:bg-slate-700 border-slate-600 gap-2 text-white rounded-xl font-medium transition-colors"><FileDown className="w-4 h-4" /> Laudos</Button>
                                            <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 border-slate-600 gap-2 text-white rounded-xl font-medium transition-colors"><Download className="w-4 h-4" /> Notas</Button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            {[
              { id: 'transparency', title: 'Transparência Total', desc: 'Acesso a laudos e histórico de manutenção.', icon: FileText },
              { id: 'alerts', title: 'Alertas Inteligentes', desc: 'Notificações sobre extintores vencidos.', icon: AlertTriangle },
              { id: 'payments', title: 'Pagamentos Simplificados', desc: 'Visualize e pague suas faturas online.', icon: CreditCard }
            ].map((feature) => (
              <div 
                key={feature.id}
                className="p-6 rounded-2xl transition-all border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:border-cyan-400/40"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600 text-white">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.desc}</p>
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
    <section id="architect-portal" className="py-24 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-5 py-2 mb-4 rounded-2xl uppercase tracking-widest text-[10px] font-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">Portal do Arquiteto</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
            Agilidade para seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Projetos PPCI</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Ferramentas exclusivas para arquitetos e engenheiros gerenciarem plantas, memoriais e aprovações de forma colaborativa.
          </p>
        </div>
        
        <div className="grid md:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          <div className="md:col-span-7 space-y-6 order-2 md:order-1">
            {[
              { id: 'projects', title: 'Gestão de Projetos', desc: 'Centralize todos os seus projetos de incêndio em um único lugar.', icon: Layout },
              { id: 'uploads', title: 'Upload de Plantas', desc: 'Envie arquivos DWG e PDF diretamente para a equipe técnica.', icon: FilePlus },
              { id: 'tracking', title: 'Acompanhamento em Tempo Real', desc: 'Siga cada etapa da aprovação no Corpo de Bombeiros.', icon: History }
            ].map((feature) => (
              <motion.div 
                key={feature.id}
                whileHover={{ x: 10 }}
                className="p-6 rounded-2xl transition-all border border-orange-500/25 bg-orange-500/5 backdrop-blur-xl hover:border-orange-400/50 hover:bg-orange-500/10 shadow-lg shadow-orange-500/10 group"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-600 text-white shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
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
                          <Button variant="outline" size="sm" className="w-full bg-orange-600 hover:bg-orange-500 border-none text-white text-[10px] font-black h-9 rounded-xl uppercase tracking-widest shadow-[0_4px_12px_rgba(234,88,12,0.3)] hover:shadow-[0_6px_16px_rgba(234,88,12,0.4)] transition-all">
                            <FilePlus className="w-3 h-3 mr-2" /> Upload Planta
                          </Button>
                          <Button variant="outline" size="sm" className="w-full bg-slate-800 hover:bg-slate-700 border-slate-600 text-white text-[10px] font-bold h-9 rounded-xl transition-colors">
                            <PencilRuler className="w-3 h-3 mr-2" /> Memorial Descritivo
                          </Button>
                        </div>
                    </div>
                  </div>
                  <div className="space-y-3 px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividades Recentes</p>
                    {[
                      { title: "Planta Aprovada", sub: "Edifício Alpha", time: "2h atrás" },
                      { title: "Novo Comentário", sub: "Eng. Ricardo", time: "5h atrás" }
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
    <section id="management" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2 mb-4 rounded-2xl uppercase tracking-widest text-[10px] font-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">Visão do Dono</Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Gestão <span className="text-red-400">Completa</span></h2>
                  <p className="text-slate-300 max-w-xl mx-auto">Uma central de comando poderosa com todos os módulos integrados para o seu negócio.</p>
                </motion.div>
            </div>
            <div className="max-w-6xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden relative backdrop-blur-xl bg-slate-900/60 border border-white/10">
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
                <div className="p-8 bg-white/5 rounded-b-[2.5rem]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {[
                            { label: "Faturamento", value: "R$ 48.250", trend: "+12%", color: "text-emerald-500", icon: TrendingUp },
                            { label: "Vistorias", value: "14/18", trend: "Em progresso", color: "text-blue-500", icon: ClipboardCheck },
                            { label: "Vencidos", value: "82", trend: "Crítico", color: "text-red-500", icon: AlertTriangle },
                            { label: "Novos Clientes", value: "6", trend: "+2 hoje", color: "text-orange-500", icon: UserPlus },
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-orange-500/20 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">{stat.label}</div>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className={cn("text-[10px] font-bold mt-1 uppercase tracking-tight", stat.color)}>{stat.trend}</div>
                            </motion.div>
                        ))}
                    </div>
                    <TooltipProvider>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
                            {modules.map((mod, i) => (
                                <Tooltip key={i}>
                                    <TooltipTrigger asChild>
                                        <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 + i * 0.05 }} whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.2 } }} className="flex flex-col items-center gap-3 group cursor-pointer">
                                            <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] flex items-center justify-center text-white transition-all duration-300 group-hover:rotate-6", mod.color, mod.shadow, "shadow-lg group-hover:shadow-2xl")}>
                                                <mod.icon className="w-8 h-8 sm:w-10 sm:h-10" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 text-center uppercase tracking-tighter group-hover:text-red-400 transition-colors">{mod.label}</span>
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
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2 mb-6 rounded-2xl uppercase tracking-[0.2em] text-[10px] font-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">Recursos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Tudo em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-cyan-400">só lugar</span>
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
              A tecnologia mais avançada para impulsionar a eficiência da sua empresa de proteção contra incêndio.
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -10 }} className="group rounded-[2.5rem] border border-white/10 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.06] hover:border-orange-500/20 hover:shadow-orange-500/10">
              <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-br from-orange-500/0 via-transparent to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500", feature.color)}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-300 text-base leading-relaxed group-hover:text-slate-200 transition-colors">{feature.description}</p>
                <div className="mt-8 flex items-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
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
  const highlights = [
    { icon: "🔧", label: "Implantação completa", desc: "Nossa equipe configura tudo para você" },
    { icon: "🎓", label: "Treinamento incluído", desc: "Capacitação da equipe técnica e gestores" },
    { icon: "📞", label: "Suporte dedicado", desc: "Atendimento direto com especialistas" },
    { icon: "⚙️", label: "Personalização total", desc: "Sistema adaptado ao seu processo" },
  ]

  return (
    <section id="pricing" className="py-24 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <h2 className="text-4xl font-black mb-4">Implementação Personalizada</h2>
        <p className="text-slate-300 text-lg mb-16 max-w-2xl mx-auto">
          O FireControl é implantado com suporte especializado. Entre em contato para que nossa equipe entenda as necessidades da sua empresa e apresente a melhor solução.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-xl hover:border-orange-500/20 hover:bg-white/[0.07] text-left transition-all">
              <span className="text-3xl">{h.icon}</span>
              <div>
                <p className="font-bold text-white mb-1">{h.label}</p>
                <p className="text-slate-300 text-sm">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative rounded-3xl p-10 overflow-hidden backdrop-blur-xl border border-orange-500/30 bg-gradient-to-br from-orange-600/20 via-red-600/15 to-cyan-600/15">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5" />
          <div className="relative">
            <h3 className="text-2xl font-black text-white mb-3">Pronto para começar?</h3>
            <p className="text-slate-300 mb-8">
              Fale com nosso time e receba uma demonstração exclusiva do FireControl para sua empresa de extintores.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a href="https://wa.me/5511999999999?text=Olá! Tenho interesse no FireControl para minha empresa de extintores." target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-slate-900 font-bold h-14 px-8 rounded-2xl transition-all duration-200 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_12px_40px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_16px_50px_-8px_rgba(239,68,68,0.2)] hover:scale-[1.02] group">
                <FireExtinguisher className="w-5 h-5 group-hover:rotate-[-8deg] transition-transform" />
                Falar com um especialista
              </a>
              <a href="mailto:contato@workflowpro.com.br" className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 hover:bg-white/10 hover:border-white/40 font-bold h-14 px-8 rounded-2xl transition-all duration-200 backdrop-blur-sm text-white">
                Solicitar demonstração
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="text-slate-400 py-12 border-t border-white/10 text-center backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 mb-6 font-bold text-xl text-white">
        <FireExtinguisher className="w-6 h-6 text-orange-500" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-cyan-400">FireControl</span>
      </div>
      <p className="mb-8 text-xs max-w-md mx-auto text-slate-400">A plataforma líder em gestão para empresas de extintores no Brasil.</p>
      <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest mb-8">
        <Link href="#">Termos</Link><Link href="#">Privacidade</Link><Link href="#">Contato</Link>
      </div>
      <p className="text-[10px] text-slate-500 mb-10">© 2026 akaaicore Builder.</p>

      <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-3">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <img src={OFFICIAL_LOGO} alt="AKAAI HUB" className="w-8 h-8 opacity-70 group-hover:opacity-100 transition-opacity object-contain" />
          <span className="font-black text-white/60 text-sm tracking-tight group-hover:text-white/90 transition-colors">AKAAI <span className="text-white/40">HUB</span></span>
        </Link>
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Powered by AKAAI CORE</span>
        <p className="text-[9px] text-white/30 font-mono uppercase tracking-wider">Also Known As Artificial Intelligence HUB</p>
      </div>
    </footer>
  )
}

export default function FireProtectionLandingPage() {
  useEffect(() => {
    document.body.classList.add('scrollbar-sidebar-dark')
    return () => { document.body.classList.remove('scrollbar-sidebar-dark') }
  }, [])
  return (
    <div className="min-h-screen relative font-sans selection:bg-red-500/30 overflow-x-hidden bg-black">
      {/* Fundo: canvas fogo/água - tema da imagem */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <FireWaterCanvas className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/85" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <InteractiveDemo />
        <FeatureGrid />
        <AdminDashboardMockup />
        <ClientPortalMockup />
        <ArchitectPortalMockup />
        <PricingSection />
        <Footer />
      </div>
    </div>
  )
}
