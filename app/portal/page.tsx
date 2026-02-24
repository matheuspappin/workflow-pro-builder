"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Users,
  Calendar,
  Smartphone,
  Check,
  ArrowRight,
  QrCode,
  LayoutDashboard,
  MessageSquare,
  History,
  CreditCard,
  User,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Star,
  FireExtinguisher,
  Shield,
  ClipboardCheck,
  FileText,
  Search,
  Settings,
  Loader2
} from "lucide-react"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { LanguageSwitcher } from "@/components/common/language-switcher"

function PortalLandingContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchParams = useSearchParams()
  const { t, niche } = useVocabulary()
  
  const isFireProtection = niche === 'fire_protection' || searchParams.get('niche') === 'fire_protection'

  const themeColor = isFireProtection ? "red-600" : "indigo-600"
  const themeColorHover = isFireProtection ? "red-700" : "indigo-700"
  const themeGradient = isFireProtection 
    ? "from-red-600 to-orange-600" 
    : "from-indigo-600 to-violet-600"
  const themeBgLight = isFireProtection ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"
  const themeText = isFireProtection ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"
  const themeBorder = isFireProtection ? "border-red-200" : "border-indigo-200"
  const themeShadow = isFireProtection ? "shadow-red-200" : "shadow-indigo-200"

  // Icon mapping
  const MainIcon = isFireProtection ? FireExtinguisher : Sparkles
  const ClientIcon = isFireProtection ? Shield : Sparkles
  const ProIcon = isFireProtection ? ClipboardCheck : Users

  // Content overrides for fire protection
  const content = {
    hero: {
      badge: isFireProtection ? "Segurança na palma da mão" : t.portal.hero.badge,
      title: isFireProtection 
        ? "Tudo o que você precisa para {evolve} na sua segurança e conformidade." 
        : t.portal.hero.title,
      evolve: isFireProtection ? "evoluir" : t.portal.hero.evolve,
      description: isFireProtection 
        ? "Acesse seus laudos, certificados, vistorias e controle a validade de seus equipamentos em um só lugar. Simples, rápido e seguro."
        : t.portal.hero.description,
    },
    clientSection: {
      badge: isFireProtection ? "Para o Cliente" : t.portal.clientSection.badge,
      title: isFireProtection ? "Sua segurança, simplificada." : t.portal.clientSection.title,
      description: isFireProtection 
        ? "Com o portal do cliente, você acompanha o status de seus equipamentos e vistorias em tempo real."
        : t.portal.clientSection.description,
      feature1: isFireProtection ? "Consulte a validade de extintores via QR Code." : t.portal.clientSection.feature1,
      feature2: isFireProtection ? "Acesse histórico de vistorias e manutenções." : t.portal.clientSection.feature2,
      feature3: isFireProtection ? "Baixe laudos, PPCI e certificados digitais." : t.portal.clientSection.feature3,
      feature4: isFireProtection ? "Receba alertas de vencimento automaticamente." : t.portal.clientSection.feature4,
    },
    professionalSection: {
      badge: isFireProtection ? "Para o Técnico" : t.portal.professionalSection.badge,
      title: isFireProtection ? "Foque na vistoria, nós cuidamos do resto." : t.portal.professionalSection.title,
      description: isFireProtection 
        ? "O portal do técnico é sua ferramenta de campo para registrar manutenções e gerar ordens de serviço."
        : t.portal.professionalSection.description,
      feature1: isFireProtection ? "Registro de vistorias offline e online." : t.portal.professionalSection.feature1,
      feature2: isFireProtection ? "Roteiro de visitas e ordens de serviço." : t.portal.professionalSection.feature2,
      feature3: isFireProtection ? "Coleta de assinaturas digitais no local." : t.portal.professionalSection.feature3,
      feature4: isFireProtection ? "Relatórios técnicos gerados instantaneamente." : t.portal.professionalSection.feature4,
    }
  }

  // Helper to split text with highlight
  const renderTitle = (text: string, highlightKey: string, highlightText: string, highlightClassName: string = `text-${themeColor}`) => {
    const parts = text.split(`{${highlightKey}}`)
    return (
      <>
        {parts[0]}
        <span className={`italic ${highlightClassName}`}>{highlightText}</span>
        {parts[1]}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${themeGradient} flex items-center justify-center`}>
              <MainIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Portal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#cliente" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {content.clientSection.badge}
            </Link>
            <Link href="#profissional" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {content.professionalSection.badge}
            </Link>
            <Link href="/portal/engineer" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Engenheiro
            </Link>
            <Link href="/architect/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              APP do Arquiteto
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher showIcon variant="ghost" />
            <Link href="/portal/login">
              <Button variant="ghost" className="font-bold">{t.portal.hero.login}</Button>
            </Link>
            <Link href="/portal/login">
              <Button className={`bg-${themeColor} hover:bg-${themeColorHover} text-white font-bold rounded-xl px-6`}>
                {t.portal.hero.ctaAccess}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher showIcon variant="ghost" />
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border animate-in slide-in-from-top duration-300">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link 
                href="#cliente" 
                className={`text-lg font-bold text-muted-foreground hover:text-${themeColor} py-2 border-b border-border/50`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {content.clientSection.badge}
              </Link>
              <Link 
                href="#profissional" 
                className={`text-lg font-bold text-muted-foreground hover:text-${themeColor} py-2 border-b border-border/50`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {content.professionalSection.badge}
              </Link>
              <Link 
                href="/portal/engineer" 
                className={`text-lg font-bold text-muted-foreground hover:text-${themeColor} py-2 border-b border-border/50`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Engenheiro
              </Link>
              <Link 
                href="/architect/app" 
                className={`text-lg font-bold text-muted-foreground hover:text-${themeColor} py-2 border-b border-border/50`}
                onClick={() => setMobileMenuOpen(false)}
              >
                APP do Arquiteto
              </Link>
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full font-bold justify-start">{t.portal.hero.login}</Button>
                </Link>
                <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className={`w-full bg-${themeColor} hover:bg-${themeColorHover} text-white font-bold rounded-xl h-12`}>
                    {t.portal.hero.ctaAccess}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className={`absolute top-0 left-1/4 w-96 h-96 ${isFireProtection ? 'bg-red-500/20' : 'bg-indigo-500/20'} rounded-full blur-[120px]`}></div>
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${isFireProtection ? 'bg-orange-500/20' : 'bg-violet-500/20'} rounded-full blur-[120px]`}></div>
        </div>

        <div className="container mx-auto text-center space-y-8">
          <div className={`inline-flex items-center gap-2 ${themeBgLight} ${themeText} px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4`}>
            <Smartphone className="w-4 h-4" />
            {content.hero.badge}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground max-w-4xl mx-auto leading-[0.95] tracking-tighter">
            {renderTitle(content.hero.title, "evolve", content.hero.evolve, `text-${themeColor}`)}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {content.hero.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/portal/login" className="w-full sm:w-auto">
              <Button size="lg" className={`h-14 px-8 bg-${themeColor} hover:bg-${themeColorHover} text-white gap-3 w-full text-lg font-bold rounded-2xl shadow-xl ${themeShadow} dark:shadow-none transition-all hover:scale-105`}>
                {t.portal.hero.ctaAccess}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href={isFireProtection ? "/portal/register?type=professional" : "/portal/engineer/register"} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 gap-3 w-full text-lg font-bold rounded-2xl border-2 hover:bg-secondary/50">
                {isFireProtection ? "Sou Técnico" : t.portal.hero.ctaProfessional}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Seção do Cliente */}
      <section id="cliente" className="py-24 px-4 bg-secondary/50">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Badge variant="outline" className={`bg-white dark:bg-slate-900 ${themeText} ${themeBorder} py-1.5 px-4 rounded-full font-bold`}>
              {content.clientSection.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
              {content.clientSection.title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.clientSection.description}
            </p>
            <ul className="space-y-6">
              {[
                { icon: isFireProtection ? Search : QrCode, text: content.clientSection.feature1 },
                { icon: isFireProtection ? FileText : History, text: content.clientSection.feature2 },
                { icon: isFireProtection ? ShieldCheck : CreditCard, text: content.clientSection.feature3 },
                { icon: isFireProtection ? Calendar : Calendar, text: content.clientSection.feature4 }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-border flex items-center justify-center group-hover:scale-110 transition-transform ${themeText}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-base font-medium text-foreground/80">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex justify-center">
            <div className={`absolute -inset-10 ${isFireProtection ? 'bg-red-500/10' : 'bg-indigo-500/10'} rounded-full blur-[100px] opacity-50`}></div>
            {/* UI Mockup for Client */}
            <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
              <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between pt-6 mb-8">
                  <div className={`w-10 h-10 rounded-xl bg-${themeColor} flex items-center justify-center`}>
                    <ClientIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <div className="space-y-6">
                  <div className={`p-5 bg-${themeColor} rounded-2xl text-white space-y-1 shadow-lg ${themeShadow} dark:shadow-none`}>
                    <div className="text-xs opacity-80 font-medium">{isFireProtection ? "Extintores em Dia" : t.portal.experience.sessionsRemaining}</div>
                    <div className="text-3xl font-black">{isFireProtection ? "24 / 26" : "12"}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold">{isFireProtection ? "Próximas Vistorias" : t.portal.experience.today}</div>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border space-y-4">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg ${themeBgLight} flex items-center justify-center ${themeText}`}>
                          {isFireProtection ? <ClipboardCheck className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{isFireProtection ? "25 Fev 2026" : "18:30 - 19:30"}</div>
                          <div className="font-bold text-sm">{isFireProtection ? "Vistoria Semestral" : "Crossfit Training"}</div>
                        </div>
                      </div>
                      <Button className={`w-full bg-${themeColor} text-xs font-black h-10 rounded-xl uppercase tracking-widest shadow-md ${themeShadow} dark:shadow-none`}>
                        {isFireProtection ? "Ver Equipamentos" : t.portal.experience.generateQr}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border text-center space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-tighter italic">{isFireProtection ? "Laudos" : "Check-ins"}</div>
                      <div className={`text-xl font-black ${themeText}`}>{isFireProtection ? "12" : "48"}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border text-center space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-tighter italic">Status</div>
                      <div className="text-xl font-black text-emerald-500">{isFireProtection ? "OK" : "+12%"}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto h-16 bg-white dark:bg-slate-900 border-t flex items-center justify-around -mx-6 -mb-6 px-4">
                  <div className={`w-10 h-10 rounded-xl ${isFireProtection ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'} flex items-center justify-center`}>
                    <LayoutDashboard className={`w-5 h-5 ${themeText}`} />
                  </div>
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <FileText className="w-5 h-5 text-slate-400" />
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção do Profissional */}
      <section id="profissional" className="py-24 px-4 bg-background">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 md:order-2">
            <Badge className={`bg-${isFireProtection ? 'red-600' : 'violet-600'} text-white py-1.5 px-4 rounded-full font-bold`}>
              {content.professionalSection.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
              {content.professionalSection.title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.professionalSection.description}
            </p>
            <ul className="space-y-6">
              {[
                { icon: LayoutDashboard, text: content.professionalSection.feature1 },
                { icon: Calendar, text: content.professionalSection.feature2 },
                { icon: MessageSquare, text: content.professionalSection.feature3 },
                { icon: History, text: content.professionalSection.feature4 }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl ${isFireProtection ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30 text-violet-600'} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-base font-medium text-foreground/80">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex justify-center md:order-1">
            <div className={`absolute -inset-10 ${isFireProtection ? 'bg-red-500/10' : 'bg-violet-500/10'} rounded-full blur-[100px] opacity-50`}></div>
            {/* UI Mockup for Professional */}
            <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
              <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between pt-6 mb-8">
                  <div className={`w-10 h-10 rounded-xl bg-${isFireProtection ? 'red-600' : 'violet-600'} flex items-center justify-center`}>
                    {isFireProtection ? <ClipboardCheck className="w-5 h-5 text-white" /> : <Users className="w-5 h-5 text-white" />}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{isFireProtection ? "Vistorias" : t.sidebar.dashboard}</div>
                      <div className={`text-xl font-black ${isFireProtection ? 'text-red-600' : 'text-violet-600'}`}>{isFireProtection ? "14" : "R$ 4.2k"}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{isFireProtection ? "Pendentes" : t.common.active}</div>
                      <div className={`text-xl font-black ${isFireProtection ? 'text-red-600' : 'text-violet-600'}`}>{isFireProtection ? "3" : "128"}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-bold flex items-center justify-between">
                      {isFireProtection ? "Agenda do Dia" : t.dashboard.upcoming}
                      <Badge variant="secondary" className="text-[10px] py-0">{t.common.today}</Badge>
                    </div>
                    
                    {[
                      { time: "08:30", name: "Cond. Solar", class: isFireProtection ? "Recarga de Extintores" : "Yoga Flow" },
                      { time: "10:00", name: "Supermercado X", class: isFireProtection ? "Vistoria PPCI" : "Personal Training" }
                    ].map((session, sIdx) => (
                      <div key={sIdx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border flex items-center gap-3">
                        <div className={`text-[10px] font-black ${isFireProtection ? 'text-red-600' : 'text-violet-600'} w-10 border-r border-border pr-2 leading-none uppercase tracking-tighter italic`}>
                          {session.time}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-bold text-xs truncate italic">{session.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-bold">{session.class}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-4 ${isFireProtection ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30'} rounded-2xl border`}>
                    <div className={`text-[10px] font-bold ${isFireProtection ? 'text-red-600' : 'text-violet-600'} uppercase mb-2 tracking-widest`}>Alerta IA</div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight italic">
                      {isFireProtection 
                        ? "3 extintores do Cond. Solar vencem em 5 dias. Sugerimos agendar a retirada."
                        : "\"Excelente atendimento, sempre muito pontual e atencioso.\""}
                    </p>
                  </div>
                </div>

                <div className="mt-auto h-16 bg-white dark:bg-slate-900 border-t flex items-center justify-around -mx-6 -mb-6 px-4">
                  <div className={`w-10 h-10 rounded-xl ${isFireProtection ? 'bg-red-50 dark:bg-red-900/20' : 'bg-violet-50 dark:bg-violet-900/20'} flex items-center justify-center`}>
                    <LayoutDashboard className={`w-5 h-5 ${isFireProtection ? 'text-red-600' : 'text-violet-600'}`} />
                  </div>
                  <Users className="w-5 h-5 text-slate-400" />
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <Settings className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 px-4 relative overflow-hidden bg-slate-950 text-white">
        <div className={`absolute top-0 right-0 w-1/2 h-full ${isFireProtection ? 'bg-red-600/10' : 'bg-indigo-600/10'} blur-[120px] -z-10`}></div>
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <div className={`inline-flex items-center gap-2 ${isFireProtection ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'} px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest`}>
                {t.portal.experience.badge}
              </div>
              <h2 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tighter">
                {renderTitle(isFireProtection ? "Sua segurança técnica, {uncomplicated}." : t.portal.experience.title, "uncomplicated", isFireProtection ? "sem complicações" : t.portal.experience.uncomplicated, isFireProtection ? "text-red-400" : "text-indigo-400")}
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                {isFireProtection 
                  ? "Toda a documentação de segurança contra incêndio digitalizada e acessível. Do extintor ao PPCI, tudo sob controle."
                  : t.portal.experience.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                {[
                  { title: t.portal.experience.security, desc: t.portal.experience.securityDesc, icon: ShieldCheck, color: isFireProtection ? "text-red-400" : "text-emerald-400" },
                  { title: t.portal.experience.speed, desc: t.portal.experience.speedDesc, icon: Zap, color: "text-amber-400" },
                ].map((item, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-black text-xl tracking-tight italic">{item.title}</h4>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative flex justify-center">
              <div className={`absolute -inset-10 ${isFireProtection ? 'bg-red-500/20' : 'bg-indigo-500/20'} rounded-full blur-[100px] opacity-30`}></div>
              {/* App Mockup */}
              <div className="relative w-full max-w-[300px] aspect-[9/19] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden scale-110">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                <div className="p-6 h-full flex flex-col justify-between relative z-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                   <div className="flex items-center justify-between pt-4">
                      <div className={`w-8 h-8 rounded-lg bg-${themeColor} flex items-center justify-center`}>
                        <MainIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                   </div>

                   <div className="space-y-4">
                      <div className={`p-4 ${isFireProtection ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'} rounded-2xl space-y-2`}>
                         <div className={`h-2 w-16 ${isFireProtection ? 'bg-red-200 dark:bg-red-800' : 'bg-indigo-200 dark:bg-indigo-800'} rounded-full`}></div>
                         <div className={`text-lg font-black ${isFireProtection ? 'text-red-900 dark:text-red-100' : 'text-indigo-900 dark:text-indigo-100'} italic`}>
                            {isFireProtection ? "15 Vistorias OK" : `8 ${t.portal.experience.sessionsRemaining}`}
                         </div>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                            <Badge className={`${isFireProtection ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'} border-none text-[8px] font-black`}>{t.portal.experience.today}</Badge>
                         </div>
                         <div className="font-bold text-sm italic">{isFireProtection ? "Inspeção Central" : "Ballet Intermediário"}</div>
                         <Button className={`w-full h-8 bg-${themeColor} text-[10px] font-black uppercase tracking-widest`}>{isFireProtection ? "Ver Status" : t.portal.experience.generateQr}</Button>
                      </div>
                   </div>

                   <div className="h-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around -mx-6 -mb-6 px-4 text-slate-900 dark:text-slate-100">
                      <div className={`w-6 h-6 rounded ${isFireProtection ? 'bg-red-100' : 'bg-indigo-100'} flex items-center justify-center`}>
                         <LayoutDashboard className={`w-3 h-3 ${themeText}`} />
                      </div>
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <FileText className="w-4 h-4 text-slate-400" />
                      <User className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-${themeColor} flex items-center justify-center`}>
                <MainIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">Portal</span>
            </div>
            
            <div className="flex gap-8 text-sm font-bold">
              <Link href="/portal/register?type=professional" className={`hover:text-${themeColor} transition-colors uppercase tracking-widest text-[10px]`}>
                {isFireProtection ? "Para Técnicos" : t.portal.footer.professionals}
              </Link>
              <Link href="#" className={`hover:text-${themeColor} transition-colors uppercase tracking-widest text-[10px]`}>{t.portal.footer.privacy}</Link>
              <Link href="#" className={`hover:text-${themeColor} transition-colors uppercase tracking-widest text-[10px]`}>{t.portal.footer.help}</Link>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest">
              {t.portal.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function PortalLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    }>
      <PortalLandingContent />
    </Suspense>
  )
}
