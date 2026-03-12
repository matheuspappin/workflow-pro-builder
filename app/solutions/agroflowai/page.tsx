"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Leaf, ArrowRight, Menu, X,
  Satellite, FileText, BarChart3, Users,
  ChevronDown, CheckCircle2, Star, Shield, Zap,
  MapPin, ClipboardList, TrendingUp, Bell, AlertTriangle,
  PencilRuler, Wrench, DollarSign, Globe, Lock, Sparkles,
  Phone, Mail, ChevronRight, Play, CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Animated Counter ──────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 })

  useEffect(() => {
    if (isInView) motionVal.set(value)
  }, [isInView, value, motionVal])

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${Math.floor(v).toLocaleString("pt-BR")}${suffix}`
    })
  }, [spring, suffix, prefix])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

// ─── Floating Particles ─────────────────────────────────────────────────────

function FloatingParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <div
      className="absolute rounded-full bg-emerald-500/20 pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        animation: `floatParticle ${4 + delay}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

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
    { name: "Dashboard", href: "#dashboard" },
    { name: "Monitor Satélite", href: "#satellite" },
    { name: "Depoimentos", href: "#testimonials" },
    { name: "Contato", href: "#pricing" },
  ]

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500",
      scrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-2xl tracking-tight text-white hover:opacity-80 transition-opacity">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-500" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Agro<span className="text-emerald-400 font-black">Flow</span>AI
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a key={item.name} href={item.href} className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              {item.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="font-semibold text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex" asChild>
            <Link href="/solutions/agroflowai/login">Entrar</Link>
          </Button>
          <Button size="sm" className="rounded-full px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 font-bold text-white border-none hidden sm:flex gap-1.5" asChild>
            <Link href="/solutions/agroflowai/register">
              Criar Conta Grátis
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="text-white/80 font-semibold py-2 hover:text-emerald-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {item.name}
                </a>
              ))}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Link href="/solutions/agroflowai/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button type="button" variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">Entrar</Button>
                </Link>
                <Link href="/solutions/agroflowai/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button type="button" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold">Criar Conta</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection() {
  const particles = [
    { delay: 0, x: "10%", y: "20%", size: 8 },
    { delay: 1, x: "80%", y: "15%", size: 12 },
    { delay: 2, x: "60%", y: "70%", size: 6 },
    { delay: 0.5, x: "25%", y: "65%", size: 10 },
    { delay: 1.5, x: "90%", y: "55%", size: 7 },
    { delay: 3, x: "45%", y: "80%", size: 9 },
    { delay: 2.5, x: "5%", y: "50%", size: 5 },
    { delay: 0.8, x: "70%", y: "35%", size: 11 },
  ]

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.15)_0%,transparent_60%)]" />
        <div className="absolute top-[-5%] left-[-15%] w-[60%] h-[60%] bg-emerald-700/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] bg-teal-700/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-700/5 rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-400 mb-10 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            Plataforma #1 em Compliance Ambiental para o Agronegócio
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter mb-8 leading-[0.92]"
          >
            Compliance Ambiental e<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 animate-pulse">
              Engenharia no Campo
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Laudos, CAR, licenciamentos e monitoramento de desmatamento por satélite.{" "}
            <span className="text-white font-semibold">Tudo em uma plataforma integrada</span>{" "}
            para consultorias e engenheiros ambientais.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
              <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.5)] font-bold text-white border-none group transition-all duration-300" asChild>
                <Link href="/solutions/agroflowai/register">
                  Começar Grátis — 14 dias
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            <a href="#dashboard">
              <Button type="button" size="lg" variant="ghost" className="h-16 px-8 text-lg rounded-full text-white/70 hover:text-white hover:bg-white/10 font-semibold group gap-3" onClick={() => {
                const dashboard = document.getElementById('dashboard')
                dashboard?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                Ver demo ao vivo
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            {[
              { icon: Shield, text: "Dados 100% seguros" },
              { icon: CheckCircle2, text: "Sem cartão de crédito" },
              { icon: Zap, text: "Setup em minutos" },
              { icon: Globe, text: "Acesso de qualquer lugar" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-emerald-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 max-w-6xl mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20 rounded-3xl blur-2xl" />
            {/* Browser chrome */}
            <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] bg-slate-900">
              {/* Browser bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-slate-700/50 flex items-center px-3 gap-2">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-slate-400 font-mono">app.agroflowai.com.br/dashboard</span>
                </div>
              </div>
              {/* Mini dashboard */}
              <div className="grid grid-cols-12 min-h-[400px] bg-slate-900">
                {/* Sidebar */}
                <div className="col-span-2 bg-slate-950 border-r border-white/5 p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-2 py-2 mb-3">
                    <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
                      <Leaf className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white hidden sm:block">AgroFlow</span>
                  </div>
                  {[
                    { icon: BarChart3, label: "Dashboard", active: true },
                    { icon: ClipboardList, label: "OS" },
                    { icon: FileText, label: "Laudos" },
                    { icon: Satellite, label: "Satélite" },
                    { icon: Users, label: "Clientes" },
                    { icon: DollarSign, label: "Financeiro" },
                  ].map((item) => (
                    <div key={item.label} className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                      item.active ? "bg-emerald-600/20 text-emerald-400" : "text-slate-500"
                    )}>
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[10px] font-medium hidden sm:block">{item.label}</span>
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="col-span-10 p-4 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Clientes", value: "124", icon: Users, color: "text-emerald-400", border: "border-l-emerald-500" },
                      { label: "OS Abertas", value: "37", icon: ClipboardList, color: "text-amber-400", border: "border-l-amber-500" },
                      { label: "Laudos/Mês", value: "89", icon: FileText, color: "text-violet-400", border: "border-l-violet-500" },
                      { label: "Faturamento", value: "R$ 48k", icon: DollarSign, color: "text-pink-400", border: "border-l-pink-500" },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("p-2.5 rounded-lg bg-slate-800/60 border-l-2", stat.border)}>
                        <stat.icon className={cn("w-3 h-3 mb-1", stat.color)} />
                        <p className={cn("text-base font-black", stat.color)}>{stat.value}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Content grid */}
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3 rounded-lg bg-slate-800/60 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">OS Recentes</p>
                      {[
                        { client: "Fazenda Boa Vista", type: "Laudo CAR", status: "Em Andamento", color: "text-blue-400" },
                        { client: "Sítio São João", type: "Vistoria NDVI", status: "Pendente", color: "text-amber-400" },
                        { client: "Rancho Alegre", type: "Regularização", status: "Concluída", color: "text-emerald-400" },
                      ].map((os) => (
                        <div key={os.client} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-emerald-700/30 flex items-center justify-center">
                              <Leaf className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-300">{os.client}</p>
                              <p className="text-[9px] text-slate-500">{os.type}</p>
                            </div>
                          </div>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-current/10", os.color)}>
                            {os.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="col-span-2 space-y-2">
                      <div className="rounded-lg bg-gradient-to-br from-emerald-700/40 to-teal-700/40 p-3 border border-emerald-500/20">
                        <Satellite className="w-4 h-4 text-emerald-400 mb-1.5" />
                        <p className="text-[10px] font-bold text-white">Monitor Satélite</p>
                        <p className="text-[9px] text-emerald-300">NDVI · DETER · MapBiomas</p>
                        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                        </div>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mb-1.5" />
                        <p className="text-[10px] font-bold text-amber-300">2 Alertas Ativos</p>
                        <p className="text-[9px] text-slate-500">Compliance CAR pendente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats Section ───────────────────────────────────────────────────────────

function StatsSection() {
  const stats = [
    { value: 1200, suffix: "+", label: "Propriedades Monitoradas", icon: MapPin },
    { value: 340, suffix: "+", label: "Engenheiros na Plataforma", icon: PencilRuler },
    { value: 18000, suffix: "+", label: "Laudos Emitidos", icon: FileText },
    { value: 98, suffix: "%", label: "Satisfação dos Clientes", icon: Star },
  ]

  return (
    <section className="py-20 bg-slate-900 border-y border-white/5">
      <div className="container mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:border-emerald-500/40 transition-colors">
                <stat.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-4xl md:text-5xl font-black text-white mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Features Section ────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: "Laudos & Vistorias",
      desc: "Gere laudos técnicos profissionais com assinatura digital, ART e envio automático para o cliente. Fluxo completo de revisão e aprovação.",
      color: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      tags: ["ART", "Assinatura Digital", "PDF automático"],
    },
    {
      icon: Satellite,
      title: "Monitor por Satélite",
      desc: "Detecte desmatamento em tempo real com imagens INPE/DETER. Calcule NDVI, compare histórico temporal e gere alertas automáticos de compliance.",
      color: "from-blue-500/20 to-teal-500/20",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      tags: ["NDVI", "DETER/PRODES", "MapBiomas"],
    },
    {
      icon: ClipboardList,
      title: "Ordens de Serviço",
      desc: "Gerencie todo o fluxo de OS do campo até o escritório. Atribua engenheiros e técnicos, acompanhe status e receba atualizações em tempo real.",
      color: "from-violet-500/20 to-blue-500/20",
      border: "border-violet-500/20",
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
      tags: ["Fluxo Completo", "Notificações", "Histórico"],
    },
    {
      icon: BarChart3,
      title: "Compliance CAR",
      desc: "Automatize o Cadastro Ambiental Rural, licenciamentos e toda documentação exigida pelo órgão ambiental. Reduza erros e tempo de regularização.",
      color: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/20",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      tags: ["CAR", "Licenciamento", "SINAFLOR"],
    },
    {
      icon: Users,
      title: "Portal do Proprietário",
      desc: "Proprietários rurais têm acesso ao portal para acompanhar laudos, ordens de serviço, alertas e documentação de suas propriedades em tempo real.",
      color: "from-teal-500/20 to-emerald-500/20",
      border: "border-teal-500/20",
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/10",
      tags: ["Portal Web", "Notificações", "Documentos"],
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira",
      desc: "Emita propostas e cobranças, acompanhe faturamento e inadimplência. Relatórios financeiros completos para sua consultoria.",
      color: "from-pink-500/20 to-rose-500/20",
      border: "border-pink-500/20",
      iconColor: "text-pink-400",
      iconBg: "bg-pink-500/10",
      tags: ["Faturamento", "Cobranças", "Relatórios"],
    },
  ]

  return (
    <section id="features" className="py-28 bg-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5">
            Funcionalidades Completas
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            Tudo que sua consultoria<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">precisa para crescer</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Uma plataforma completa que substitui planilhas, e-mails e sistemas dispersos. Do campo ao escritório, tudo conectado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={cn(
                "relative p-7 rounded-3xl border bg-gradient-to-br cursor-default",
                "hover:shadow-2xl transition-all duration-300",
                feature.color, feature.border
              )}
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", feature.iconBg)}>
                <feature.icon className={cn("w-7 h-7", feature.iconColor)} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{feature.desc}</p>
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-400 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Dashboard Showcase Section ──────────────────────────────────────────────

function DashboardSection() {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      label: "Visão Geral",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Clientes", value: "124", icon: Users, color: "text-emerald-400", border: "border-l-emerald-500" },
              { label: "OS Abertas", value: "37", icon: ClipboardList, color: "text-amber-400", border: "border-l-amber-500" },
              { label: "Laudos/Mês", value: "89", icon: FileText, color: "text-violet-400", border: "border-l-violet-500" },
            ].map((s) => (
              <div key={s.label} className={cn("p-4 rounded-xl bg-slate-800/60 border-l-2", s.border)}>
                <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ordens de Serviço Recentes</p>
            {[
              { client: "Fazenda Boa Vista", type: "Laudo CAR", status: "Em Andamento", status_color: "text-blue-400 bg-blue-400/10" },
              { client: "Sítio São João", type: "Vistoria NDVI", status: "Pendente", status_color: "text-amber-400 bg-amber-400/10" },
              { client: "Rancho Alegre", type: "Regularização", status: "Concluída", status_color: "text-emerald-400 bg-emerald-400/10" },
              { client: "Fazenda Santa Maria", type: "Licenciamento", status: "Em Andamento", status_color: "text-blue-400 bg-blue-400/10" },
            ].map((os) => (
              <div key={os.client} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700/20 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{os.client}</p>
                    <p className="text-xs text-slate-500">{os.type}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", os.status_color)}>{os.status}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Monitor Satélite",
      icon: Satellite,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-800/60">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 h-48 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_70%)]" />
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.4) 1px, transparent 1px)`,
                backgroundSize: "24px 24px"
              }} />
              <div className="relative text-center">
                <Satellite className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-pulse" />
                <p className="text-sm font-bold text-emerald-400">Mapa Satelital</p>
                <p className="text-xs text-slate-400">Propriedade: Fazenda Boa Vista — 1.240 ha</p>
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {["NDVI", "DETER", "Híbrido"].map((layer) => (
                  <span key={layer} className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/20">{layer}</span>
                ))}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { label: "NDVI Médio", value: "0.72", sub: "Vegetação saudável", color: "text-emerald-400" },
                { label: "Alerta DETER", value: "0", sub: "Nenhuma ocorrência", color: "text-emerald-400" },
                { label: "Área Verde", value: "94%", sub: "vs. 90% no CAR", color: "text-teal-400" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className={cn("text-xl font-black", m.color)}>{m.value}</p>
                  <p className="text-[10px] font-bold text-white">{m.label}</p>
                  <p className="text-[10px] text-slate-500">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Alertas Recentes</p>
            {[
              { prop: "Fazenda Santa Clara", alert: "Atividade no buffer do CAR", severity: "Crítico", color: "text-red-400 bg-red-400/10" },
              { prop: "Sítio Recanto Verde", alert: "Variação NDVI acima do normal", severity: "Atenção", color: "text-amber-400 bg-amber-400/10" },
            ].map((a) => (
              <div key={a.prop} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", a.color.split(" ")[0])} />
                <div>
                  <p className="text-sm font-bold text-white">{a.prop}</p>
                  <p className="text-xs text-slate-500">{a.alert}</p>
                </div>
                <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0", a.color)}>{a.severity}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Laudos",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Laudos Técnicos</p>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">89 este mês</span>
          </div>
          {[
            { code: "LT-2026-089", title: "Laudo de Conformidade CAR", client: "Fazenda Boa Vista", engineer: "Eng. Carlos Mendes", status: "Emitido", status_color: "text-emerald-400 bg-emerald-400/10" },
            { code: "LT-2026-088", title: "Avaliação NDVI Semestral", client: "Sítio Recanto", engineer: "Eng. Ana Silva", status: "Em Revisão", status_color: "text-amber-400 bg-amber-400/10" },
            { code: "LT-2026-087", title: "Laudo de Supressão Vegetal", client: "Agropec. Horizonte", engineer: "Eng. Carlos Mendes", status: "Rascunho", status_color: "text-slate-400 bg-slate-400/10" },
            { code: "LT-2026-086", title: "Relatório de Impacto Ambiental", client: "Rancho São Pedro", engineer: "Eng. Maria Costa", status: "Emitido", status_color: "text-emerald-400 bg-emerald-400/10" },
          ].map((l) => (
            <div key={l.code} className="rounded-xl bg-slate-800/60 p-4 hover:bg-slate-800 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.code} · {l.client}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{l.engineer}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0", l.status_color)}>{l.status}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Financeiro",
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Receita do Mês", value: "R$ 48.200", trend: "+12%", up: true, color: "text-emerald-400" },
              { label: "Ticket Médio", value: "R$ 1.340", trend: "+5%", up: true, color: "text-teal-400" },
              { label: "OS Faturadas", value: "36", trend: "de 37", up: true, color: "text-blue-400" },
              { label: "Inadimplência", value: "R$ 2.100", trend: "-8%", up: false, color: "text-pink-400" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-slate-800/60 p-4">
                <p className={cn("text-xl font-black", k.color)}>{k.value}</p>
                <p className="text-xs text-slate-400 font-bold mt-1">{k.label}</p>
                <div className={cn("flex items-center gap-1 mt-1 text-xs font-bold", k.up ? "text-emerald-400" : "text-red-400")}>
                  <TrendingUp className="w-3 h-3" /> {k.trend}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cobranças Recentes</p>
            {[
              { client: "Fazenda Boa Vista", value: "R$ 3.800", status: "Pago", status_color: "text-emerald-400 bg-emerald-400/10" },
              { client: "Agropec. Horizonte", value: "R$ 5.200", status: "Pago", status_color: "text-emerald-400 bg-emerald-400/10" },
              { client: "Sítio Recanto", value: "R$ 2.100", status: "Pendente", status_color: "text-amber-400 bg-amber-400/10" },
            ].map((c) => (
              <div key={c.client} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-bold text-white">{c.client}</p>
                  <p className="text-xs text-slate-500">{c.value}</p>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", c.status_color)}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="dashboard" className="py-28 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-5">
            Dashboard em Tempo Real
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            Controle total na palma<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">da sua mão</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Visualize métricas, OS, laudos e alertas satelitais em um painel centralizado. Tome decisões baseadas em dados reais.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-emerald-600/10 rounded-[40px] blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] bg-slate-900">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/80 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 h-7 rounded-md bg-slate-700/50 flex items-center px-4 gap-2">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-slate-400 font-mono">agroflowai.com.br/dashboard</span>
                </div>
                <div className="flex gap-2">
                  {tabs.map((tab, i) => (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activeTab === i
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <tab.icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard content */}
              <div className="grid grid-cols-12 min-h-[520px] bg-slate-950">
                {/* Sidebar */}
                <div className="col-span-2 bg-slate-950 border-r border-white/5 p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-2 py-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-black text-white hidden sm:block">AgroFlow</span>
                  </div>
                  {[
                    { icon: BarChart3, label: "Dashboard", idx: 0 },
                    { icon: Satellite, label: "Satélite", idx: 1 },
                    { icon: FileText, label: "Laudos", idx: 2 },
                    { icon: ClipboardList, label: "OS" },
                    { icon: Users, label: "Clientes" },
                    { icon: DollarSign, label: "Financeiro", idx: 3 },
                    { icon: TrendingUp, label: "Leads" },
                    { icon: PencilRuler, label: "Equipe" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => item.idx !== undefined && setActiveTab(item.idx)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-lg w-full text-left transition-colors",
                        activeTab === item.idx ? "bg-emerald-600/20 text-emerald-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium hidden sm:block">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Main */}
                <div className="col-span-10 p-6 overflow-auto">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-black text-white">{tabs[activeTab].label}</h2>
                      <p className="text-xs text-slate-500">Última atualização: há 2 minutos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400">Ao vivo</span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      {tabs[activeTab].content}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How it Works Section ────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Cadastre sua consultoria",
      desc: "Em minutos, configure sua conta, adicione sua equipe de engenheiros e técnicos e personalize o sistema com a identidade da sua empresa.",
      icon: Zap,
      color: "from-emerald-500 to-teal-500",
    },
    {
      step: "02",
      title: "Cadastre propriedades e clientes",
      desc: "Importe ou cadastre as propriedades rurais dos seus clientes com todos os dados do CAR. O sistema já prepara os formulários automaticamente.",
      icon: MapPin,
      color: "from-teal-500 to-blue-500",
    },
    {
      step: "03",
      title: "Gerencie OS e emita laudos",
      desc: "Crie ordens de serviço, atribua à equipe de campo e gere laudos profissionais em PDF com assinatura digital diretamente pela plataforma.",
      icon: ClipboardList,
      color: "from-blue-500 to-violet-500",
    },
    {
      step: "04",
      title: "Monitore por satélite e cresça",
      desc: "Acompanhe as propriedades pelo satélite, receba alertas de compliance e use os dados para captar novos clientes e expandir sua consultoria.",
      icon: TrendingUp,
      color: "from-violet-500 to-emerald-500",
    },
  ]

  return (
    <section className="py-28 bg-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-5">
            Como Funciona
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            Do cadastro ao laudo<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">em 4 passos simples</span>
          </h2>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] h-0.5 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-violet-500/30" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", step.color)}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                    <span className="text-[9px] font-black text-slate-400">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Satellite Section ───────────────────────────────────────────────────────

function SatelliteSection() {
  const features = [
    { title: "Detecção de Desmatamento", desc: "Alertas automáticos via INPE DETER/PRODES com notificações em tempo real." },
    { title: "Análise NDVI", desc: "Índice de vegetação calculado automaticamente com histórico temporal comparável." },
    { title: "MapBiomas Integration", desc: "Classificação de uso e cobertura do solo de acordo com o MapBiomas." },
    { title: "Comparação Temporal", desc: "Compare imagens de satélite de diferentes períodos para documentar mudanças." },
    { title: "Sobreposição CAR", desc: "Visualize áreas de preservação permanente e reserva legal sobre o CAR." },
    { title: "Relatórios Automáticos", desc: "Gere relatórios de monitoramento satelital com um clique, prontos para protocolos." },
  ]

  return (
    <section id="satellite" className="py-28 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-6">
              Monitor Satelital
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Olho do espaço<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">nas suas propriedades</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Integração direta com INPE, MapBiomas e imagens multiespectrais de alta resolução. Detecte qualquer alteração nas propriedades dos seus clientes antes mesmo deles perceberem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">{f.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {["MapBiomas", "INPE DETER", "PRODES", "NDVI", "SINAFLOR", "Google Earth Engine"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-teal-600/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-blue-500/20 overflow-hidden bg-slate-900">
                {/* Satellite map visual */}
                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 h-72 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      radial-gradient(circle at 30% 40%, rgba(16,185,129,0.25) 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(20,184,166,0.2) 0%, transparent 50%),
                      radial-gradient(circle at 50% 20%, rgba(59,130,246,0.1) 0%, transparent 40%)
                    `
                  }} />
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px"
                  }} />

                  {/* Property polygon simulation */}
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 280">
                    <polygon points="80,60 280,40 340,180 200,230 60,200" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.6)" strokeWidth="1.5" />
                    <polygon points="120,90 200,80 220,140 130,160" fill="rgba(20,184,166,0.2)" stroke="rgba(20,184,166,0.5)" strokeWidth="1" strokeDasharray="4,3" />
                    <polygon points="210,90 280,70 310,130 240,150" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
                  </svg>

                  <div className="relative text-center z-10">
                    <motion.div
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Satellite className="w-14 h-14 text-blue-400 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-sm font-bold text-blue-300">Monitoramento em Tempo Real</p>
                    <p className="text-xs text-slate-400 mt-1">Fazenda Boa Vista · 1.240 ha</p>
                  </div>

                  {/* Legend */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {[
                      { color: "bg-emerald-400", label: "Área Total" },
                      { color: "bg-teal-400", label: "Reserva Legal" },
                      { color: "bg-blue-400", label: "APP" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1">
                        <div className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
                        <span className="text-[10px] text-white font-bold">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div className="p-5 grid grid-cols-3 gap-4 border-t border-white/5">
                  {[
                    { label: "NDVI Médio", value: "0.72", sub: "Saudável", color: "text-emerald-400" },
                    { label: "Alertas", value: "0", sub: "Nenhum ativo", color: "text-emerald-400" },
                    { label: "Área Verde", value: "94%", sub: "vs CAR: 90%", color: "text-teal-400" },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className={cn("text-2xl font-black", m.color)}>{m.value}</p>
                      <p className="text-xs font-bold text-white mt-0.5">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Carlos Eduardo Mendes",
      role: "Engenheiro Ambiental • Consultoria Mendes & Associados",
      avatar: "CM",
      color: "from-emerald-500 to-teal-600",
      text: "O AgroFlowAI transformou nossa consultoria. Antes levávamos 3 dias para emitir um laudo, agora fazemos em horas. O monitor satelital nos permitiu identificar irregularidades que nossos clientes nem sabiam que tinham.",
      stars: 5,
    },
    {
      name: "Ana Paula Silva",
      role: "Gestora Ambiental • AgroTech Consultoria",
      avatar: "AS",
      color: "from-teal-500 to-blue-600",
      text: "A gestão das ordens de serviço ficou muito mais organizada. Minha equipe de técnicos de campo agora se comunica em tempo real comigo. Recomendo para qualquer consultoria ambiental que quer crescer.",
      stars: 5,
    },
    {
      name: "Roberto Figueiredo",
      role: "Proprietário Rural • Fazenda Boa Vista",
      avatar: "RF",
      color: "from-blue-500 to-violet-600",
      text: "Como proprietário rural, finalmente tenho acesso fácil aos laudos e situação do meu CAR. O portal do cliente é intuitivo e recebi alertas que me ajudaram a regularizar áreas antes de ser autuado.",
      stars: 5,
    },
    {
      name: "Fernanda Costa",
      role: "Diretora Técnica • Verde Compliance",
      avatar: "FC",
      color: "from-violet-500 to-pink-600",
      text: "Faturamos 40% mais neste ano porque conseguimos atender mais clientes com a mesma equipe. A automação dos laudos e o controle financeiro integrado foram divisores de água para nosso escritório.",
      stars: 5,
    },
  ]

  return (
    <section id="testimonials" className="py-28 bg-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-5">
            Depoimentos
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            Quem usa,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">aprova</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Consultorias e engenheiros de todo o Brasil já transformaram seus negócios com o AgroFlowAI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -3 }}
              className="p-7 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-all duration-300"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6 text-sm">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-sm", t.color)}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Section ─────────────────────────────────────────────────────────

function PricingSection() {
  const highlights = [
    { icon: "🌿", label: "Implantação especializada", desc: "Time de agronomia e TI configura o sistema para sua consultoria" },
    { icon: "📡", label: "Monitor Satelital ativado", desc: "Integração com INPE e Brazil Data Cube configurada para suas propriedades" },
    { icon: "📋", label: "Templates de laudos", desc: "Modelamos os formulários de CAR, ART e licenciamentos do seu estado" },
    { icon: "🤝", label: "Suporte contínuo", desc: "Acompanhamento na adoção e evolução da plataforma" },
  ]

  return (
    <section id="pricing" className="py-28 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5">
            Implementação
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            Instalado pelo<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">nosso time especialista</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            O AgroFlowAI é implantado com suporte especializado. Entre em contato para que nossa equipe conheça sua consultoria e configure a solução ideal.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 bg-slate-800/50 rounded-2xl p-6 border border-white/5 text-left"
            >
              <span className="text-3xl">{h.icon}</span>
              <div>
                <p className="font-bold text-white mb-1">{h.label}</p>
                <p className="text-slate-400 text-sm">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-10 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)]"
        >
          <h3 className="text-2xl font-black text-white mb-3">Pronto para digitalizar sua consultoria?</h3>
          <p className="text-slate-400 mb-8">
            Fale com nosso time e receba uma demonstração exclusiva do AgroFlowAI para sua consultoria ambiental.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Olá! Tenho interesse no AgroFlowAI para minha consultoria ambiental."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-14 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
            >
              <Leaf className="w-5 h-5" />
              Falar com um especialista
            </a>
            <a
              href="mailto:contato@workflowpro.com.br"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/5 font-bold h-14 px-8 rounded-xl transition-all"
            >
              Solicitar demonstração
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    {
      q: "Preciso de conhecimento técnico em TI para usar o AgroFlowAI?",
      a: "Não. A plataforma foi projetada para engenheiros e técnicos ambientais, não para programadores. A interface é intuitiva e você começa a usar no mesmo dia do cadastro. Oferecemos treinamento completo para sua equipe.",
    },
    {
      q: "Como funciona o monitor satelital? Preciso de algum software extra?",
      a: "Não precisa de nenhum software adicional. Tudo funciona direto no navegador. Usamos imagens de satélite de alta resolução integradas ao INPE, MapBiomas e Google Earth Engine. Basta cadastrar a propriedade com o polígono e o sistema faz o resto.",
    },
    {
      q: "Meus dados e os dos meus clientes são seguros?",
      a: "Sim. Utilizamos criptografia de ponta a ponta, servidores com certificação ISO 27001 e backup automático diário. Seus dados nunca são compartilhados com terceiros. Estamos em conformidade com a LGPD.",
    },
    {
      q: "Consigo migrar minha base de dados atual para o AgroFlowAI?",
      a: "Sim. Nossa equipe de onboarding te auxilia na migração de dados de planilhas, sistemas legados e outros softwares. Para planos Enterprise, fazemos a migração completa sem custo adicional.",
    },
    {
      q: "O sistema funciona para vistorias no campo sem internet?",
      a: "Estamos desenvolvendo o modo offline para o aplicativo móvel. Atualmente, o sistema funciona em qualquer dispositivo com navegador (celular, tablet, computador) com conexão à internet.",
    },
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim, sem burocracia. Você pode cancelar quando quiser pelo painel de configurações, sem taxas de cancelamento. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.",
    },
  ]

  return (
    <section className="py-28 bg-slate-950 text-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Perguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">frequentes</span>
          </h2>
          <p className="text-slate-400">Tem outra dúvida? <a href="mailto:contato@agroflowai.com.br" className="text-emerald-400 hover:underline">Fale conosco</a></p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-white/5 rounded-2xl overflow-hidden bg-slate-900/30"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-white/3 transition-colors"
              >
                <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-7 pb-5">
                      <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-28 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <div className="absolute -inset-20 bg-gradient-to-r from-emerald-900/30 via-teal-900/30 to-emerald-900/30 rounded-full blur-3xl" />
          <div className="relative z-10 px-8 py-20 rounded-[40px] border border-emerald-500/20 bg-gradient-to-b from-emerald-950/50 to-slate-900/50 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-600/40">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              Pronto para transformar<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">sua consultoria?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de consultorias ambientais que já digitalizam seus processos e atendem mais clientes com menos esforço.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-16 px-12 text-lg rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.5)] font-bold text-white border-none group" asChild>
                <Link href="/solutions/agroflowai/register">
                  Criar conta grátis agora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                14 dias grátis · Sem cartão de crédito
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 text-sm text-slate-500">
              {[
                { icon: Phone, text: "(11) 9 9999-9999" },
                { icon: Mail, text: "contato@agroflowai.com.br" },
                { icon: Globe, text: "agroflowai.com.br" },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-2 hover:text-slate-300 transition-colors">
                  <c.icon className="w-4 h-4 text-emerald-500" />
                  {c.text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const links = {
    Produto: ["Funcionalidades", "Monitor Satélite", "Dashboard", "Planos"],
    Recursos: ["Central de Ajuda", "Documentação", "API", "Blog Ambiental"],
    Empresa: ["Sobre nós", "Cases de sucesso", "Parceiros", "Contato"],
    Legal: ["Termos de uso", "Privacidade", "LGPD", "Segurança"],
  }

  return (
    <footer className="bg-slate-950 text-slate-500 border-t border-white/5">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-xl">
                Agro<span className="text-emerald-400">Flow</span>AI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-slate-600">
              A plataforma completa para compliance ambiental e engenharia no agronegócio brasileiro.
            </p>
            <div className="flex flex-wrap gap-2">
              {["MapBiomas", "INPE", "CAR"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{category}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-600 hover:text-slate-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-700">© 2026 AgroFlowAI · akaaicore Builder. Todos os direitos reservados.</p>
          <p className="text-xs text-slate-700 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-800" />
            Dados protegidos · LGPD compliant · ISO 27001
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgroFlowAILandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => { document.documentElement.style.scrollBehavior = "" }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DashboardSection />
      <HowItWorksSection />
      <SatelliteSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
