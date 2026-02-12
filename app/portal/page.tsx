"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sparkles,
  Users,
  Calendar,
  Smartphone,
  GraduationCap,
  Check,
  ArrowRight,
  Play,
  QrCode,
  LayoutDashboard,
  MessageSquare,
  History,
  CreditCard,
  User,
  ShieldCheck,
  Zap,
  Menu,
  X
} from "lucide-react"

export default function PortalLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Portal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#cliente" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sou Cliente
            </Link>
            <Link href="#profissional" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sou Profissional
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login?portal=user">
              <Button variant="ghost" className="font-bold">Entrar</Button>
            </Link>
            <Link href="/portal/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6">
                Acessar Portal
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </nav>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border animate-in slide-in-from-top duration-300">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link 
                href="#cliente" 
                className="text-lg font-bold text-slate-600 hover:text-indigo-600 py-2 border-b border-border/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sou Cliente
              </Link>
              <Link 
                href="#profissional" 
                className="text-lg font-bold text-slate-600 hover:text-indigo-600 py-2 border-b border-border/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sou Profissional
              </Link>
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login?portal=user" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full font-bold justify-start">Entrar</Button>
                </Link>
                <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12">
                    Acessar Portal
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-4">
            <Smartphone className="w-4 h-4" />
            Sua jornada no seu celular
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground max-w-4xl mx-auto leading-[0.9] tracking-tighter">
            Tudo o que você precisa para <span className="text-indigo-600 italic">evoluir</span> na sua jornada e alcançar seus objetivos.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O nosso portal é o seu companheiro diário. Faça check-in, veja sua agenda, compre pacotes e acompanhe sua evolução em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/portal/login" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-3 w-full text-lg font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all hover:scale-105">
                Entrar no Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/portal/register?type=professional" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 gap-3 w-full text-lg font-bold rounded-2xl border-2 hover:bg-secondary/50">
                Sou Profissional
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Selector Section */}
      <section className="py-10 bg-background">
        <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter">Você é...</h2>
        </div>
      </section>

      {/* Seção do Cliente */}
      <section id="cliente" className="py-20 px-4 bg-secondary">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-lg py-2 px-4 rounded-xl">Para o Cliente</Badge>
            <h2 className="text-4xl font-black text-foreground">
              Sua jornada, simplificada.
            </h2>
            <p className="text-lg text-muted-foreground">
              Com o portal do cliente, você tem tudo o que precisa na palma da sua mão. Chega de papéis e confusão.
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Check-in rápido e fácil com QR Code.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Acompanhe seu histórico de sessões e presença.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gerencie pagamentos e compras de forma segura.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Visualize e organize sua agenda de sessões.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 md:mt-0">
            <Image
              src="/images/client-portal-mockup.png"
              alt="Mockup do Portal do Cliente"
              className="w-full max-w-md mx-auto"
              width={500}
              height={700}
            />
          </div>
        </div>
      </section>

      {/* Seção do Profissional */}
      <section id="profissional" className="py-20 px-4 bg-background">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 md:order-2">
            <Badge className="bg-indigo-600 text-white text-lg py-2 px-4 rounded-xl">Para o Profissional</Badge>
            <h2 className="text-4xl font-black text-foreground">
              Foque no que importa: atender seus clientes.
            </h2>
            <p className="text-lg text-muted-foreground">
              O portal do profissional é sua ferramenta para organizar sessões, acompanhar clientes e gerenciar sua carreira.
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Painel de controle intuitivo e fácil de usar.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gerencie sua agenda e compromissos com facilidade.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Comunique-se diretamente com seus clientes.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Acompanhe o histórico e desempenho dos clientes.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 md:mt-0">
            <Image
              src="/images/professional-portal-mockup.png"
              alt="Mockup do Portal do Profissional"
              className="w-full max-w-md mx-auto"
              width={500}
              height={700}
            />
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                Experiência Mobile First
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight tracking-tighter">
                Sua jornada profissional e pessoal, <span className="text-indigo-600 italic">sem complicações</span>.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Desenvolvido para ser rápido e intuitivo. Esqueça papelada, senhas complexas ou burocracia. O Portal coloca o controle na palma da sua mão.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {[
                  { title: "Segurança", desc: "Acesso seguro com validação via WhatsApp.", icon: ShieldCheck },
                  { title: "Rapidez", desc: "Check-in via QR Code em menos de 1 segundo.", icon: Zap },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-bold text-lg">{item.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative flex justify-center">
              <div className="absolute -inset-10 bg-indigo-500/20 rounded-full blur-[100px] opacity-30"></div>
              {/* Mockup do App */}
              <div className="relative w-full max-w-[300px] aspect-[9/19] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden scale-110">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                <div className="p-6 h-full flex flex-col justify-between relative z-10 bg-slate-50 dark:bg-slate-950">
                   <div className="flex items-center justify-between pt-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl space-y-2">
                         <div className="h-2 w-16 bg-indigo-200 dark:bg-indigo-800 rounded-full"></div>
                         <div className="text-lg font-black text-indigo-900 dark:text-indigo-100">8 Sessões Restantes</div>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                            <Badge className="bg-indigo-100 text-indigo-600 border-none text-[8px]">HOJE</Badge>
                         </div>
                         <div className="font-bold text-sm">Ballet Intermediário</div>
                         <Button className="w-full h-8 bg-indigo-600 text-[10px] font-bold">GERAR QR CODE</Button>
                      </div>
                   </div>

                   <div className="h-12 bg-white dark:bg-slate-900 border-t flex items-center justify-around -mx-6 -mb-6 px-4">
                      <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                         <LayoutDashboard className="w-3 h-3 text-indigo-600" />
                      </div>
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <User className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">Portal</span>
            </div>
            
            <div className="flex gap-8 text-sm font-medium">
              <Link href="/#profissional" className="hover:text-indigo-600 transition-colors">Para Profissionais</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Privacidade</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Ajuda</Link>
            </div>

            <p className="text-xs">
              © 2026 Portal. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
