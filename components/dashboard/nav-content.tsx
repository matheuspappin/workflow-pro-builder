"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useVocabulary } from "@/hooks/use-vocabulary"
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
} from "lucide-react"
import { getNicheIcon } from "@/lib/niche-utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { Button } from "@/components/ui/button"

interface NavContentProps {
  collapsed?: boolean
  onNavigate?: () => void
  isAffiliate?: boolean
}

export function NavContent({ collapsed = false, onNavigate, isAffiliate = false }: NavContentProps) {
  const pathname = usePathname()
  const { vocabulary, enabledModules, niche, loading: vocabLoading } = useVocabulary()
  const { language, setLanguage } = useOrganization()

  const dashboardMenuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: language === 'pt' ? "Dashboard" : "Dashboard",
      href: "/dashboard"
    },
    {
      id: 'ao-vivo',
      icon: Video,
      label: language === 'pt' ? `${vocabulary.services} ao Vivo` : `Live ${vocabulary.services}`,
      href: "/dashboard/ao-vivo",
      module: 'classes'
    },
    {
      id: 'scanner',
      icon: QrCodeIcon,
      label: language === 'pt' ? "Scanner Portaria" : "Gate Scanner",
      href: "/dashboard/scanner",
      module: 'scanner'
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      label: language === 'pt' ? "PDV (Vendas)" : "POS (Sales)",
      href: "/dashboard/estoque",
      module: 'pos'
    },
    {
      id: 'students',
      icon: getNicheIcon(niche || 'dance', 'client'),
      label: `${vocabulary.clients}`,
      href: "/dashboard/alunos",
      module: 'students'
    },
    {
      id: 'leads',
      icon: TrendingUp,
      label: language === 'pt' ? "Leads (CRM)" : "Leads (CRM)",
      href: "/dashboard/leads",
      module: 'leads'
    },
    {
      id: 'teachers',
      icon: getNicheIcon(niche || 'dance', 'provider'),
      label: `${vocabulary.providers}`,
      href: "/dashboard/professores",
      module: 'classes'
    },
    {
      id: 'classes',
      icon: getNicheIcon(niche || 'dance', 'service'),
      label: `${vocabulary.services}`,
      href: "/dashboard/aulas",
      module: 'classes'
    },
    {
      id: 'financial',
      icon: DollarSign,
      label: language === 'pt' ? "Financeiro" : "Financial",
      href: "/dashboard/financeiro",
      module: 'financial'
    },
    {
      id: 'whatsapp',
      icon: Phone,
      label: "WhatsApp",
      href: "/dashboard/whatsapp",
      module: 'whatsapp'
    },
    {
      id: 'erp',
      icon: Globe,
      label: "ERP Enterprise",
      href: "/dashboard/erp",
      module: 'erp'
    },
    {
      id: 'service-orders',
      icon: Wrench,
      label: language === 'pt' ? "Ordens de Serviço" : "Service Orders",
      href: "/dashboard/os",
      module: 'service_orders'
    },
    {
      id: 'marketplace',
      icon: ShoppingBag,
      label: "Marketplace",
      href: "/dashboard/marketplace",
      module: 'marketplace'
    },
    {
      id: 'ai_chat',
      icon: MessageSquare,
      label: language === 'pt' ? "Chat IA" : "AI Chat",
      href: "/dashboard/chat",
      module: 'ai_chat'
    },
    {
      id: 'settings',
      icon: Settings,
      label: language === 'pt' ? "Configurações" : "Settings",
      href: "/dashboard/configuracoes"
    },
    {
      id: 'support',
      icon: LifeBuoy,
      label: language === 'pt' ? "Suporte" : "Support",
      href: "/dashboard/support"
    },
  ]

  const affiliateMenuItems = [
    {
      id: 'affiliate-dashboard',
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/portal/affiliate/dashboard"
    },
    {
      id: 'affiliate-settings',
      icon: Settings,
      label: language === 'pt' ? "Configurações" : "Settings",
      href: "/portal/affiliate/settings"
    },
    {
      id: 'affiliate-support',
      icon: LifeBuoy,
      label: language === 'pt' ? "Suporte" : "Support",
      href: "/dashboard/support" 
    },
  ]

  const menuItems = isAffiliate ? affiliateMenuItems : dashboardMenuItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      logger.error('Erro ao limpar cookie de sessão:', e)
    }
    localStorage.removeItem("danceflow_user")
    window.location.href = isAffiliate ? "/portal/affiliate/login" : "/login"
  }

  // A lógica de módulos PRO e BASE_MODULES só se aplica ao dashboard principal
  const BASE_MODULES = ['dashboard', 'settings']

  const processedItems = menuItems.map(item => {
    // Se for o portal de afiliado, nenhum item deve ser desabilitado ou ter o tag "PRO"
    if (isAffiliate) {
      return { ...item, isDisabled: false };
    }

    const moduleKey = (item as any).module
    const isDisabled = moduleKey && !BASE_MODULES.includes(item.id) && enabledModules[moduleKey as keyof typeof enabledModules] === false
    return { ...item, isDisabled }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href={isAffiliate ? "/portal/affiliate/dashboard" : "/dashboard"} className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold">
              Workflow <span className="text-primary">Pro</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {processedItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    item.isDisabled && "opacity-80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}{item.isDisabled && " PRO"}</span>}
                  </div>

                  {item.isDisabled && !collapsed && (
                    <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      PRO
                    </div>
                  )}

                  {item.isDisabled && collapsed && (
                    <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5 border border-background">
                      <Lock className="w-2 h-2 text-white" />
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Languages className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">
              {language === 'pt' ? '🇺🇸 English' : '🇧🇷 Português'}
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{language === 'pt' ? 'Sair' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  )
}
