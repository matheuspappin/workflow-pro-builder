import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Building2,
  Wrench,
  HardHat,
  Ruler,
  ClipboardList,
  Package,
  Calendar,
  ShoppingCart,
  UserCheck,
  TrendingUp,
  Phone,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react"

export type FireProtectionModuleKey =
  | "dashboard"
  | "students"
  | "service_orders"
  | "inventory"
  | "financial"
  | "pos"
  | "leads"
  | "whatsapp"
  | "ai_chat"

export interface FireProtectionNavItem {
  id: string
  href: string
  label: string
  icon: LucideIcon
  module?: FireProtectionModuleKey
}

export interface FireProtectionNavGroup {
  label: string
  items: FireProtectionNavItem[]
}

export const FIRE_PROTECTION_NAV_GROUPS: FireProtectionNavGroup[] = [
  {
    label: "Operacional",
    items: [
      { id: "dashboard", href: "/solutions/fire-protection/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        id: "clientes",
        href: "/solutions/fire-protection/dashboard/clientes",
        label: "Clientes / Edificações",
        icon: Building2,
        module: "students",
      },
      {
        id: "tecnicos",
        href: "/solutions/fire-protection/dashboard/tecnicos",
        label: "Técnicos",
        icon: Wrench,
        module: "service_orders",
      },
      {
        id: "engenheiros",
        href: "/solutions/fire-protection/dashboard/engenheiros",
        label: "Engenheiros",
        icon: HardHat,
        module: "service_orders",
      },
      {
        id: "arquitetos",
        href: "/solutions/fire-protection/dashboard/arquitetos",
        label: "Arquitetos",
        icon: Ruler,
        module: "service_orders",
      },
      {
        id: "os",
        href: "/solutions/fire-protection/dashboard/os",
        label: "Ordens de Serviço",
        icon: ClipboardList,
        module: "service_orders",
      },
      {
        id: "extintores",
        href: "/solutions/fire-protection/dashboard/extintores",
        label: "Extintores",
        icon: Package,
        module: "inventory",
      },
      {
        id: "vistorias",
        href: "/solutions/fire-protection/dashboard/vistorias",
        label: "Vistorias",
        icon: Calendar,
        module: "service_orders",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        id: "vendas",
        href: "/solutions/fire-protection/dashboard/vendas",
        label: "PDV — Vendas",
        icon: ShoppingCart,
        module: "pos",
      },
      {
        id: "portal-vendedor",
        href: "/solutions/fire-protection/dashboard/portal-vendedor",
        label: "Portal do Vendedor",
        icon: UserCheck,
        module: "leads",
      },
      {
        id: "leads",
        href: "/solutions/fire-protection/dashboard/leads",
        label: "Leads / CRM",
        icon: TrendingUp,
        module: "leads",
      },
      {
        id: "whatsapp",
        href: "/solutions/fire-protection/dashboard/whatsapp",
        label: "WhatsApp",
        icon: Phone,
        module: "whatsapp",
      },
      {
        id: "chat",
        href: "/solutions/fire-protection/dashboard/chat",
        label: "Chat IA",
        icon: MessageSquare,
        module: "ai_chat",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        id: "financeiro",
        href: "/solutions/fire-protection/dashboard/financeiro",
        label: "Financeiro",
        icon: DollarSign,
        module: "financial",
      },
      {
        id: "planos",
        href: "/solutions/fire-protection/dashboard/planos",
        label: "Planos e Assinatura",
        icon: CreditCard,
      },
      {
        id: "relatorios",
        href: "/solutions/fire-protection/dashboard/relatorios",
        label: "Relatórios",
        icon: BarChart3,
      },
      {
        id: "configuracoes",
        href: "/solutions/fire-protection/dashboard/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
]

/**
 * Filtra a navegação do Fire Control pelos módulos habilitados no plano.
 */
export function getFilteredFireProtectionNav(
  enabledModules?: Record<string, boolean> | null
): FireProtectionNavGroup[] {
  const effective: Record<string, boolean> = {
    ...(enabledModules || {}),
  }

  return FIRE_PROTECTION_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.module) return true
      return effective[item.module] === true
    }),
  })).filter((group) => group.items.length > 0)
}
