"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { OFFICIAL_LOGO } from "@/config/branding"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { useBusinessMode } from "@/hooks/use-business-mode"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import logger from "@/lib/logger"
import {
  Sparkles,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Phone,
  TrendingUp,
  Video,
  QrCode as QrCodeIcon,
  ShoppingCart,
  Globe,
  ShoppingBag,
  Lock,
  User2,
  LifeBuoy,
  Wrench,
  Languages,
  Trophy,
  Layers,
  Package,
  FireExtinguisher,
  HardHat,
  FileText,
  TrendingDown,
  BarChart3,
  Receipt,
} from "lucide-react"
import { getNicheIcon, getNicheBranding } from "@/lib/niche-utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { Button } from "@/components/ui/button"
import { monetaryBasedNiches, getBusinessConcept } from "@/config/niche-modules"
import { getLoginUrlForNiche } from "@/config/portal-routes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Building } from "lucide-react"

interface NavContentProps {
  collapsed?: boolean
  onNavigate?: () => void
  isAffiliate?: boolean
  isSeller?: boolean
  isFinance?: boolean
}

export function NavContent({ collapsed = false, onNavigate, isAffiliate = false, isSeller = false, isFinance = false }: NavContentProps) {
  const pathname = usePathname()
  const { vocabulary, enabledModules, niche, loading: vocabLoading, t, language } = useVocabulary()
  const { setLanguage, studios, studioId, switchStudio, businessModel } = useOrganization()
  const { isScheduleBased, isServiceOrderBased } = useBusinessMode()
  const activeStudio = studios.find(s => s.id === studioId)
  const concept = getBusinessConcept((niche as any) || 'dance')
  const isFireProtection = niche === 'fire_protection'
  const baseBranding = getNicheBranding(niche || 'dance')
  const branding = isAffiliate
    ? {
        ...baseBranding,
        name: "AKAAI",
        accentName: "CORE",
        gradient: null,
        accentText: "text-white",
        accentBg: "bg-white",
        accentBgMuted: "bg-white/10",
        accentShadow: "shadow-white/20",
        accentForeground: "text-black",
        secondaryColor: "text-white/70",
        useLogo: true as const,
      }
    : { ...baseBranding, useLogo: false as const }

  const dashboardMenuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: t.sidebar.dashboard,
      href: "/dashboard"
    },
    {
      id: 'ao-vivo',
      icon: Video,
      label: `${vocabulary.services} ${t.sidebar.live}`,
      href: "/dashboard/ao-vivo",
      module: 'classes'
    },
    {
      id: 'scanner',
      icon: QrCodeIcon,
      label: t.sidebar.scanner.replace('{establishment}', branding.name),
      href: "/dashboard/scanner",
      module: 'scanner'
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      label: t.sidebar.pos,
      href: "/dashboard/vendas",
      module: 'pos' 
    },
    {
      id: 'students',
      icon: Users,
      label: vocabulary.clients,
      href: "/dashboard/alunos",
      module: 'students'
    },
    {
      id: 'leads',
      icon: TrendingUp,
      label: t.sidebar.leads,
      href: "/dashboard/leads",
      module: 'leads'
    },
    {
      id: 'teachers',
      icon: GraduationCap,
      label: vocabulary.providers,
      href: "/dashboard/professores",
      module: 'classes'
    },
    {
      id: 'classes',
      icon: Calendar,
      label: vocabulary.services,
      href: "/dashboard/aulas",
      module: 'classes'
    },
    {
      id: 'service-orders',
      icon: Wrench,
      label: t.sidebar.service_orders.replace('{services}', vocabulary.services),
      href: "/dashboard/os",
      module: 'service_orders'
    },
    {
      id: 'projects',
      icon: HardHat,
      label: t.sidebar.projects,
      href: "/dashboard/projetos",
      module: 'service_orders'
    },
    {
      id: 'financial',
      icon: DollarSign,
      label: t.sidebar.financial,
      href: "/dashboard/financeiro",
      module: 'financial'
    },
    {
      id: 'whatsapp',
      icon: Phone,
      label: t.sidebar.whatsapp,
      href: "/dashboard/whatsapp",
      module: 'whatsapp'
    },
    {
      id: 'inventory',
      icon: Package,
      label: t.sidebar.inventory,
      href: "/dashboard/estoque",
      module: 'inventory'
    },
    {
      id: 'gamification',
      icon: Trophy,
      label: t.sidebar.gamification,
      href: "/dashboard/gamification",
      module: 'gamification'
    },
    {
      id: 'multi-unit',
      icon: Globe,
      label: t.sidebar.multi_unit,
      href: "/dashboard/multi-unit",
      module: 'multi_unit'
    },
    {
      id: 'erp',
      icon: Layers,
      label: t.sidebar.erp,
      href: "/dashboard/erp",
      module: 'erp'
    },
    {
      id: 'marketplace',
      icon: ShoppingBag,
      label: t.sidebar.marketplace,
      href: "/dashboard/marketplace",
      module: 'marketplace'
    },
    {
      id: 'ai_chat',
      icon: MessageSquare,
      label: t.sidebar.ai_chat,
      href: "/dashboard/chat",
      module: 'ai_chat'
    },
    {
      id: 'ai_learning',
      icon: BarChart3,
      label: t.sidebar.ai_learning,
      href: "/dashboard/ai-learning",
      module: 'ai_chat'
    },
    {
      id: 'settings',
      icon: Settings,
      label: t.sidebar.settings,
      href: "/dashboard/configuracoes"
    },
    {
      id: 'support',
      icon: LifeBuoy,
      label: t.sidebar.support,
      href: "/dashboard/suporte"
    },
  ]

  const sellerMenuItems = [
    {
      id: 'seller-dashboard',
      icon: LayoutDashboard,
      label: t.sidebar.dashboard,
      href: "/seller"
    },
    {
      id: 'seller-clients',
      icon: Users,
      label: vocabulary.clients,
      href: "/seller/clients"
    },
    {
      id: 'seller-os',
      icon: Wrench,
      label: t.sidebar.service_orders.replace('{services}', vocabulary.services),
      href: "/seller/os"
    },
    {
      id: 'seller-support',
      icon: LifeBuoy,
      label: t.sidebar.support,
      href: "/seller/support"
    },
  ]

  const financeMenuItems = [
    {
      id: 'finance-dashboard',
      icon: LayoutDashboard,
      label: t.sidebar.dashboard,
      href: "/finance"
    },
    {
      id: 'finance-funcionarios',
      icon: Users,
      label: "Pagamentos Funcionários",
      href: "/finance/funcionarios"
    },
    {
      id: 'finance-notas',
      icon: Receipt,
      label: "Notas Fiscais",
      href: "/finance/notas"
    },
    {
      id: 'finance-lancamentos',
      icon: FileText,
      label: "Lançamentos",
      href: "/finance/lancamentos"
    },
    {
      id: 'finance-inadimplencia',
      icon: TrendingDown,
      label: "Inadimplência",
      href: "/finance/inadimplencia"
    },
    {
      id: 'finance-relatorios',
      icon: BarChart3,
      label: "Relatórios",
      href: "/finance/relatorios"
    },
  ]

  const affiliateMenuItems = [
    {
      id: 'affiliate-dashboard',
      icon: LayoutDashboard,
      label: t.sidebar.dashboard,
      href: "/portal/affiliate/dashboard"
    },
    {
      id: 'affiliate-materiais',
      icon: FileText,
      label: "Materiais de Vendas",
      href: "/portal/affiliate/materiais"
    },
    {
      id: 'affiliate-profile',
      icon: User2,
      label: t.common.myAccount,
      href: "/portal/affiliate/profile"
    },
    {
      id: 'affiliate-ecosystems',
      icon: Sparkles,
      label: "Meus Ecossistemas",
      href: "/portal/affiliate/ecosystems"
    },
    {
      id: 'affiliate-settings',
      icon: Settings,
      label: t.sidebar.settings,
      href: "/portal/affiliate/settings"
    },
  ]

  type MenuItem = { id: string; icon: typeof LayoutDashboard; label: string; href: string; module?: string }
  let menuItems: MenuItem[] = dashboardMenuItems as MenuItem[];
  if (isAffiliate) menuItems = affiliateMenuItems;
  if (isSeller) menuItems = sellerMenuItems as MenuItem[];
  if (isFinance) menuItems = financeMenuItems as MenuItem[];

  const handleLogout = async () => {
    try {
      // 1. Sign out do Supabase no cliente
      await supabase.auth.signOut()
      
      // 2. Chama a API para limpar cookies no servidor
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      logger.error('Erro ao realizar logout:', e)
    }
    
    // 3. Limpa localStorage
    localStorage.removeItem("danceflow_user")
    localStorage.removeItem("workflow_pro_active_studio")

    // 4. Redirecionamento total para limpar estado do Next.js
    if (isAffiliate) {
      window.location.href = "/portal/affiliate/login"
      return
    }

    window.location.href = getLoginUrlForNiche(niche)
  }

  // A lógica de módulos PRO e BASE_MODULES só se aplica ao dashboard principal
  const BASE_MODULES = ['dashboard', 'settings', 'support']

  // Se ERP está ativo, Estoque e Marketplace ficam acessíveis automaticamente
  // (compartilham a mesma tabela products e são dependentes do ERP)
  const effectiveModules = {
    ...enabledModules,
    ...(enabledModules.erp ? { inventory: true, marketplace: true } : {}),
  }

  // ALTERAÇÃO: Filtramos os itens para mostrar apenas o que está ativo no builder
  const filteredItems = menuItems.filter(item => {
    // 1. Se for o portal de afiliado, mostra tudo
    if (isAffiliate) return true;

    const moduleKey = (item as any).module
    
    // 2. Itens sem módulo ou módulos base sempre aparecem
    if (!moduleKey || BASE_MODULES.includes(item.id)) {
      return true;
    }

    // 3. Só mostra se o módulo estiver explicitamente ativo nas configurações da organização
    const isModuleEnabled = effectiveModules[moduleKey as keyof typeof effectiveModules] === true
    
    // Regras de adaptação para Modo Monetário baseadas no conceito do nicho
    if (concept.hiddenModules.includes(item.id) || concept.hiddenModules.includes(moduleKey)) {
      return false;
    }

    // Fallback de segurança para Gamificação se estiver em modo MONETARY
    if (moduleKey === 'gamification' && businessModel === 'MONETARY') {
      return false;
    }

    return isModuleEnabled
  })

  // Reordenação baseada em prioridade do conceito
  const activeItems = [...filteredItems].sort((a, b) => {
    const priorityA = concept.priorityModules.indexOf(a.id);
    const priorityB = concept.priorityModules.indexOf(b.id);
    
    if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;
    return 0;
  });

  // Módulos não selecionados são BLOQUEADOS (não aparecem nem no marketplace se não forem habilitados)
  const marketplaceItems: any[] = [] // Desativado conforme pedido: bloquear o que não foi escolhido

  const fireProtectionGroups = [
    {
      label: "Operacional",
      itemIds: ['dashboard', 'scanner', 'students', 'teachers', 'service-orders', 'inventory', 'classes'],
    },
    {
      label: "Comercial",
      itemIds: ['pos', 'leads', 'whatsapp', 'ai_chat', 'ai_learning'],
    },
    {
      label: "Gestão",
      itemIds: ['financial', 'projects', 'erp', 'settings', 'support'],
    },
  ]

  return (
    <div className="flex flex-col h-full bg-black text-white border-r border-white/10">
      {/* Logo */}
      <div className="flex flex-col border-b border-white/10">
        <div className="h-16 flex items-center px-4">
          <Link href={isAffiliate ? "/portal/affiliate/dashboard" : "/dashboard"} className="flex items-center gap-2" onClick={onNavigate}>
            {(branding as { useLogo?: boolean }).useLogo ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={28} height={28} className="object-contain" />
              </div>
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                branding.accentShadow ?? "shadow-red-600/20",
                branding.gradient ? `bg-gradient-to-br ${branding.gradient}` : "bg-gradient-to-br from-red-600 to-orange-600"
              )}>
                <branding.icon className="w-5 h-5 text-white" />
              </div>
            )}
            {!collapsed && (
              <span className="text-lg font-black tracking-tighter">
                {branding.name}<span className={branding.accentText ?? "text-red-600"}>
                  {branding.accentName}
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Studio Switcher */}
        {!isAffiliate && !collapsed && studios.length > 0 && (
          <div className="px-3 pb-3">
            {studios.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between px-3 h-10 border-white/10 bg-white/5 hover:bg-white/10 text-white">
                    <div className="flex items-center gap-2 truncate">
                      <Building className={cn("w-4 h-4 flex-shrink-0", branding.secondaryColor)} />
                      <span className="truncate text-xs font-bold uppercase tracking-widest">{activeStudio?.name || t.sidebar.selectStudio}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] bg-slate-900 border-white/10 text-white">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.sidebar.switchStudio}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {studios.map(studio => (
                    <DropdownMenuItem 
                      key={studio.id} 
                      onClick={() => switchStudio(studio.id)}
                      className={cn("gap-2 cursor-pointer hover:bg-white/5 focus:bg-white/5", studio.id === studioId && `${branding.accentBgMuted ?? "bg-red-600/10"} ${branding.secondaryColor} font-bold`)}
                    >
                      <Building className="w-3 h-3" />
                      <span className="truncate">{studio.name}</span>
                      {studio.id === studioId && <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", branding.accentBg ?? "bg-red-600")} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-white/10 bg-white/5 text-slate-400">
                <Building className={cn("w-4 h-4 flex-shrink-0", branding.secondaryColor)} />
                <span className="truncate text-xs font-bold uppercase tracking-widest">{studios[0].name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {isFireProtection ? (
          <div className="space-y-4">
            {fireProtectionGroups.map((group, gi) => {
              const groupItems = activeItems.filter(item => group.itemIds.includes(item.id))
              if (groupItems.length === 0) return null
              return (
                <div key={group.label}>
                  {!collapsed && (
                    <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                      {group.label}
                    </p>
                  )}
                  {gi > 0 && collapsed && <div className="my-2 border-t border-white/10" />}
                  <div className="space-y-0.5">
                    {groupItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.id + item.href}
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group relative",
                            isActive
                              ? `${branding.accentBg ?? "bg-red-600"} ${(branding as { accentForeground?: string }).accentForeground ?? "text-white"} shadow-lg ${branding.accentShadow ?? "shadow-red-600/20"} font-bold`
                              : "text-slate-400 hover:bg-white/5 hover:text-white",
                            collapsed && "justify-center"
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? ((branding as { accentForeground?: string }).accentForeground ?? "text-white") : "text-slate-500", !isActive && (branding.secondaryColor === "text-white/70" ? "group-hover:text-white/70" : "group-hover:text-red-500"))} />
                            {!collapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                          </div>
                          {isActive && !collapsed && (
                            <div className={cn("w-1 h-4 rounded-full", (branding as { accentForeground?: string }).accentForeground === "text-black" ? "bg-black" : "bg-white")} />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ul className="space-y-1">
            {activeItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.id + item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group relative",
                      isActive
                        ? `${branding.accentBg ?? "bg-red-600"} ${(branding as { accentForeground?: string }).accentForeground ?? "text-white"} shadow-lg ${branding.accentShadow ?? "shadow-red-600/20"} font-bold`
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? ((branding as { accentForeground?: string }).accentForeground ?? "text-white") : "text-slate-500", !isActive && (branding.secondaryColor === "text-white/70" ? "group-hover:text-white/70" : "group-hover:text-red-500"))} />
                      {!collapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                    </div>
                    {isActive && !collapsed && (
                      <div className={cn("w-1 h-4 rounded-full", (branding as { accentForeground?: string }).accentForeground === "text-black" ? "bg-black" : "bg-white")} />
                    )}
                  </Link>
                </li>
              )
            })}

            {/* Seção Marketplace para módulos não ativos */}
            {!isAffiliate && marketplaceItems.length > 0 && (
              <>
                <div className="mt-6 mb-2 px-3">
                  <div className="h-px bg-sidebar-border w-full mb-4" />
                  {!collapsed && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <ShoppingBag className="w-3 h-3" />
                      {t.sidebar.marketplaceUpgrades}
                    </div>
                  )}
                </div>
                
                {marketplaceItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.id + item.href}>
                      <Link
                        href="/dashboard/marketplace"
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group relative",
                          "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground opacity-80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </div>

                        {!collapsed && (
                          <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Lock className="w-2.5 h-2.5 mr-1" />
                            PRO
                          </div>
                        )}

                        {collapsed && (
                          <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5 border border-background">
                            <Lock className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </>
            )}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full group",
            "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Languages className={cn("w-5 h-5 flex-shrink-0 transition-colors", branding.secondaryColor === "text-white/70" ? "group-hover:text-white/70" : "group-hover:text-red-500")} />
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest">
              {language === 'pt' ? t.sidebar.english : t.sidebar.portuguese}
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full group",
            "text-slate-400",
            branding.secondaryColor === "text-white/70" ? "hover:bg-white/10 hover:text-white" : "hover:bg-red-500/10 hover:text-red-500"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="text-xs font-bold uppercase tracking-widest">{t.sidebar.logout}</span>}
        </button>
      </div>
    </div>
  )
}
