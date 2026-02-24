"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowRight, Zap, Shield, Smartphone, Globe, Code, CreditCard, Users, Bot, QrCode, Star, Coffee, Scissors, Car, Home, DollarSign } from "lucide-react"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { cn } from "@/lib/utils"

export default function WhiteLabelPage() {
  const [selectedNiche, setSelectedNiche] = useState<NicheType>('dance')
  const vocabulary = nicheDictionary.pt[selectedNiche]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Workflow AI <span className="text-primary">Builder</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#whitelabel" className="hover:text-primary transition-colors">White-Label</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Preços</Link>
          </div>
          <Button variant="default" size="sm">Começar Agora</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1 border-primary/50 text-primary bg-primary/5 backdrop-blur-sm">
            Plataforma SaaS Modular 2.0
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Sua empresa no <br />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">piloto automático com IA</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A plataforma modular que se adapta ao seu nicho. De estúdios de dança a clínicas médicas, 
            tenha um sistema completo com sua marca.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/25">
              Criar meu Ecossistema
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Niche Selector */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Adapta-se ao seu negócio</h2>
            <p className="text-muted-foreground">Passe o mouse para ver a plataforma mudar de linguagem instantaneamente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <NicheCard 
              type="dance" 
              active={selectedNiche === 'dance'} 
              onHover={() => setSelectedNiche('dance')}
              title="Estúdios & Escolas"
              icon={Users}
            />
            <NicheCard 
              type="dentist" 
              active={selectedNiche === 'dentist'} 
              onHover={() => setSelectedNiche('dentist')}
              title="Saúde & Clínicas"
              icon={Shield}
            />
            <NicheCard 
              type="gym" 
              active={selectedNiche === 'gym'} 
              onHover={() => setSelectedNiche('gym')}
              title="Fitness & Academias"
              icon={Zap}
            />
            <NicheCard 
              type="beauty" 
              active={selectedNiche === 'beauty'} 
              onHover={() => setSelectedNiche('beauty')}
              title="Beleza & Estética"
              icon={Star}
            />
            <NicheCard 
              type="barber" 
              active={selectedNiche === 'barber'} 
              onHover={() => setSelectedNiche('barber')}
              title="Barbearias"
              icon={Scissors}
            />
            <NicheCard 
              type="auto_detail" 
              active={selectedNiche === 'auto_detail'} 
              onHover={() => setSelectedNiche('auto_detail')}
              title="Automotivo"
              icon={Car}
            />
          </div>

          <div className="mt-12 p-8 border rounded-2xl bg-background shadow-sm max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-2">Vocabulário Dinâmico</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>O sistema se refere aos seus clientes como <strong className="text-primary">{vocabulary.client}s</strong>.</p>
                  <p>Seus profissionais são chamados de <strong className="text-primary">{vocabulary.provider}s</strong>.</p>
                  <p>O serviço prestado é <strong className="text-primary">{vocabulary.service}</strong>.</p>
                </div>
              </div>
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="font-semibold">Dashboard</div>
                  <Badge>{vocabulary.establishment}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="h-10 bg-muted rounded-md flex items-center px-4 text-sm">
                    Novo {vocabulary.client} cadastrado
                  </div>
                  <div className="h-10 bg-muted rounded-md flex items-center px-4 text-sm">
                    Agendar {vocabulary.service}
                  </div>
                  <div className="h-10 bg-muted rounded-md flex items-center px-4 text-sm">
                    Pagamento ao {vocabulary.provider}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Tudo que você precisa em um lugar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1: Financeiro (Large) */}
            <div className="md:col-span-2 row-span-1 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-4 right-4 bg-background/50 p-2 rounded-full backdrop-blur-md">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Financeiro Automatizado</h3>
              <p className="text-muted-foreground max-w-md">Cobranças via Stripe, controle de inadimplência e fluxo de caixa em tempo real. Deixe o robô cobrar por você.</p>
              <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-background rounded-tl-3xl border-t border-l shadow-2xl p-6 transition-transform group-hover:translate-x-2 group-hover:translate-y-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Receita Mensal</span>
                    <span className="font-bold text-green-500">+24.5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-12 bg-muted/50 rounded-lg" />
                    <div className="h-12 bg-muted/50 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Scanner */}
            <div className="bg-card border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-4 right-4 bg-background/50 p-2 rounded-full backdrop-blur-md">
                <QrCode className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Scanner & Acesso</h3>
              <p className="text-sm text-muted-foreground">Check-in via QR Code e baixa automática de créditos/sessões.</p>
              <div className="absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <QrCode className="w-24 h-24 text-foreground/10" />
              </div>
            </div>

            {/* Feature 3: AI Chat */}
            <div className="bg-card border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-4 right-4 bg-background/50 p-2 rounded-full backdrop-blur-md">
                <Bot className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">IA Preditiva</h3>
              <p className="text-sm text-muted-foreground">Gemini/ChatGPT analisam dados para evitar churn e sugerir ações.</p>
            </div>

            {/* Feature 4: WhatsApp */}
            <div className="md:col-span-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-all">
               <div className="absolute top-4 right-4 bg-background/50 p-2 rounded-full backdrop-blur-md">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">WhatsApp CRM 24/7</h3>
              <p className="text-muted-foreground max-w-md">Engajamento automático. Lembretes de agendamento e recuperação de vendas perdidas.</p>
               <div className="absolute -bottom-4 right-8 w-1/2 h-40 bg-background border rounded-t-xl shadow-lg p-4 transition-transform group-hover:-translate-y-2">
                 <div className="space-y-3">
                   <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg rounded-tl-none text-xs w-fit">
                     Olá! Seu plano vence amanhã.
                   </div>
                   <div className="bg-muted p-2 rounded-lg rounded-tr-none text-xs w-fit ml-auto">
                     Obrigado por avisar! Vou renovar.
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Builder Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">Monte o software ideal</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Com nosso <strong>Feature Builder</strong>, você ativa apenas o que seu negócio precisa. 
                Sem bloatware, sem complexidade desnecessária.
              </p>
              <ul className="space-y-4">
                {[
                  "Ligue/Desligue módulos com um clique",
                  "Defina preços personalizados para revenda",
                  "Interface administrativa simplificada",
                  "Controle total sobre o que seu cliente vê"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-background p-6 rounded-2xl border shadow-xl">
              <div className="space-y-4 opacity-80 pointer-events-none select-none">
                {/* Visual Mockup of Feature Builder */}
                <div className="flex items-center justify-between border-b pb-4">
                   <div className="font-semibold">Módulos Ativos</div>
                   <Badge>Builder Mode</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>Financeiro</div>
                  <div className="w-10 h-5 bg-primary rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"/></div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                  <div>Marketplace</div>
                  <div className="w-10 h-5 bg-muted rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"/></div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>Chat IA</div>
                  <div className="w-10 h-5 bg-primary rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"/></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner / Whitelabel Section */}
      <section id="whitelabel" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Empreenda com nossa Tecnologia</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
            Transforme nosso software na <strong>sua agência de automação</strong>.
            Modelo White-label: coloque sua marca, defina seus preços e ganhe na recorrência.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Globe className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Seu Domínio</h3>
              <p className="text-sm opacity-80">O cliente acessa app.suaempresa.com.br. Nossa marca não aparece em lugar nenhum.</p>
            </div>
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <DollarSign className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Seu Preço</h3>
              <p className="text-sm opacity-80">Você define quanto cobrar. Nós cobramos apenas uma taxa fixa por licença ativa.</p>
            </div>
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Code className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Sem Code</h3>
              <p className="text-sm opacity-80">Não precisa ser programador. Foque em vender e atender seus clientes.</p>
            </div>
          </div>

          <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold shadow-xl">
            Quero ser um parceiro
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 font-bold text-xl mb-6 text-foreground">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Workflow AI
          </div>
          <p className="mb-6">© 2026 Workflow AI Builder. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function NicheCard({ type, active, onHover, title, icon: Icon }: { type: string, active: boolean, onHover: () => void, title: string, icon: any }) {
  return (
    <div 
      className={cn(
        "cursor-pointer p-6 rounded-xl border transition-all duration-300",
        active 
          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
          : "bg-card hover:border-primary/50"
      )}
      onMouseEnter={onHover}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={cn("p-2 rounded-lg", active ? "bg-white/20" : "bg-primary/10")}>
          <Icon className={cn("w-6 h-6", active ? "text-white" : "text-primary")} />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <p className={cn("text-sm", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
        Vocabulário adaptado para {title.toLowerCase()}.
      </p>
    </div>
  )
}
