"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, X, ChevronRight, Percent, TrendingUp, Users, Zap } from "lucide-react"
import { OFFICIAL_LOGO } from "@/config/branding"
import { HeroCanvas } from "@/components/home/hero-canvas"
import { HeroGridOverlay } from "@/components/home/hero-grid-overlay"
import { DustCanvas } from "@/components/home/dust-canvas"
import { GlobalSpine, GlobalTechOverlay } from "@/components/home/global-overlays"
import { LineupSectionBackground } from "@/components/home/lineup-section-background"
import { CoreSectionBackground } from "@/components/home/core-section-background"

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 }

function AffiliateNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-zinc-800/80 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-16 flex items-center justify-between gap-8">
        <Link
          href="/portal/affiliate"
          className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-black shrink-0">
            <Image src={OFFICIAL_LOGO} alt="AKAAI" width={24} height={24} className="object-contain" />
          </div>
          <span>AKAAI</span>
          <span className="text-white/50">AFILIADOS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <a
            href="#beneficios"
            className="px-5 py-3 text-[11px] font-bold text-white/50 hover:text-white transition-all uppercase tracking-[0.2em]"
          >
            Benefícios
          </a>
          <a
            href="#como-funciona"
            className="px-5 py-3 text-[11px] font-bold text-white/50 hover:text-white transition-all uppercase tracking-[0.2em]"
          >
            Como Funciona
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="font-bold text-xs" asChild>
            <Link href="/portal/affiliate/login">Entrar</Link>
          </Button>
          <Button size="sm" className="hidden sm:flex px-6 font-black text-xs" asChild>
            <Link href="/portal/affiliate/register">
              Começar Agora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
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
              <a
                href="#beneficios"
                className="text-white/80 hover:text-white flex items-center justify-between text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefícios <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="#como-funciona"
                className="text-white/80 hover:text-white flex items-center justify-between text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Como Funciona <ChevronRight className="w-4 h-4" />
              </a>
              <div className="h-px bg-zinc-800 my-2" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link href="/portal/affiliate/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button type="button" variant="outline" className="w-full font-bold text-sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/portal/affiliate/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button type="button" className="w-full font-black text-sm">
                    Começar
                  </Button>
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
    <section
      id="hero"
      className="relative min-h-[90vh] pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden bg-black"
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }}
      />
      <div className="absolute inset-0 z-0 min-h-full w-full">
        <HeroCanvas />
      </div>
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/70"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)",
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
            Programa de Afiliados
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[100px] font-black tracking-tighter mb-10 leading-[0.92] text-white"
          >
            GANHE COM A AKAAI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed font-medium"
          >
            Indique clientes para o ecossistema AKAAI CORE e receba comissões recorrentes. Ferramentas, links e dashboard para acompanhar seus ganhos em tempo real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Button size="lg" className="h-12 px-10 text-base font-black" asChild>
              <Link href="/portal/affiliate/register">
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-10 text-base font-bold" asChild>
              <Link href="/portal/affiliate/login">Já sou afiliado</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  const benefits = [
    {
      icon: Percent,
      title: "Comissões recorrentes",
      desc: "Ganhe uma porcentagem sobre cada assinatura ativa que você indicar. Pagamentos mensais.",
    },
    {
      icon: TrendingUp,
      title: "Dashboard de performance",
      desc: "Acompanhe cliques, conversões e ganhos em tempo real. Links rastreáveis e relatórios.",
    },
    {
      icon: Users,
      title: "Múltiplos ecossistemas",
      desc: "Indique para DanceFlow, Fire Protection, AgroFlow e outras verticalizações. Um link, vários produtos.",
    },
    {
      icon: Zap,
      title: "Sem custo para começar",
      desc: "Cadastro gratuito. Materiais de divulgação, landing pages e suporte para afiliados.",
    },
  ]

  return (
    <section
      id="beneficios"
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <LineupSectionBackground />
      </div>
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)",
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
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.35em] mb-4">
            Benefícios
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            POR QUE SER AFILIADO?
          </h2>
          <p className="text-white/50 font-medium max-w-xl">
            Programa transparente, comissões justas e ferramentas para você escalar seus ganhos.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
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
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow:
                    "inset 0 0 60px rgba(255,255,255,0.04), 0 0 40px rgba(255,255,255,0.02)",
                }}
              />
              <Icon className="w-10 h-10 text-white/80 mb-6 relative z-10" />
              <h3 className="font-black text-white text-lg mb-2 tracking-tight relative z-10">
                {title}
              </h3>
              <p className="text-white/50 text-sm font-medium leading-relaxed relative z-10">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CoreSectionBackground />
      </div>
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }}
      />
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6">
            PRONTO PARA COMEÇAR?
          </h2>
          <p className="text-white/50 font-medium mb-10">
            Cadastre-se em minutos e comece a indicar. Sem burocracia, sem custo inicial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button size="lg" className="h-12 px-10 text-base font-black" asChild>
              <Link href="/portal/affiliate/register">
                Cadastrar como Afiliado
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-10 text-base font-bold" asChild>
              <Link href="/home">Conhecer AKAAI CORE</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-black py-20 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to bottom, #000000 0%, transparent 100%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(255,255,255,0.02) 0%, transparent 55%)",
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
            GANHE COM A AKAAI.
          </motion.p>
          <p className="text-lg font-mono text-white/50 tracking-tight">
            Programa de Afiliados AKAAI CORE
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-white/5">
          <div className="flex items-center gap-3 font-black text-xl tracking-tighter text-white">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-black shrink-0">
              <Image src={OFFICIAL_LOGO} alt="AKAAI" width={20} height={20} className="object-contain" />
            </div>
            <span>AKAAI</span>
            <span className="text-white/40">AFILIADOS</span>
          </div>
          <div className="flex gap-10 font-medium text-white/40 text-xs uppercase tracking-widest">
            <Link href="/home" className="hover:text-white transition-colors">
              AKAAI CORE
            </Link>
            <Link href="/portal/affiliate/login" className="hover:text-white transition-colors">
              Entrar
            </Link>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs font-medium mt-10">
          © 2026 AKAAI CORE
        </p>
      </div>
    </footer>
  )
}

export default function AffiliateLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-white/20 relative">
      <DustCanvas />
      <GlobalSpine />
      <GlobalTechOverlay />
      <div className="relative z-10">
        <AffiliateNavbar />
        <HeroSection />
        <BenefitsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}
