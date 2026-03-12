"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, Menu, X, ChevronRight, Shield, Sprout, Music,
  CreditCard, Bot, Zap, Users, Globe, Smartphone, BarChart3,
} from "lucide-react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { supabase } from "@/lib/supabase"

const LineupCard3D = dynamic(() => import("@/components/home/lineup-card-3d").then((m) => ({ default: m.LineupCard3D })), {
  ssr: false,
  loading: () => (
    <div className="relative h-44 w-full overflow-hidden bg-zinc-900 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    </div>
  ),
})

type Language = 'pt' | 'en'

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 }

function Navbar() {
  const { language: lang } = useOrganization()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const navItems = {
    pt: [
      { name: "Arquitetura", href: "#architecture" },
      { name: "Verticais", href: "#lineup" },
      { name: "Core", href: "#core" },
      { name: "Tech", href: "#tech" },
    ],
    en: [
      { name: "Architecture", href: "#architecture" },
      { name: "Verticals", href: "#lineup" },
      { name: "Core", href: "#core" },
      { name: "Tech", href: "#tech" },
    ]
  }

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500",
      scrolled 
        ? "bg-black/90 backdrop-blur-xl border-b border-zinc-800/80 py-4" 
        : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-6 lg:px-16 flex items-center justify-between gap-8">
        <Link href="/home" className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white">
          <span>AKAAI</span>
          <span className="text-white/50">CORE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems[lang].map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="px-5 py-3 text-[11px] font-bold text-white/50 hover:text-white transition-all uppercase tracking-[0.2em]"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" className="hidden sm:flex font-bold text-xs text-white/70 hover:text-white" asChild>
            <Link href="/portal/affiliate">
              {lang === 'pt' ? 'Portal Afiliado' : 'Affiliate Portal'}
            </Link>
          </Button>
          {isLoggedIn ? (
            <Button size="sm" className="hidden sm:flex px-6 font-black text-xs" asChild>
              <Link href="/dashboard">
                {lang === 'pt' ? 'Acessar' : 'Access'}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="font-bold text-xs" asChild>
                <Link href="/login">
                  {lang === 'pt' ? 'Entrar' : 'Login'}
                </Link>
              </Button>
              <Button size="sm" className="hidden sm:flex px-6 font-black text-xs" asChild>
                <Link href="/register">
                  {lang === 'pt' ? 'Começar Agora' : 'Get Started'}
                </Link>
              </Button>
            </>
          )}
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
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
            transition={springTransition}
            className="md:hidden absolute top-full left-0 w-full bg-black/98 backdrop-blur-xl border-b border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col p-8 gap-6 font-bold">
              {navItems[lang].map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className="text-white/80 hover:text-white flex items-center justify-between text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name} <ChevronRight className="w-4 h-4" />
                </Link>
              ))}
              <div className="h-px bg-zinc-800 my-2" />
              <Link href="/portal/affiliate" onClick={() => setMobileMenuOpen(false)}>
                <Button type="button" variant="ghost" className="w-full font-bold text-sm text-white/80 hover:text-white justify-start">
                  {lang === 'pt' ? 'Portal Afiliado' : 'Affiliate Portal'}
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="col-span-2">
                    <Button type="button" variant="outline" className="w-full font-bold text-sm">{lang === 'pt' ? 'Acessar' : 'Access'}</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button type="button" variant="outline" className="w-full font-bold text-sm">Entrar</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button type="button" className="w-full font-black text-sm">Começar</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const section = canvas.closest("section")
    const handleMove = (e: MouseEvent) => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = null }
    section?.addEventListener("mousemove", handleMove)
    section?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = []
    const particleCount = 40

    const resize = () => {
      const parent = canvas.parentElement
      let w = parent?.clientWidth ?? 0
      let h = parent?.clientHeight ?? 0
      if (w <= 0 || h <= 0) {
        w = window.innerWidth
        h = window.innerHeight
      }
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        initParticles()
      }
    }

    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          r: Math.random() * 1.5 + 0.5,
        })
      }
    }

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const mouse = mouseRef.current

      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)

      // Brilho interativo no cursor
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.04)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 220 && dist > 0) {
            const f = (1 - dist / 220) * 0.06
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + dx
        p.y += p.vy + dy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.55 + Math.random() * 0.25})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const ddx = p.x - q.x
          const ddy = p.y - q.y
          const dist = Math.sqrt(ddx * ddx + ddy * ddy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,255,255,${0.2 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    requestAnimationFrame(resize)
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    draw()
    return () => {
      section?.removeEventListener("mousemove", handleMove)
      section?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full min-w-full min-h-full"
      style={{ opacity: 1 }}
      aria-hidden
    />
  )
}

function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    const dust: Array<{
      x: number
      y: number
      vx: number
      vy: number
      r: number
      baseOpacity: number
      phase: number
    }> = []
    const dustCount = 80

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        dust.length = 0
        for (let i = 0; i < dustCount; i++) {
          dust.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08 - 0.02,
            r: Math.random() * 0.8 + 0.2,
            baseOpacity: 0.08 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const t = Date.now() * 0.001
      for (const d of dust) {
        d.x += d.vx + Math.sin(t + d.phase) * 0.05
        d.y += d.vy
        if (d.x < -10) d.x = canvas.width + 10
        if (d.x > canvas.width + 10) d.x = -10
        if (d.y < -10) d.y = canvas.height + 10
        if (d.y > canvas.height + 10) d.y = -10

        const flicker = 0.85 + Math.sin(t * 2 + d.phase * 3) * 0.15
        const opacity = d.baseOpacity * flicker

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    draw()

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId)
      } else {
        animationId = requestAnimationFrame(draw)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", handleVisibility)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ opacity: 1 }}
      aria-hidden
    />
  )
}

function HeroGridOverlay() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const section = document.getElementById("hero")
    if (!section) return
    const handleMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setOffset({ x: x * 8, y: y * 8 })
    }
    const handleLeave = () => setOffset({ x: 0, y: 0 })
    section.addEventListener("mousemove", handleMove)
    section.addEventListener("mouseleave", handleLeave)
    return () => {
      section.removeEventListener("mousemove", handleMove)
      section.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 opacity-30 z-[1] transition-transform duration-150 ease-out pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'linear-gradient(to bottom, black 20%, transparent 85%)',
        backgroundPosition: `${40 + offset.x}px ${40 + offset.y}px`,
      }}
      aria-hidden
    />
  )
}

function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[90vh] pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden bg-black">
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[2]" style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }} />
      {/* Animação canvas — rede de partículas interativas */}
      <div className="absolute inset-0 z-0 min-h-full w-full">
        <HeroCanvas />
      </div>
      {/* Overlay sutil para legibilidade do texto */}
      <div 
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/70"
        aria-hidden
      />
      <div 
        className="absolute inset-0 z-[1]"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)',
        }}
      />
      <HeroGridOverlay />

      <div className="container mx-auto px-6 lg:px-16 relative z-[5]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.05 }}
            className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-8"
          >
            Ecossistema definitivo
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[100px] font-black tracking-tighter mb-10 leading-[0.92] text-white"
          >
            O CORE MUDA TUDO.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed font-medium"
          >
            Motor de verticalização de negócios. SaaS White-Label, Multi-Tenant e Omnichannel — projetado para escalar operações com IA e automação financeira.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
              <Button size="lg" className="h-12 px-10 text-base font-black" asChild>
                <Link href="/register">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-12 px-10 text-base font-bold" onClick={() => {
                const lineup = document.getElementById('lineup')
                lineup?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Verticais
              </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ArchitectureSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const section = document.getElementById("architecture")
    const handleMove = (e: MouseEvent) => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = null }
    section?.addEventListener("mousemove", handleMove)
    section?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number; phase: number }> = []
    const particleCount = 45

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        const cx = w / 2
        const cy = h / 2
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * Math.min(w, h) * 0.4
          particles.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            r: Math.random() * 1 + 0.3,
            opacity: 0.12 + Math.random() * 0.25,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, w, h)

      // Brilho interativo no cursor
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.05)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Partículas interativas — drift em direção ao cursor
      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 200 && dist > 0) {
            const f = (1 - dist / 200) * 0.07
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.08 + dx
        p.y += p.vy + dy
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const flicker = 0.8 + Math.sin(t * 0.003 + p.phase * 2) * 0.2
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * flicker})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    animationId = requestAnimationFrame(draw)

    return () => {
      section?.removeEventListener("mousemove", handleMove)
      section?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}

function ArchitectureSection() {
  const portals = [
    { label: "Super Admin", desc: "Billing, ecossistemas, verticalizações.", icon: BarChart3 },
    { label: "Parceiro", desc: "White-label, split Stripe, onboarding.", icon: Users },
    { label: "Cliente / Estúdio", desc: "ERP, CRM, financeiro, IA, WhatsApp.", icon: Globe },
    { label: "Apps de Ponta", desc: "Aluno, técnico, engenheiro, cliente.", icon: Smartphone },
  ]

  return (
    <section id="architecture" className="py-24 md:py-32 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }} />
      {/* Portal simplificado — menos camadas sobrepostas */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)",
        }}
      />
      {/* Anel único + brilho central */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none animate-portal-ring"
        style={{
          background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.03) 90deg, transparent 180deg, rgba(255,255,255,0.025) 270deg)",
          borderRadius: "50%",
          mask: "radial-gradient(circle, transparent 45%, black 52%, black 55%, transparent 62%)",
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] rounded-full pointer-events-none animate-portal-pulse"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)",
        }}
      />
      {/* Canvas interativo — partículas e brilho no cursor */}
      <ArchitectureSectionBackground />

      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="mb-16"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-4">Arquitetura</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            INUMEROS PORTAIS. UMA ENGINE.
          </h2>
          <p className="text-white/50 font-medium max-w-xl">
            AKAAI CORE é o coração do ecossistema. Portais interconectados sobre autenticação, pagamentos e gestão compartilhados.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                ...springTransition, 
                delay: i * 0.12,
                type: "spring",
                stiffness: 80,
                damping: 18,
              }}
              className="group relative border border-zinc-800 bg-zinc-950/60 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden"
            >
              {/* Brilho de portal no hover */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 60px rgba(255,255,255,0.04), 0 0 40px rgba(255,255,255,0.02)",
                }}
              />
              <Icon className="w-10 h-10 text-white/80 mb-6 relative z-10" />
              <h3 className="font-black text-white text-lg mb-2 tracking-tight relative z-10">{label}</h3>
              <p className="text-white/50 text-sm font-medium leading-relaxed relative z-10">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LineupSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    const handleMove = (e: MouseEvent) => {
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    const handleLeave = () => { mouseRef.current = null }
    parent?.addEventListener("mousemove", handleMove)
    parent?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      r: number
      opacity: number
      phase: number
      isBokeh: boolean
    }> = []
    const particleCount = 55

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        const vanishY = h * 0.15
        const vanishX = w * 0.5
        for (let i = 0; i < particleCount; i++) {
          const rnd = Math.random()
          const x = (rnd - 0.5) * w * 1.5 + vanishX
          const y = h * 0.4 + Math.random() * h * 0.7
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.1,
            r: rnd < 0.15 ? 8 + Math.random() * 12 : Math.random() * 1.5 + 0.3,
            opacity: rnd < 0.15 ? 0.12 + Math.random() * 0.2 : 0.2 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            isBokeh: rnd < 0.1,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return

      const time = t * 0.0006
      const vanishX = w * 0.5
      const vanishY = h * 0.12
      const mouse = mouseRef.current

      // Gradient: preto puro — sem azul
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, "rgb(2, 2, 2)")
      gradient.addColorStop(0.2, "rgb(1, 1, 1)")
      gradient.addColorStop(0.5, "rgb(0, 0, 0)")
      gradient.addColorStop(1, "#000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      // Linhas em perspectiva — reduzido para menos cruzamento
      const lineCount = 5
      const lineSpacing = 0.22
      const lineColor = (alpha: number) => `rgba(255, 255, 255, ${alpha})`

      for (let li = 0; li < lineCount; li++) {
        const offset = (li - (lineCount - 1) / 2) * lineSpacing
        const mouseShift = mouse ? ((mouse.x - vanishX) / w) * 12 : 0
        ctx.beginPath()
        const steps = 60
        for (let i = 0; i <= steps; i++) {
          const t0 = i / steps
          const x = (0.5 - t0) * w * 1.2 + vanishX + Math.sin(time + li) * 20 + mouseShift
          const y = h * 0.5 + t0 * h * 0.6 + Math.sin(t0 * 3 + time + li * 0.5) * 18
          const perspectiveY = vanishY + (y - vanishY) * (0.3 + 0.7 * t0)
          const perspectiveX = vanishX + (x - vanishX) * (0.2 + 0.8 * t0) + offset * w * t0
          if (i === 0) ctx.moveTo(perspectiveX, perspectiveY)
          else ctx.lineTo(perspectiveX, perspectiveY)
        }
        ctx.strokeStyle = lineColor(0.22 + 0.1 * Math.sin(time + li))
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Uma faixa de linhas curvas — menos cruzamento
      const curveShift = mouse ? ((mouse.x - w / 2) / w) * 20 : 0
      for (let c = 0; c < 2; c++) {
        ctx.beginPath()
        for (let x = -50; x <= w + 50; x += 10) {
          const y = h * (0.5 + c * 0.2) + Math.sin(x * 0.005 + time * 2) * 35 + curveShift
          if (x === -50) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = lineColor(0.1 + 0.05 * Math.sin(time * 1.5 + c))
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Brilho interativo no cursor
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.06)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Partículas — poeira/estrelas (interativas: drift sutil em direção ao cursor)
      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 200 && dist > 0) {
            const f = (1 - dist / 200) * 0.08
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.15 + dx
        p.y += p.vy + dy
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20

        const flicker = 0.75 + Math.sin(t * 0.003 + p.phase * 2) * 0.25

        if (p.isBokeh) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2)
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * flicker * 0.4})`)
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${p.opacity * flicker * 0.15})`)
          grad.addColorStop(1, "rgba(255, 255, 255, 0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * flicker * 0.9})`
          ctx.fill()
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    animationId = requestAnimationFrame(draw)

    return () => {
      parent?.removeEventListener("mousemove", handleMove)
      parent?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      aria-hidden
    />
  )
}

function LineupSection() {
  const verticals = [
    {
      id: 'fire-protection',
      name: 'Fire Protection',
      tagline: 'Engenharia & Segurança contra Incêndio',
      description: 'A segurança não espera. Gestão de ativos e compliance com a precisão que a vida exige.',
      href: '/solutions/fire-protection',
      icon: Shield,
      theme: 'fire' as const,
      imageSrc: '/images/industrial-parallax.png',
      modules: ['Ativos & QR Code', 'Ordem de Serviço', 'Vistorias digitais', 'PPCI', 'PDV', 'Relatórios IA'],
    },
    {
      id: 'agroflow',
      name: 'AgroFlow AI',
      tagline: 'Agronegócio & Monitoramento',
      description: 'O campo é digital. Monitoramento via satélite e IA preditiva. Onde a terra encontra a tecnologia.',
      href: '/solutions/agroflowai',
      icon: Sprout,
      theme: 'agro' as const,
      imageSrc: '/images/agro-parallax.png',
      modules: ['Propriedades geo-referenciadas', 'NDVI / Sentinel', 'NASA FIRMS', 'Documentos & alertas', 'OS de campo'],
    },
    {
      id: 'danceflow',
      name: 'DanceFlow',
      tagline: 'Estúdios de Dança',
      description: 'Movimento é business. A arte de gerir talentos com a ciência da performance financeira.',
      href: '/solutions/estudio-de-danca',
      icon: Music,
      theme: 'dance' as const,
      imageSrc: '/images/dance-studio-parallax.png',
      modules: ['Grade & turmas', 'Alunos & matrículas', 'Monetary Scanner', 'App Professor', 'App Aluno', 'QR de aula'],
    },
  ]

  return (
    <section id="lineup" className="py-24 md:py-32 bg-black relative overflow-hidden">
      <LineupSectionBackground />
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }} />
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="mb-20"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-4">The Lineup</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            COLEÇÕES
          </h2>
          <p className="text-white/50 font-medium max-w-xl">
            Verticais especializadas. Instancie regras de negócio diferentes no mesmo ecossistema. Powered by AKAAI CORE.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {verticals.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <Link href={v.href}>
                <div className="border border-zinc-800 bg-zinc-950/50 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-500 h-full flex flex-col">
                  <div className="relative overflow-hidden h-52">
                    <LineupCard3D icon={v.icon} index={i} theme={v.theme} imageSrc={v.imageSrc} />
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">{v.tagline}</p>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{v.name}</h3>
                    <p className="text-white/60 font-medium text-sm leading-relaxed mb-6 flex-grow">{v.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {v.modules.slice(0, 4).map((m) => (
                        <span key={m} className="text-[10px] font-mono text-white/40 bg-white/5 px-2.5 py-1 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CoreSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    const handleMove = (e: MouseEvent) => {
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    const handleLeave = () => { mouseRef.current = null }
    parent?.addEventListener("mousemove", handleMove)
    parent?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number; phase: number; isCosmic: boolean }> = []
    const particleCount = 70

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        const centerY = h * 0.5
        for (let i = 0; i < particleCount; i++) {
          const rnd = Math.random()
          const x = Math.random() * w
          const y = centerY - h * 0.35 + Math.random() * (h * 0.7)
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08,
            r: rnd < 0.12 ? 6 + Math.random() * 10 : Math.random() * 1.5 + 0.2,
            opacity: rnd < 0.12 ? 0.08 + Math.random() * 0.15 : 0.2 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            isCosmic: rnd < 0.12,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return

      // Fundo totalmente preto
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)

      const time = t * 0.0008
      const centerY = h * 0.55
      const mouse = mouseRef.current

      // Brilho interativo no cursor (antes das linhas para ficar atrás)
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.05)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Apenas ondas horizontais — removidas diagonais para menos cruzamento
      const amplitude = h * 0.06
      const frequency = 0.003
      const waveCountReduced = 4
      const waveSpacing = 50

      // Draw wavy glow lines (offset vertical interativo)
      const waveShift = mouse ? ((mouse.y - h / 2) / h) * 20 : 0
      for (let wav = 0; wav < waveCountReduced; wav++) {
        const offsetY = (wav - (waveCountReduced - 1) / 2) * waveSpacing + centerY + waveShift
        const phase = (wav / waveCountReduced) * Math.PI * 2 + time

        ctx.beginPath()
        for (let x = -20; x <= w + 20; x += 4) {
          const y = offsetY + Math.sin(x * frequency + phase) * amplitude
          if (x === -20) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Poeira cósmica brilhante (interativa)
      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 180 && dist > 0) {
            const f = (1 - dist / 180) * 0.06
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.2 + dx
        p.y += p.vy + dy
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20

        const twinkle = 0.6 + Math.sin(t * 0.004 + p.phase * 3) * 0.4
        const flicker = p.opacity * twinkle

        if (p.isCosmic) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
          grad.addColorStop(0, `rgba(255, 255, 255, ${flicker * 0.6})`)
          grad.addColorStop(0.4, `rgba(255, 255, 255, ${flicker * 0.25})`)
          grad.addColorStop(1, "rgba(255, 255, 255, 0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`
          ctx.fill()
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    animationId = requestAnimationFrame(draw)

    return () => {
      parent?.removeEventListener("mousemove", handleMove)
      parent?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      aria-hidden
    />
  )
}

function CoreSection() {
  const modules = [
    {
      title: "ERP & Estoque",
      desc: "Pedidos unificados, rastreabilidade, NCM fiscal. Rastreabilidade imutável em inventory_transactions.",
      icon: BarChart3,
    },
    {
      title: "Financeiro & Pagamentos",
      desc: "Stripe Connect Express, split automático (Plataforma, Parceiro, Cliente). Assinaturas com retry inteligente.",
      icon: CreditCard,
    },
    {
      title: "IA & Automação",
      desc: "Studio AI Reports, Chatbot (Gemini/OpenAI), AI Contact Rules. Insights sobre retenção e faturamento.",
      icon: Bot,
    },
    {
      title: "Comunicação",
      desc: "WhatsApp (Evolution API), Email (Nodemailer). Notificações, lembretes, webhooks e transacionais.",
      icon: Globe,
    },
  ]

  return (
    <section id="core" className="py-24 md:py-32 bg-black relative overflow-hidden">
      <CoreSectionBackground />
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }} />
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="mb-16"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-4">Módulos Transversais</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            O CORE
          </h2>
          <p className="text-white/50 font-medium max-w-xl">
            O coração do ecossistema. Base compartilhada de autenticação, pagamentos e gestão. Tudo que seu negócio precisa para escalar.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-5xl">
          {modules.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              className="group relative border border-zinc-800 bg-zinc-950/50 rounded-2xl p-8 hover:border-white/15 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "inset 0 0 50px rgba(255,255,255,0.03)" }} />
              <Icon className="relative z-10 w-10 h-10 text-white/80 mb-6" />
              <h3 className="relative z-10 font-black text-white text-lg mb-3 tracking-tight">{title}</h3>
              <p className="relative z-10 text-white/50 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TechSpecsSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const section = document.getElementById("tech")
    const handleMove = (e: MouseEvent) => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = null }
    section?.addEventListener("mousemove", handleMove)
    section?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number; phase: number; isCosmic: boolean }> = []
    const particleCount = 50

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        for (let i = 0; i < particleCount; i++) {
          const rnd = Math.random()
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.08,
            r: rnd < 0.1 ? 5 + Math.random() * 8 : Math.random() * 1.2 + 0.2,
            opacity: rnd < 0.1 ? 0.06 + Math.random() * 0.12 : 0.15 + Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
            isCosmic: rnd < 0.1,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, w, h)

      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.04)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 160 && dist > 0) {
            const f = (1 - dist / 160) * 0.05
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.06 + dx
        p.y += p.vy + dy
        if (p.x < -15) p.x = w + 15
        if (p.x > w + 15) p.x = -15
        if (p.y < -15) p.y = h + 15
        if (p.y > h + 15) p.y = -15

        const twinkle = 0.55 + Math.sin(t * 0.004 + p.phase * 3) * 0.45
        const flicker = p.opacity * twinkle

        if (p.isCosmic) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
          grad.addColorStop(0, `rgba(255, 255, 255, ${flicker * 0.55})`)
          grad.addColorStop(0.4, `rgba(255, 255, 255, ${flicker * 0.2})`)
          grad.addColorStop(1, "rgba(255, 255, 255, 0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`
          ctx.fill()
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    animationId = requestAnimationFrame(draw)

    return () => {
      section?.removeEventListener("mousemove", handleMove)
      section?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}

function TechSpecsSection() {
  const specs = [
    { label: 'Stripe Connect', desc: 'Sem fricção. Onboarding Express.', tag: 'Payments' },
    { label: 'Gemini AI', desc: 'O cérebro. Relatórios e chat.', tag: 'IA' },
    { label: 'Next.js 16', desc: 'Velocidade insana. App Router.', tag: 'Frontend' },
    { label: 'Supabase', desc: 'PostgreSQL. Auth. Realtime.', tag: 'Backend' },
    { label: 'React 19', desc: 'UI reativa. Server Components.', tag: 'UI' },
    { label: '~85 Migrações', desc: 'Schema evoluído. RLS.', tag: 'Database' },
  ]

  return (
    <section id="tech" className="py-24 md:py-32 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }} />
      <TechSpecsSectionBackground />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="mb-16"
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-4">The Tech Specs</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            ENGENHARIA DE ELITE.
          </h2>
          <p className="text-white/50 font-medium max-w-xl">
            Stack completa: TypeScript, Tailwind v4, Framer Motion, Shadcn/UI, Leaflet, Recharts, jsPDF.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {specs.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.06 }}
              className="group relative border border-zinc-800 bg-zinc-950/50 rounded-2xl p-8 hover:border-white/15 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "inset 0 0 50px rgba(255,255,255,0.03)" }} />
              <span className="relative z-10 text-[9px] font-mono text-white/30 uppercase tracking-widest">{s.tag}</span>
              <h3 className="relative z-10 font-mono text-sm text-white/60 uppercase tracking-wider mt-2 mb-2">{s.label}</h3>
              <p className="relative z-10 text-xl font-black text-white tracking-tight">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-black py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]" style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }} />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(255,255,255,0.02) 0%, transparent 55%)',
        }}
      />
      
      <div className="container mx-auto px-6 lg:px-16">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6"
          >
            JUST BUILD IT.
          </motion.p>
          <p className="text-lg font-mono text-white/50 tracking-tight">
            AKAAI CORE: Engine of Excellence.
          </p>
          <p className="text-xs font-mono text-white/30 mt-2">
            Also known as Artificial Intelligence HUB.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-white/5">
          <div className="flex items-center gap-3 font-black text-xl tracking-tighter text-white">
            <span>AKAAI</span>
            <span className="text-white/40">CORE</span>
          </div>
          <div className="flex gap-10 font-medium text-white/40 text-xs uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
            <Link href="#" className="hover:text-white transition-colors">Segurança</Link>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs font-medium mt-10">
          © 2026 AKAAI CORE
        </p>
      </div>
    </footer>
  )
}

function GlobalTechOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[2] min-h-[300vh]"
      style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
      aria-hidden
    />
  )
}

function GlobalSpine() {
  return (
    <div 
      className="fixed left-1/2 top-0 -translate-x-1/2 w-px min-h-[300vh] pointer-events-none z-[1] animate-tech-pulse"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.025) 35%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.04) 85%, transparent 100%)',
        boxShadow: '0 0 20px rgba(255,255,255,0.03)',
      }}
      aria-hidden
    />
  )
}

export default function HomePage() {
  const { language: lang } = useOrganization()

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-white/20 relative">
      <DustCanvas />
      <GlobalSpine />
      <GlobalTechOverlay />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ArchitectureSection />
        <LineupSection />
        <CoreSection />
        <TechSpecsSection />
        <Footer />
      </div>
    </div>
  )
}
