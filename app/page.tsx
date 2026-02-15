"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Check, ArrowRight, Zap, Shield, Users, CreditCard, QrCode, Bot, 
  Smartphone, Globe, Code, DollarSign, BarChart3, Calendar, Layout, 
  MessageSquare, Rocket, Play, ChevronRight, Star, Menu, X, Scissors, Car, Coffee, Home,
  TrendingUp, Sparkles, ZapIcon, Instagram, Package, Trophy, Target, ShoppingCart, Monitor
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SaibaMaisModal } from '@/components/SaibaMaisModal'
import { pluralize } from "@/lib/pluralize"
import { MODULE_PRICING } from "@/config/module-pricing"
import { MODULE_DEFINITIONS, ModuleKey } from "@/config/modules"
import { supabase } from "@/lib/supabase"
import logger from "@/lib/logger"

type Language = 'pt' | 'en';

function Navbar({ lang, setLang }: { lang: Language, setLang: (l: Language) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = {
    pt: [
      { name: "Recursos", href: "#features" },
      { name: "Soluções", href: "#solutions" },
      { name: "Preços", href: "#pricing" },
      { name: "Sua Marca", href: "#whitelabel" },
    ],
    en: [
      { name: "Features", href: "#features" },
      { name: "Solutions", href: "#solutions" },
      { name: "Pricing", href: "#pricing" },
      { name: "Your Brand", href: "#whitelabel" },
    ]
  };

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500",
      scrolled 
        ? "bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.1)] py-3" 
        : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 font-bold text-2xl tracking-tight"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Workflow <span className="text-primary font-black">Pro</span>
          </span>
        </motion.div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems[lang].map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="px-4 py-2 text-sm font-bold text-foreground/60 dark:text-white/60 hover:text-primary transition-all relative group uppercase tracking-widest"
            >
              {item.name}
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-bold text-xs px-2 h-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-all border border-white/10"
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
          >
            {lang === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
          </Button>

          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="font-semibold hover:bg-primary/5 hover:text-primary transition-all">
              {lang === 'pt' ? 'Entrar' : 'Login'}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="hidden sm:flex rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 font-bold">
              {lang === 'pt' ? 'Começar Agora' : 'Get Started'}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4 font-semibold">
              {navItems[lang].map((item) => (
                <Link key={item.name} href={item.href} className="flex items-center justify-between group" onClick={() => setMobileMenuOpen(false)}>
                  {item.name} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
              <div className="h-px bg-border/50 my-2" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl">{lang === 'pt' ? 'Entrar' : 'Login'}</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl">{lang === 'pt' ? 'Criar Conta' : 'Register'}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function HeroSection({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      badge: "Nova Versão 2.0: IA Generativa & Apps Nativos",
      title_part1: "A nova era da",
      title_part2: "gestão inteligente",
      description: "Transforme seu estúdio com agendamentos automáticos, IA preditiva e um ecossistema completo focado em experiência.",
      cta: "Começar Agora Grátis",
      architecture_badge: "Arquitetura Modular",
      modules_title: "Evolua sua gestão com",
      modules_span: "módulos especializados",
      modules_desc: "Escolha apenas o que seu negócio precisa hoje. Expanda conforme você cresce, com integração total e sem complexidade.",
      social_proof: "Confiado por centenas de empresas em todo o Brasil"
    },
    en: {
      badge: "New Version 2.0: Generative AI & Native Apps",
      title_part1: "The new era of",
      title_part2: "intelligent management",
      description: "Transform your studio with automated scheduling, predictive AI, and a complete ecosystem focused on experience.",
      cta: "Start Now for Free",
      architecture_badge: "Modular Architecture",
      modules_title: "Evolve your management with",
      modules_span: "specialized modules",
      modules_desc: "Choose only what your business needs today. Expand as you grow, with total integration and no complexity.",
      social_proof: "Trusted by hundreds of companies"
    }
  };

  const t = TRANSLATIONS[lang];

  const ENGLISH_MODULES: Record<string, { label: string; description: string; benefits: string[] }> = {
    dashboard: {
      label: "Dashboard",
      description: "Main control panel.",
      benefits: ["Business overview", "Key indicators", "Quick shortcuts"]
    },
    students: {
      label: "Client Management",
      description: "Complete management of your client base.",
      benefits: ["Unlimited client registration", "Complete history", "Anamnesis form"]
    },
    classes: {
      label: "Class/Service Management",
      description: "Organize your schedule and services.",
      benefits: ["Class/service scheduling", "Attendance control", "Schedule grid"]
    },
    financial: {
      label: "Financial",
      description: "Have total control of your business finances.",
      benefits: ["Cash flow control", "Tuition/package management", "Detailed financial reports"]
    },
    whatsapp: {
      label: "WhatsApp Integration",
      description: "Automate your communication and sell more via WhatsApp.",
      benefits: ["Automatic reminder sending", "Mass marketing campaigns", "Automated service (Chatbot)"]
    },
    ai_chat: {
      label: "AI Chat",
      description: "Artificial Intelligence to boost your business.",
      benefits: ["24/7 Virtual Assistant", "Advanced data analysis", "Smart automatic responses"]
    },
    pos: {
      label: "Point of Sale (POS)",
      description: "Agile point of sale for the counter.",
      benefits: ["Fast checkout", "Non-fiscal receipt issuance", "Daily cash control"]
    },
    inventory: {
      label: "Inventory Control",
      description: "Never lose sales due to lack of product.",
      benefits: ["Product stock control", "Low stock alert", "Suppliers and purchases"]
    },
    gamification: {
      label: "Gamification",
      description: "Retain your clients making the experience fun.",
      benefits: ["Points and rewards system", "Client ranking", "Engagement and retention"]
    },
    leads: {
      label: "Sales Funnel (CRM)",
      description: "Turn interested parties into paying clients.",
      benefits: ["Sales funnel (Kanban)", "Opportunity management", "Lead origin and conversion"]
    },
    scanner: {
      label: "Entry Scanner",
      description: "Speed up entry and exit of your establishment.",
      benefits: ["QR Code check-in", "Gate access control", "Automatic attendance recording"]
    },
    marketplace: {
      label: "Marketplace",
      description: "Your online store open 24 hours a day.",
      benefits: ["Integrated online store", "Online product/service sales", "Secure online payment"]
    },
    erp: {
      label: "ERP Enterprise",
      description: "Complete solution for large operations.",
      benefits: ["Multi-unit/franchise management", "Consolidated reports", "Fiscal and accounting control"]
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-soft-light" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md text-sm font-bold text-primary mb-10 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t.badge}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl lg:text-[110px] font-black tracking-tighter mb-8 leading-[0.85] text-foreground drop-shadow-2xl"
          >
            {t.title_part1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600 animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">
              {t.title_part2}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-foreground/70 dark:text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium drop-shadow-sm"
          >
            {t.description}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/register">
              <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-primary hover:bg-primary/90 shadow-[0_10px_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_15px_50px_-10px_rgba(var(--primary),0.6)] transition-all hover:scale-105 font-bold group">
                {t.cta}
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <SaibaMaisModal lang={lang} />
          </motion.div>
        </div>

        {/* Modules and Features */}
        <div className="mt-24 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Code className="w-3 h-3" />
              {t.architecture_badge}
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{t.modules_title} <br /><span className="text-primary">{t.modules_span}</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              {t.modules_desc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-0">
            {Object.entries(MODULE_PRICING).map(([key, info], i) => {
              const iconMap: Record<string, any> = {
                dashboard: Layout,
                students: Users,
                classes: Calendar,
                financial: DollarSign,
                whatsapp: MessageSquare,
                ai_chat: Bot,
                pos: Monitor,
                inventory: Package,
                gamification: Trophy,
                leads: Target,
                scanner: QrCode,
                marketplace: ShoppingCart,
                erp: Shield
              };
              const Icon = iconMap[key] || Zap;
              
              const label = lang === 'pt' ? (MODULE_DEFINITIONS[key as ModuleKey]?.label || key) : (ENGLISH_MODULES[key]?.label || key);
              const description = lang === 'pt' ? info.description : (ENGLISH_MODULES[key]?.description || info.description);
              const benefits = lang === 'pt' ? info.benefits : (ENGLISH_MODULES[key]?.benefits || info.benefits);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -5 }}
                  className="bg-background/40 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-background/60 hover:border-primary/30 transition-all group flex flex-col h-full shadow-lg hover:shadow-primary/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed flex-grow">
                    {description}
                  </p>
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    {benefits.slice(0, 3).map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground/80">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Decorative Glow behind grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary/5 via-transparent to-transparent -z-10" />


        {/* Social Proof */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 text-center"
        >
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-10">{t.social_proof}</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* Simple Logo Placeholders with text to look professional */}
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">STUDIO<span className="text-primary">X</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">FIT<span className="text-primary">PRO</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">ZEN<span className="text-primary">FLOW</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">CORE<span className="text-primary">BIKE</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter underline decoration-primary">ELITE<span className="text-primary">SPA</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function InteractiveDemo({ lang }: { lang: Language }) {
  const [activeNiche, setActiveNiche] = useState<NicheType>('dance')
  
  const vocab = nicheDictionary[lang][activeNiche] || nicheDictionary[lang].dance;

  const vocabulary = {
    ...vocab,
    clients: pluralize(vocab.client),
    providers: pluralize(vocab.provider),
    services: pluralize(vocab.service),
    establishments: pluralize(vocab.establishment)
  }

  const TRANSLATIONS = {
    pt: {
      badge: "Personalização Profunda",
      title_part1: "O sistema que fala a",
      title_part2: "língua do seu negócio",
      description: "Esqueça sistemas genéricos. O Workflow Pro adapta toda a interface e vocabulário para o seu nicho específico, proporcionando familiaridade imediata.",
      dashboard: "Dashboard",
      financial: "Financeiro",
      reports: "Relatórios",
      plan_status: "Status do Plano",
      ai_usage: "Uso de IA",
      welcome: "Bem-vindo,",
      summary: "Aqui está o resumo do seu",
      checkin: "Check-in",
      new: "Novo",
      ai_title: "Inteligência Artificial",
      ai_insight: "Detectamos que a retenção dos seus {clients} aumentou {percent} após as novas automações de WhatsApp.",
      details: "Ver Detalhes",
      revenue: "Faturamento",
      goal: "Meta atingida",
      sessions: "Sessões",
      today: "Hoje",
      upcoming: "Próximos",
      view_all: "Visualizar Agenda Completa",
      manage: "Gerenciar",
      niches: Object.fromEntries(
        Object.entries(nicheDictionary.pt).map(([key, value]) => [key, value.name])
      )
    },
    en: {
      badge: "Deep Customization",
      title_part1: "The system that speaks",
      title_part2: "your business language",
      description: "Forget generic systems. Workflow Pro adapts the entire interface and vocabulary to your specific niche, providing immediate familiarity.",
      dashboard: "Dashboard",
      financial: "Financial",
      reports: "Reports",
      plan_status: "Plan Status",
      ai_usage: "AI Usage",
      welcome: "Welcome,",
      summary: "Here is the summary of your",
      checkin: "Check-in",
      new: "New",
      ai_title: "Artificial Intelligence",
      ai_insight: "We detected that the retention of your {clients} increased {percent} after the new WhatsApp automations.",
      details: "View Details",
      revenue: "Revenue",
      goal: "Goal reached",
      sessions: "Sessions",
      today: "Today",
      upcoming: "Upcoming",
      view_all: "View Full Schedule",
      manage: "Manage",
      niches: Object.fromEntries(
        Object.entries(nicheDictionary.en).map(([key, value]) => [key, value.name])
      )
    }
  };

  const t = TRANSLATIONS[lang];
  
  return (
    <section id="solutions" className="py-32 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{t.title_part1} <br /><span className="text-primary">{t.title_part2}</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t.description}
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-16 overflow-x-auto pb-6 px-4 no-scrollbar">
          {[
            { id: 'dance', icon: Users },
            { id: 'gym', icon: ZapIcon },
            { id: 'dentist', icon: Shield },
            { id: 'beauty', icon: Star },
            { id: 'barber', icon: Scissors },
            { id: 'auto_detail', icon: Car },
            { id: 'barista', icon: Coffee },
            { id: 'coworking', icon: Home },
          ].map((niche) => (
            <motion.button
              key={niche.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNiche(niche.id as NicheType)}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-2",
                activeNiche === niche.id 
                  ? "bg-primary border-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary),0.4)]" 
                  : "bg-background border-transparent hover:border-primary/20 text-muted-foreground shadow-sm"
              )}
            >
              <niche.icon className={cn("w-5 h-5", activeNiche === niche.id ? "text-white" : "text-primary")} />
              {t.niches[niche.id as keyof typeof t.niches]}
            </motion.button>
          ))}
        </div>

        <motion.div 
          layout
          className="max-w-6xl mx-auto bg-background rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
        >
          <div className="grid md:grid-cols-12 min-h-[650px]">
            {/* Sidebar Mockup */}
            <div className="md:col-span-3 bg-slate-50 dark:bg-slate-900/50 border-r border-white/5 p-8 hidden md:flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <span className="font-black text-xl tracking-tighter">WP <span className="text-primary">PRO</span></span>
              </div>
              
              <div className="space-y-2">
                {[
                  { label: t.dashboard, icon: Layout, active: true },
                  { label: vocabulary.provider === (lang === 'pt' ? 'Professor' : 'Teacher') ? (lang === 'pt' ? 'Meus Alunos' : 'My Students') : vocabulary.clients, icon: Users },
                  { label: vocabulary.services, icon: Calendar },
                  { label: t.financial, icon: CreditCard },
                  { label: t.reports, icon: BarChart3 },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer group",
                    item.active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                  )}>
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                ))}
              </div>
              
              <div className="mt-auto bg-gradient-to-br from-primary/10 to-purple-500/10 p-5 rounded-2xl border border-primary/10">
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{t.plan_status}</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold">{t.ai_usage}</span>
                  <span className="text-xs font-bold text-primary">85%</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
                </div>
              </div>
            </div>

            {/* Main Content Mockup */}
            <div className="md:col-span-9 p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-3xl font-black mb-2 tracking-tight">{t.welcome} {vocabulary.provider}</h3>
                  <p className="text-muted-foreground font-medium">{t.summary} {vocabulary.establishment.toLowerCase()} {lang === 'pt' ? 'hoje' : 'today'}.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-xl font-bold border-2">
                    <QrCode className="w-4 h-4 mr-2" />
                    {t.checkin}
                  </Button>
                  <Button className="rounded-xl font-bold shadow-lg shadow-primary/20">
                    {t.new} {vocabulary.service}
                  </Button>
                </div>
              </div>

              {/* AI Insight Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group mb-12"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <Bot className="w-10 h-10" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <h4 className="font-black text-indigo-600 dark:text-indigo-400 uppercase text-xs tracking-widest">{t.ai_title}</h4>
                      <Badge variant="outline" className="text-[10px] h-5 border-indigo-200 text-indigo-500">PRO</Badge>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {t.ai_insight.replace('{clients}', vocabulary.clients.toLowerCase()).replace('{percent}', '14%')}
                    </p>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold shrink-0">
                    {t.details}
                  </Button>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                {[
                  { label: vocabulary.clients, value: lang === 'pt' ? "1.234" : "1,234", trend: "+12%", icon: Users, color: "text-blue-500" },
                  { label: t.revenue, value: lang === 'pt' ? "R$ 45k" : "$45k", trend: "+8%", icon: DollarSign, color: "text-emerald-500" },
                  { label: "Check-ins", value: "85%", trend: t.goal, icon: Check, color: "text-purple-500" },
                  { label: t.sessions, value: "42", trend: t.today, icon: Calendar, color: "text-orange-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-5 border border-transparent hover:border-primary/10 transition-all hover:shadow-md group">
                    <div className={cn("w-10 h-10 rounded-xl bg-background flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-2xl font-black mb-1 tracking-tight">{stat.value}</div>
                    <div className={cn("text-[10px] font-bold", stat.color)}>{stat.trend}</div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-black tracking-tight">{t.upcoming} {vocabulary.services}</h4>
                  <span className="text-xs font-bold text-primary cursor-pointer hover:underline">{t.view_all}</span>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-6 p-4 bg-background rounded-2xl border border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center font-black shrink-0 border group-hover:border-primary/30 transition-colors">
                        <span className="text-[10px] text-muted-foreground uppercase leading-none mb-1">{lang === 'pt' ? 'DEZ' : 'DEC'}</span>
                        <span className="text-xl leading-none">1{i}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{vocabulary.service} - {activeNiche === 'dance' ? 'Ballet' : activeNiche === 'gym' ? 'Crossfit' : 'Performance'}</div>
                        <div className="text-sm text-muted-foreground font-medium flex items-center gap-3">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 12 {vocabulary.clients}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> {lang === 'pt' ? 'Sala' : 'Room'} 02</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                         <div className="flex -space-x-2 mr-4">
                           {[1,2,3].map(a => (
                             <div key={a} className="w-8 h-8 rounded-full border-2 border-background bg-slate-200" />
                           ))}
                           <div className="w-8 h-8 rounded-full border-2 border-background bg-primary text-[10px] flex items-center justify-center text-white font-bold">+9</div>
                         </div>
                         <Button size="sm" variant="ghost" className="rounded-xl font-bold hover:bg-primary/10 hover:text-primary">
                           {t.manage}
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FeatureGrid({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      title_part1: "Tecnologia de elite",
      title_part2: "para quem busca o topo",
      description: "Não somos apenas mais um software de gestão. Somos o parceiro tecnológico que faltava para você focar no que realmente importa: seus clientes.",
      performance_title: "Performance Incomparável",
      performance_desc: "Sistema 100% cloud com 99.9% de uptime garantido.",
      explore: "EXPLORAR RECURSO",
      features: [
        {
          title: "Scanner & Check-in",
          description: "App nativo para controle de acesso via QR Code. Elimine burocracia na recepção e gerencie créditos de forma automática.",
          icon: QrCode,
          color: "from-blue-500 to-cyan-400",
          colSpan: "md:col-span-1"
        },
        {
          title: "Ecossistema Financeiro",
          description: "Cobrança recorrente, antecipação de recebíveis, split de pagamentos e loja integrada. Tudo o que seu financeiro precisa para escalar.",
          icon: CreditCard,
          color: "from-violet-600 to-indigo-500",
          colSpan: "md:col-span-2"
        },
        {
          title: "Cérebro de IA",
          description: "Nossa IA analisa padrões de comportamento e avisa quais clientes estão prestes a cancelar, sugerindo ações de recuperação automáticas.",
          icon: Bot,
          color: "from-emerald-500 to-teal-400",
          colSpan: "md:col-span-2"
        },
        {
          title: "Marca Própria",
          description: "Tenha seu próprio app nas lojas. Sua identidade visual em um produto robusto e testado por milhares de usuários.",
          icon: Smartphone,
          color: "from-orange-500 to-amber-400",
          colSpan: "md:col-span-1"
        }
      ]
    },
    en: {
      title_part1: "Elite technology",
      title_part2: "for those seeking the top",
      description: "We are not just another management software. We are the technological partner you were missing to focus on what really matters: your clients.",
      performance_title: "Incomparable Performance",
      performance_desc: "100% cloud system with 99.9% guaranteed uptime.",
      explore: "EXPLORE FEATURE",
      features: [
        {
          title: "Scanner & Check-in",
          description: "Native app for access control via QR Code. Eliminate bureaucracy at the reception and manage credits automatically.",
          icon: QrCode,
          color: "from-blue-500 to-cyan-400",
          colSpan: "md:col-span-1"
        },
        {
          title: "Financial Ecosystem",
          description: "Recurring billing, receivables anticipation, payment splits, and integrated store. Everything your financial department needs to scale.",
          icon: CreditCard,
          color: "from-violet-600 to-indigo-500",
          colSpan: "md:col-span-2"
        },
        {
          title: "AI Brain",
          description: "Our AI analyzes behavior patterns and warns you which clients are about to cancel, suggesting automatic recovery actions.",
          icon: Bot,
          color: "from-emerald-500 to-teal-400",
          colSpan: "md:col-span-2"
        },
        {
          title: "Own Brand",
          description: "Have your own app in the stores. Your visual identity in a robust product tested by thousands of users.",
          icon: Smartphone,
          color: "from-orange-500 to-amber-400",
          colSpan: "md:col-span-1"
        }
      ]
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-end mb-24">
          <div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">{t.title_part1} <br /><span className="text-primary">{t.title_part2}</span></h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
              {t.description}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">{t.performance_title}</h4>
                <p className="text-muted-foreground text-sm font-medium">{t.performance_desc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border bg-background p-10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2",
                feature.colSpan
              )}
            >
              <div className={cn("absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700", feature.color)} />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-xl bg-gradient-to-br transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500", feature.color)}>
                  <feature.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-3xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-10 font-medium">
                  {feature.description}
                </p>

                <div className="mt-auto flex items-center gap-2 font-black text-sm text-primary group-hover:translate-x-2 transition-transform">
                  {t.explore} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection({ lang }: { lang: Language }) {
  const defaultPlans = {
    pt: [
      { id: 'free', name: 'Gratuito', price: 0, description: 'Ideal para começar sua jornada', features: ['Até 10 alunos', '1 Profissional', 'Gestão básica'], isPopular: false },
      { id: 'pro', name: 'Pro', price: 297, description: 'Tudo o que você precisa para crescer', features: ['Até 100 alunos', '5 Profissionais', 'WhatsApp Business', 'Gestão Financeira'], isPopular: true },
      { id: 'pro-plus', name: 'Pro+', price: 197, description: 'O melhor custo-benefício para estúdios médios', features: ['Clientes ilimitados', 'Profissionais ilimitados', 'WhatsApp + IA', 'Financeiro Avançado'], isPopular: false },
      { id: 'enterprise', name: 'Enterprise', price: 0, description: 'Escalabilidade e suporte total', features: ['Tudo ilimitado', 'Multi-unidades', 'Suporte VIP', 'IA Customizada'], isPopular: false },
    ],
    en: [
      { id: 'free', name: 'Free', price: 0, description: 'Ideal to start your journey', features: ['Up to 10 clients', '1 Professional', 'Basic management'], isPopular: false },
      { id: 'pro', name: 'Pro', price: 49, description: 'Everything you need to grow', features: ['Up to 100 clients', '5 Professionals', 'WhatsApp Business', 'Financial Management'], isPopular: true },
      { id: 'pro-plus', name: 'Pro+', price: 99, description: 'Best value for medium studios', features: ['Unlimited clients', 'Unlimited professionals', 'WhatsApp + AI', 'Advanced Financial'], isPopular: false },
      { id: 'enterprise', name: 'Enterprise', price: 0, description: 'Scalability and total support', features: ['Everything unlimited', 'Multi-unit', 'VIP Support', 'Custom AI'], isPopular: false },
    ]
  };

  const TRANSLATIONS = {
    pt: {
      badge: "Preços Transparentes",
      title_part1: "Investimento que se",
      title_part2: "paga sozinho",
      description: "Escolha o plano ideal para a fase do seu negócio. Sem fidelidade, sem letras miúdas.",
      recommended: "Recomendado",
      contact: "Sob Consulta",
      exclusive: "Negociação Exclusiva",
      month: "/mês",
      start: "Começar Agora",
      talk: "Falar com Consultor",
      trial: "Testar Grátis"
    },
    en: {
      badge: "Transparent Pricing",
      title_part1: "Investment that",
      title_part2: "pays for itself",
      description: "Choose the ideal plan for your business stage. No loyalty contracts, no fine print.",
      recommended: "Recommended",
      contact: "Contact Us",
      exclusive: "Exclusive Negotiation",
      month: "/month",
      start: "Start Now",
      talk: "Talk to Consultant",
      trial: "Try for Free"
    }
  };

  const t = TRANSLATIONS[lang];
  const [systemPlans, setSystemPlans] = useState<any[]>(defaultPlans[lang])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('system_plans')
          .select('*')
          .eq('status', 'active')
          .order('price', { ascending: true })
        
        if (error) throw error
        if (data && data.length > 0) {
          const mappedPlans = data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            description: p.description,
            features: p.features || [],
            isPopular: p.is_popular
          }))
          setSystemPlans(mappedPlans)
        } else {
          setSystemPlans(defaultPlans[lang])
        }
      } catch (err) {
        logger.error('Error loading plans:', err)
        setSystemPlans(defaultPlans[lang])
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [lang])

  return (
    <TooltipProvider>
      <section id="pricing" className="py-32 bg-slate-950 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#3b82f620_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded-full bg-white/10 text-white/80 text-xs font-black uppercase tracking-[0.2em] mb-6 border border-white/5"
            >
              {t.badge}
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">{t.title_part1} <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{t.title_part2}</span></h2>
            <p className="text-xl text-slate-400 font-medium">
              {t.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {systemPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative border rounded-[2.5rem] p-10 bg-white/5 backdrop-blur-sm flex flex-col transition-all duration-500 hover:bg-white/10 group",
                  plan.isPopular ? "border-primary/50 shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)] scale-105 z-20 bg-white/[0.08]" : "border-white/10 hover:border-white/20"
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                    {t.recommended}
                  </div>
                )}
                
                <div className="mb-10 text-center md:text-left">
                  <h3 className={cn("text-2xl font-black mb-3 tracking-tight", plan.isPopular ? "text-primary" : "text-white")}>{plan.name}</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-10 text-center md:text-left">
                  {plan.id === 'enterprise' ? (
                    <div className="flex flex-col justify-center md:justify-start">
                      <span className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{t.contact}</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t.exclusive}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1 justify-center md:justify-start">
                      <span className="text-lg font-bold text-slate-400">{lang === 'pt' ? 'R$' : '$'}</span>
                      <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                      <span className="text-slate-400 font-bold">{t.month}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant={plan.isPopular ? "default" : "outline"}
                  className={cn(
                    "w-full mb-10 h-14 rounded-2xl font-black text-lg transition-all duration-300",
                    plan.isPopular 
                      ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02]" 
                      : "border-2 border-white/20 hover:bg-white hover:text-black hover:border-white"
                  )}
                >
                  {plan.id === 'free' ? t.start : plan.id === 'enterprise' ? t.talk : t.trial}
                </Button>

                <ul className="space-y-5 flex-1">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover/item:text-white transition-colors">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

function TestimonialsSection({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      title_part1: "O que dizem nossos",
      title_part2: "parceiros de sucesso",
      description: "Histórias reais de quem transformou a gestão do seu negócio com nossa tecnologia.",
      testimonials: [
        {
          text: "A automação de cobrança salvou meu estúdio. Reduzi a inadimplência a zero em apenas 2 meses de uso. O retorno sobre o investimento foi imediato.",
          author: "Carla Mendes",
          role: "Dona de Estúdio de Yoga",
          avatar: "CM"
        },
        {
          text: "Meus alunos amam o aplicativo nativo. Ficou extremamente profissional e aumentou drasticamente a percepção de valor dos meus serviços.",
          author: "Ricardo Silva",
          role: "Personal Trainer",
          avatar: "RS"
        },
        {
          text: "O modelo White-Label é genial. Me permitiu criar minha própria agência de software sem escrever uma linha de código. Suporte impecável.",
          author: "Lucas Tech",
          role: "Empreendedor SaaS",
          avatar: "LT"
        }
      ]
    },
    en: {
      title_part1: "What our",
      title_part2: "success partners",
      description: "Real stories from those who transformed their business management with our technology.",
      testimonials: [
        {
          text: "Billing automation saved my studio. I reduced delinquency to zero in just 2 months of use. The return on investment was immediate.",
          author: "Carla Mendes",
          role: "Yoga Studio Owner",
          avatar: "CM"
        },
        {
          text: "My students love the native app. It looks extremely professional and has drastically increased the perceived value of my services.",
          author: "Ricardo Silva",
          role: "Personal Trainer",
          avatar: "RS"
        },
        {
          text: "The White-Label model is genius. It allowed me to create my own software agency without writing a single line of code. Impeccable support.",
          author: "Lucas Tech",
          role: "SaaS Entrepreneur",
          avatar: "LT"
        }
      ]
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{t.title_part1} <span className="text-primary">{t.title_part2}</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t.description}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {t.testimonials.map((testimonial, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background p-10 rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 group"
            >
              <div className="flex gap-1 mb-8">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-muted-foreground mb-10 leading-relaxed text-lg font-medium italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-4 border-t pt-8 border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg shadow-inner group-hover:scale-110 transition-transform">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-black text-lg tracking-tight">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      title: "Dúvidas Frequentes",
      description: "Tudo o que você precisa saber para começar a escalar sua operação hoje.",
      faqs: [
        {
          q: "Como funciona o período de teste?",
          a: "Você tem 14 dias para testar todas as funcionalidades premium gratuitamente. Não solicitamos dados de cartão de crédito para começar. Basta criar sua conta e explorar o ecossistema."
        },
        {
          q: "Posso usar meu próprio domínio e marca?",
          a: "Sim! Nos planos Pro e Scale, ou através do nosso modelo White-Label, você pode conectar seu domínio personalizado (ex: app.suaempresa.com.br) e remover todas as referências ao nosso sistema."
        },
        {
          q: "O sistema cobra comissões sobre minhas vendas?",
          a: "Nós não cobramos comissões sobre suas vendas. Você mantém 100% do seu faturamento, pagando apenas as taxas padrão do gateway de pagamento (Stripe ou Asaas) que escolher conectar."
        },
        {
          q: "Como funciona o suporte técnico?",
          a: "Oferecemos suporte humano via chat em tempo real dentro da plataforma e via e-mail. Clientes do plano Scale possuem acesso direto a um gerente de sucesso exclusivo através do WhatsApp."
        }
      ]
    },
    en: {
      title: "Frequently Asked Questions",
      description: "Everything you need to know to start scaling your operation today.",
      faqs: [
        {
          q: "How does the trial period work?",
          a: "You have 14 days to test all premium features for free. We do not ask for credit card details to start. Just create your account and explore the ecosystem."
        },
        {
          q: "Can I use my own domain and brand?",
          a: "Yes! In the Pro and Scale plans, or through our White-Label model, you can connect your custom domain (e.g., app.yourcompany.com) and remove all references to our system."
        },
        {
          q: "Does the system charge commissions on my sales?",
          a: "We do not charge commissions on your sales. You keep 100% of your revenue, paying only the standard fees of the payment gateway (Stripe or Asaas) you choose to connect."
        },
        {
          q: "How does technical support work?",
          a: "We offer human support via real-time chat within the platform and via email. Scale plan customers have direct access to an exclusive success manager through WhatsApp."
        }
      ]
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <section className="py-32 relative overflow-hidden">
       {/* Background Decor */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10" />

      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground text-lg font-medium">{t.description}</p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {t.faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-slate-50/30 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all border-white/5">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6 tracking-tight text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 font-medium">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function AffiliateSection({ lang }: { lang: Language }) {
  const [earnings, setEarnings] = useState(10)
  const commissionRate = 0.30
  const ticketPrice = lang === 'pt' ? 197 : 49
  const monthlyIncome = earnings * ticketPrice * commissionRate

  const TRANSLATIONS = {
    pt: {
      badge: "Programa de Parceiros",
      title_part1: "Lucre indicando a",
      title_part2: "revolução do SaaS",
      description: "Receba 30% de comissão recorrente por toda a vida do cliente. Dashboard exclusivo, materiais de marketing e pagamentos automáticos.",
      features: ['Comissão Vitalícia', 'Cookies de 90 dias', 'Saque Automático', 'Suporte Prioritário'],
      cta: "Tornar-se um Parceiro",
      simulator: "Simulador de Ganhos",
      referred: "Clientes Indicados",
      drag: "Arraste para simular sua receita",
      income: "Sua Renda Mensal Recorrente",
      disclaimer: "*Cálculo baseado no ticket médio do plano Pro"
    },
    en: {
      badge: "Partners Program",
      title_part1: "Profit by referring the",
      title_part2: "SaaS revolution",
      description: "Receive 30% recurring commission for the lifetime of the client. Exclusive dashboard, marketing materials, and automatic payments.",
      features: ['Lifetime Commission', '90-day Cookies', 'Automatic Withdrawal', 'Priority Support'],
      cta: "Become a Partner",
      simulator: "Earnings Simulator",
      referred: "Referred Clients",
      drag: "Drag to simulate your revenue",
      income: "Your Monthly Recurring Revenue",
      disclaimer: "*Calculation based on the average ticket of the Pro plan"
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <section id="affiliates" className="py-32 relative bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <Badge className="bg-primary hover:bg-primary/90 mb-8 border-none px-6 py-2 text-xs font-black uppercase tracking-widest">{t.badge}</Badge>
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
              {t.title_part1} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                {t.title_part2}
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
              {t.description.split('30% de comissão recorrente').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <strong className="text-white">{lang === 'pt' ? '30% de comissão recorrente' : '30% recurring commission'}</strong>}
                </span>
              ))}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              {t.features.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/portal/affiliate/login">
              <Button size="lg" className="h-16 px-10 text-xl bg-white text-slate-950 hover:bg-slate-200 rounded-full font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all group">
                {t.cta}
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl" />
            <h3 className="text-2xl font-black mb-12 text-center tracking-tight">{t.simulator}</h3>
            
            <div className="space-y-16">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{t.referred}</span>
                  <span className="text-5xl font-black text-white tracking-tighter">{earnings}</span>
                </div>
                <Slider 
                  value={[earnings]} 
                  onValueChange={(v) => setEarnings(v[0])} 
                  max={100} 
                  step={1} 
                  className="py-4 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">{t.drag}</p>
              </div>

              <div className="bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] p-10 text-center shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <p className="text-white/80 font-bold uppercase text-xs tracking-widest mb-4">{t.income}</p>
                <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">
                  {new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: lang === 'pt' ? 'BRL' : 'USD' }).format(monthlyIncome)}
                </div>
                <p className="text-[10px] text-white/60 font-medium">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhiteLabelSection({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      badge: "Para Agências & Empreendedores",
      title_part1: "Sua própria tech",
      title_part2: "em 24 horas.",
      description: "Não gaste meses e fortunas desenvolvendo. Use nossa infraestrutura com a Sua Marca, seu domínio e seus preços. Nós cuidamos do código, você foca no mercado.",
      cta: "Licenciar Plataforma",
      settings_title: "Configurações Whitelabel",
      active: "Ativo",
      platform_name_label: "Nome da Sua Plataforma",
      platform_name: "Minha Agência SaaS",
      visual_label: "Identidade Visual",
      upload: "Upload Logo",
      primary: "Primária",
      secondary: "Secundária",
      sparkles_note: "O sistema removerá automaticamente todas as menções ao Workflow Pro e aplicará suas cores em toda a experiência do cliente.",
      features: [
        { title: "Domínio 100% Seu", desc: "app.suaempresa.com.br", icon: Globe },
        { title: "Margens de Lucro Reais", desc: "Você define o preço final para seu cliente", icon: DollarSign },
        { title: "Invisibilidade Total", desc: "Nenhuma menção ao Workflow Pro no sistema", icon: Shield }
      ]
    },
    en: {
      badge: "For Agencies & Entrepreneurs",
      title_part1: "Your own tech",
      title_part2: "in 24 hours.",
      description: "Don't spend months and fortunes developing. Use our infrastructure with Your Brand, your domain, and your prices. We take care of the code, you focus on the market.",
      cta: "License Platform",
      settings_title: "Whitelabel Settings",
      active: "Active",
      platform_name_label: "Platform Name",
      platform_name: "My SaaS Agency",
      visual_label: "Visual Identity",
      upload: "Upload Logo",
      primary: "Primary",
      secondary: "Secondary",
      sparkles_note: "The system will automatically remove all mentions of Workflow Pro and apply your colors throughout the customer experience.",
      features: [
        { title: "100% Your Domain", desc: "app.yourcompany.com", icon: Globe },
        { title: "Real Profit Margins", desc: "You define the final price for your client", icon: DollarSign },
        { title: "Total Invisibility", desc: "No mention of Workflow Pro in the system", icon: Shield }
      ]
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <section id="whitelabel" className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] p-10 md:p-24 overflow-hidden relative border border-white/5">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Badge variant="outline" className="mb-8 border-primary/20 text-primary px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary/5">
                {t.badge}
              </Badge>
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
                {t.title_part1} <br /><span className="text-primary">{t.title_part2}</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
                {t.description.split('Sua Marca').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <strong>{lang === 'pt' ? 'Sua Marca' : 'Your Brand'}</strong>}
                  </span>
                ))}
              </p>
              
              <div className="space-y-8 mb-14">
                {t.features.map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-background shadow-sm border border-white/10 flex items-center justify-center shrink-0 text-primary group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl tracking-tight mb-1">{item.title}</h4>
                      <p className="text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-16 px-10 text-xl rounded-full font-black bg-foreground text-background hover:opacity-90 transition-all shadow-xl">
                {t.cta}
              </Button>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-600 rounded-[3rem] rotate-6 opacity-10 blur-2xl transform scale-95 group-hover:rotate-3 transition-transform duration-700" />
              <div className="bg-background border border-white/10 rounded-[3rem] shadow-2xl p-10 md:p-16 relative rotate-3 group-hover:rotate-0 transition-all duration-700">
                {/* Brand Config Mockup */}
                <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                  <div className="font-black tracking-tight text-lg">{t.settings_title}</div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t.active}
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t.platform_name_label}</div>
                    <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-white/5 px-6 flex items-center text-sm font-bold">
                      {t.platform_name}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t.visual_label}</div>
                    <div className="flex gap-6">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-primary/30 flex items-center justify-center text-primary text-[10px] font-black text-center p-4 cursor-pointer hover:bg-primary/5 transition-colors">
                        {t.upload}
                      </div>
                      <div className="flex-1 space-y-4 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary shadow-lg" />
                            <span className="text-xs font-bold text-muted-foreground">{t.primary}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white shadow-lg" />
                            <span className="text-xs font-bold text-muted-foreground">{t.secondary}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-primary w-1/3" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {t.sparkles_note.split('Workflow Pro').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && <span className="font-bold text-primary">Workflow Pro</span>}
                        </span>
                      ))}
                    </p>
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

function Footer({ lang }: { lang: Language }) {
  const TRANSLATIONS = {
    pt: {
      description: "A infraestrutura definitiva para quem deseja transformar a gestão de negócios em uma experiência de classe mundial.",
      ecosystem: "Ecossistema",
      company: "Empresa",
      newsletter: "Newsletter",
      newsletter_desc: "Receba insights sobre gestão e IA.",
      subscribe: "Assinar",
      placeholder: "Seu melhor e-mail",
      privacy: "Privacidade",
      terms: "Termos",
      security: "Segurança",
      links: {
        ecosystem: ["Funcionalidades", "App Whitelabel", "IA Generativa", "Marketplace"],
        company: ["Sobre Nós", "Carreiras", "Afiliados", "Contato"]
      }
    },
    en: {
      description: "The ultimate infrastructure for those who want to transform business management into a world-class experience.",
      ecosystem: "Ecosystem",
      company: "Company",
      newsletter: "Newsletter",
      newsletter_desc: "Receive insights on management and AI.",
      subscribe: "Subscribe",
      placeholder: "Your best email",
      privacy: "Privacy",
      terms: "Terms",
      security: "Security",
      links: {
        ecosystem: ["Features", "Whitelabel App", "Generative AI", "Marketplace"],
        company: ["About Us", "Careers", "Affiliates", "Contact"]
      }
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <footer className="bg-slate-950 text-slate-400 py-32 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_120%,_#3b82f610_0%,_transparent_50%)] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-12 gap-16 mb-24">
          <div className="md:col-span-5">
             <div className="flex items-center gap-3 font-black text-3xl text-white mb-8 tracking-tighter">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              Workflow <span className="text-primary">Pro</span>
            </div>
            <p className="text-lg leading-relaxed mb-10 max-w-md">
              {t.description}
            </p>
            <div className="flex gap-4">
              {[Globe, MessageSquare, Smartphone, Instagram].map((Icon, i) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer border border-white/5">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">{t.ecosystem}</h4>
            <ul className="space-y-4 font-medium">
              {t.links.ecosystem.map(link => (
                <li key={link}><Link href="#" className="hover:text-primary transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">{t.company}</h4>
            <ul className="space-y-4 font-medium">
              {t.links.company.map(link => (
                <li key={link}><Link href="#" className="hover:text-primary transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">{t.newsletter}</h4>
            <p className="text-sm mb-6 font-medium">{t.newsletter_desc}</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder={t.placeholder} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button className="absolute right-2 top-2 h-10 px-4 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">
                {t.subscribe}
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-bold uppercase tracking-widest">
          <p className="text-slate-500">© 2026 Workflow Pro Builder. <span className="text-slate-700">Code with Excellence.</span></p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">{t.privacy}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t.terms}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t.security}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Main Page Component ---

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('pt')

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">
      <Navbar lang={lang} setLang={setLang} />
      <HeroSection lang={lang} />
      <InteractiveDemo lang={lang} />
      <FeatureGrid lang={lang} />
      <PricingSection lang={lang} />
      <TestimonialsSection lang={lang} />
      <FAQSection lang={lang} />
      <AffiliateSection lang={lang} />
      <WhiteLabelSection lang={lang} />
      <Footer lang={lang} />
    </div>
  )
}
