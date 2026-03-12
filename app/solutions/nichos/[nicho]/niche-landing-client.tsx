"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  ArrowRight,
  Check,
  ChevronDown,
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
  Shield,
  Zap,
  Users,
  ThumbsUp,
  Clock,
  Headphones,
  AlertCircle,
  Quote,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NicheLandingContent } from "@/config/niche-landing-content"
import { OFFICIAL_LOGO } from "@/config/branding"
import { DustCanvas } from "@/components/home/dust-canvas"
import { GlobalSpine, GlobalTechOverlay } from "@/components/home/global-overlays"

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

/** Paleta akaaicore — branco/zinc neutro para nichos genéricos */
const AKAAICORE_BADGE = "border-white/20 bg-white/10 text-white/90"
const AKAAICORE_CTA_BORDER = "border-white/20 bg-white/5"
const AKAAICORE_HERO_BLUR = "bg-white/10"

const STAT_ICONS: Record<string, LucideIcon> = {
  "Negócios ativos": Users,
  "Satisfação": ThumbsUp,
  "Teste grátis": Clock,
  "Suporte": Headphones,
}

interface NicheLandingClientProps {
  niche: string
  nicheName: string
  content: NicheLandingContent
  registerUrl: string
  loginUrl: string
}

export function NicheLandingClient({
  niche,
  nicheName,
  content,
  registerUrl,
  loginUrl,
}: NicheLandingClientProps) {
  const Icon = ICON_MAP[content.iconName] ?? Building2
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden selection:bg-white/20 relative">
      <DustCanvas />
      <GlobalSpine />
      <GlobalTechOverlay />
      <div className="relative z-10">
      {/* Navbar */}
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500",
          scrolled ? "bg-black/95 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between max-w-6xl">
          <Link
            href="/home"
            className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-black shrink-0">
              <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={28} height={28} className="object-contain" />
            </div>
            <span className="hidden sm:inline">AKAAI CORE</span>
            <span className="hidden sm:inline text-white/60 font-normal">· {nicheName}</span>
            <span className="sm:hidden">AKAAI CORE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">Funcionalidades</a>
            <a href="#como-funciona" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">Como funciona</a>
            <a href="#depoimentos" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">Depoimentos</a>
            <a href="#faq" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">FAQ</a>
            <a href="#cta" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">Começar</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href={loginUrl}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hidden sm:flex">
                Entrar
              </Button>
            </Link>
            <Link href={registerUrl}>
                <Button size="sm" className="font-bold bg-white text-black hover:bg-white/90 border-none">
                Teste Grátis
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-black/98 backdrop-blur-xl border-b border-white/10 p-5">
            <nav className="flex flex-col gap-0.5">
              <a href="#features" className="py-3.5 px-2 text-white/90 font-medium rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
              <a href="#como-funciona" className="py-3.5 px-2 text-white/90 font-medium rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Como funciona</a>
              <a href="#depoimentos" className="py-3.5 px-2 text-white/90 font-medium rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
              <a href="#faq" className="py-3.5 px-2 text-white/90 font-medium rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <a href="#cta" className="py-3.5 px-2 text-white/90 font-medium rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Começar</a>
            </nav>
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
              <Link href={loginUrl} onClick={() => setMobileMenuOpen(false)} className="flex-1">
                <Button variant="outline" className="w-full border-white/20 text-white">Entrar</Button>
              </Link>
              <Link href={registerUrl} onClick={() => setMobileMenuOpen(false)} className="flex-1">
                <Button className="w-full bg-white text-black hover:bg-white/90 border-none">Teste Grátis</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/30 to-black" />
        <div className={cn("absolute top-1/4 left-1/4 w-80 sm:w-[28rem] h-80 sm:h-[28rem] rounded-full blur-[140px] opacity-20", AKAAICORE_HERO_BLUR)} />
        <div className={cn("absolute bottom-1/4 right-1/4 w-80 sm:w-[28rem] h-80 sm:h-[28rem] rounded-full blur-[140px] opacity-15", AKAAICORE_HERO_BLUR)} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center">
            {content.heroBadge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6 sm:mb-8", AKAAICORE_BADGE)}
              >
                {content.heroBadge}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-5 sm:mb-6 leading-[1.1]"
            >
              {content.heroHeadline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
            >
              {content.heroSubheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link href={registerUrl}>
                <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold bg-white text-black hover:bg-white/90 border-none shadow-lg hover:shadow-xl transition-shadow">
                  Começar teste grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href={loginUrl}>
                <Button size="lg" variant="outline" className="h-12 sm:h-14 px-8 sm:px-10 text-base border-white/20 text-white hover:bg-white/10">
                  Já tenho conta
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            {content.trustBadges?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-slate-500 text-sm"
              >
                {content.trustBadges.map((badge, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white/90" />
                    </span>
                    {badge}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pain points */}
      {content.painPoints?.length > 0 && (
        <section className="py-16 sm:py-24 bg-zinc-950/50 border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">Você passa por isso?</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Problemas comuns que resolvemos todos os dias</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {content.painPoints.map((pain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/10 text-white/80">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90 mb-2 group-hover:text-white transition-colors">{pain.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{pain.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">Tudo que você precisa em um só lugar</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Funcionalidades pensadas para o seu dia a dia</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {(content.extendedFeatures ?? content.features).map((feature, i) => {
              const isHighlight = (feature as { highlight?: boolean }).highlight
              const FeatureIcon = ICON_MAP[content.iconName] ?? Building2
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "group p-6 sm:p-8 rounded-2xl border transition-all duration-300",
                    isHighlight
                      ? "border-white/20 bg-white/[0.08] shadow-lg shadow-black/20"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    isHighlight ? "bg-white/20 text-white" : "bg-white/10 text-white/80"
                  )}>
                    <FeatureIcon className="w-6 h-6" />
                  </div>
                  <h3 className={cn("text-lg font-bold mb-2", isHighlight ? "text-white" : "text-white group-hover:text-white")}>{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-zinc-950/50 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">Comece em 3 passos</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Simples, rápido e sem complicação</p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-0.5 bg-white/10" />
            <div className="grid md:grid-cols-3 gap-8 md:gap-4">
              {content.howItWorks.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-black bg-white shadow-lg">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-[240px]">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {content.stats?.length > 0 && (
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {content.stats.map((stat, i) => {
                const StatIcon = STAT_ICONS[stat.label] ?? Building2
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "relative p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.03]",
                      "hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300",
                      "backdrop-blur-sm"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/20">
                      <StatIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                      {stat.value}
                    </p>
                    <p className="text-slate-400 text-sm sm:text-base mt-1 font-medium">{stat.label}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {content.testimonials?.length > 0 && (
        <section id="depoimentos" className="py-16 sm:py-24 bg-zinc-950/50 border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">O que dizem quem usa</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Profissionais que já transformaram a gestão do negócio</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {content.testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-6 sm:p-8 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm hover:border-white/20 transition-all duration-300"
                >
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-white/10" />
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 pr-8">&ldquo;{t.quote}&rdquo;</p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="font-bold text-white">{t.author}</p>
                    <p className="text-slate-500 text-sm">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {content.faq?.length > 0 && (
        <section id="faq" className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">Perguntas frequentes</h2>
              <p className="text-slate-400 text-base sm:text-lg">Tire suas dúvidas antes de começar</p>
            </div>
            <div className="space-y-3">
              {content.faq.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={cn(
                    "rounded-2xl border overflow-hidden transition-all duration-300",
                    openFaq === i ? "border-white/20 bg-white/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/15"
                  )}
                >
                  <button
                    type="button"
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left font-medium text-white hover:bg-white/[0.03] transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm sm:text-base">{item.question}</span>
                    <ChevronDown className={cn("w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200", openFaq === i && "rotate-180")} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 sm:px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {item.answer}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section id="cta" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "text-center p-8 sm:p-14 rounded-3xl border shadow-2xl",
              AKAAICORE_CTA_BORDER
            )}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto text-base sm:text-lg">
              Crie sua conta em 2 minutos. Teste grátis por 14 dias. Sem cartão de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={registerUrl}>
                <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow bg-white text-black hover:bg-white/90 border-none">
                  Começar teste grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href={loginUrl}>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/20 text-white hover:bg-white/10">
                  Já tenho conta
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-white/80" /> LGPD</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-white/80" /> Ative em minutos</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 border-t border-white/10 bg-black/80">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-black">
                <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={26} height={26} className="object-contain" />
              </div>
              <div>
                <span className="font-bold text-white block">AKAAI CORE</span>
                <span className="text-white/50 text-sm">· {nicheName}</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm">Powered by AKAAI CORE</p>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href={loginUrl} className="text-slate-500 hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="text-slate-500 hover:text-white transition-colors">Cadastrar</Link>
              <Link href="/home" className="text-slate-500 hover:text-white transition-colors">AKAAI HUB</Link>
            </nav>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
