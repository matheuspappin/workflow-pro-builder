"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  ArrowRight,
  Music,
  Stethoscope,
  Dumbbell,
  Building2,
  Sparkles,
  Activity,
  Scissors,
  Leaf,
  PawPrint,
  BookOpen,
  UtensilsCrossed,
  Palette,
  Car,
  Wrench,
  Briefcase,
  Camera,
  Coffee,
  Wine,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeForNiche } from "@/config/niche-landing-theme"
import { nicheDictionary } from "@/config/niche-dictionary"

const ICON_MAP: Record<string, LucideIcon> = {
  Music,
  Stethoscope,
  Dumbbell,
  Building2,
  Sparkles,
  Activity,
  Scissors,
  Leaf,
  PawPrint,
  BookOpen,
  UtensilsCrossed,
  Palette,
  Car,
  Wrench,
  Briefcase,
  Camera,
  Coffee,
  Wine,
}

const BADGE_CLASS: Record<string, string> = {
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  teal: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
}

const CTA_BORDER_CLASS: Record<string, string> = {
  violet: "border-violet-500/30 bg-violet-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  rose: "border-rose-500/30 bg-rose-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  indigo: "border-indigo-500/30 bg-indigo-500/5",
  teal: "border-teal-500/30 bg-teal-500/5",
  fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/5",
}

const ICON_COLOR_CLASS: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  rose: "text-rose-400",
  amber: "text-amber-400",
  indigo: "text-indigo-400",
  teal: "text-teal-400",
  fuchsia: "text-fuchsia-400",
}

interface StudioLandingPageProps {
  studio: { name: string; slug: string }
  niche: string
  vocabulary?: Record<string, string>
}

export function StudioLandingPage({ studio, niche, vocabulary }: StudioLandingPageProps) {
  const theme = getThemeForNiche(niche)
  const Icon = ICON_MAP[theme.iconName] ?? Building2
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const dict = (nicheDictionary.pt as Record<string, { name: string }>)[niche]
  const nicheName = dict?.name ?? studio.name

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Navbar */}
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500",
          scrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href={`/s/${studio.slug}`} className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white hover:opacity-90 transition-opacity">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br", theme.gradientFrom, theme.gradientTo)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span>{studio.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#cta" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Começar
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href={`/s/${studio.slug}/login`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hidden sm:flex">
                Entrar
              </Button>
            </Link>
            <Link href={`/s/${studio.slug}/register`}>
              <Button size="sm" className={cn("font-bold", theme.gradientFrom, theme.gradientTo, "border-none")}>
                Criar Conta
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex flex-col gap-2">
              <a href="#features" className="py-2 text-white/80 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Funcionalidades
              </a>
              <a href="#cta" className="py-2 text-white/80 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Começar
              </a>
              <Link href={`/s/${studio.slug}/login`} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-white/20 text-white">Entrar</Button>
              </Link>
              <Link href={`/s/${studio.slug}/register`} onClick={() => setMobileMenuOpen(false)}>
                <Button className={cn("w-full", theme.gradientFrom, theme.gradientTo, "border-none")}>Criar Conta</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[128px] opacity-20 bg-violet-500/30" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[128px] opacity-20 bg-pink-500/30" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {theme.heroBadge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8",
                  BADGE_CLASS[theme.primaryColor] ?? BADGE_CLASS.violet
                )}
              >
                {theme.heroBadge}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-tight"
            >
              Bem-vindo ao <br />
              <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", theme.gradientFrom, theme.gradientTo)}>
                {studio.name}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10"
            >
              Gestão inteligente para {nicheName}. Cadastro, agenda, financeiro e muito mais em uma única plataforma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href={`/s/${studio.slug}/register`}>
                <Button size="lg" className={cn("h-14 px-10 text-lg font-bold", theme.gradientFrom, theme.gradientTo, "border-none")}>
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href={`/s/${studio.slug}/login`}>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/20 text-white hover:bg-white/10">
                  Já tenho conta
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo em um só lugar</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A plataforma completa para gerenciar seu {nicheName.toLowerCase()}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {theme.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
                  "hover:border-white/20 hover:bg-white/[0.07] transition-all"
                )}
              >
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "max-w-3xl mx-auto text-center p-10 rounded-3xl border",
              CTA_BORDER_CLASS[theme.primaryColor] ?? CTA_BORDER_CLASS.violet
            )}
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-slate-400 mb-8">
              Crie sua conta e tenha acesso completo ao sistema em minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/s/${studio.slug}/register`}>
                <Button size="lg" className={cn("h-14 px-10 text-lg font-bold", theme.gradientFrom, theme.gradientTo, "border-none")}>
                  Criar Conta Grátis
                </Button>
              </Link>
              <Link href={`/s/${studio.slug}/login`}>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/20 text-white">
                  Entrar
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Icon className={cn("w-5 h-5", ICON_COLOR_CLASS[theme.primaryColor] ?? ICON_COLOR_CLASS.violet)} />
          <span className="font-bold text-white">{studio.name}</span>
        </div>
        <p className="text-slate-500 text-sm mb-6">
          Powered by akaaicore · AKAAI CORE
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <Link href={`/s/${studio.slug}/login`} className="text-slate-500 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/home" className="text-slate-500 hover:text-white transition-colors">
            AKAAI HUB
          </Link>
        </div>
      </footer>
    </div>
  )
}
