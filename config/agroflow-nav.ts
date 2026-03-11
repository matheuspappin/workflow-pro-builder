import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  FileText,
  DollarSign,
  TrendingUp,
  Satellite,
  BarChart3,
  Settings,
  PencilRuler,
  MapPin,
  Leaf,
  MessageSquare,
  CreditCard,
} from "lucide-react"

export type AgroFlowModuleKey =
  | "dashboard"
  | "clients"
  | "engineers"
  | "technicians"
  | "work_orders"
  | "laudos"
  | "satellite_monitor"
  | "financial"
  | "leads"
  | "reports"
  | "properties"
  | "ai_chat"

export interface AgroFlowNavItem {
  id: string
  href: string
  label: string
  icon: LucideIcon
  module?: AgroFlowModuleKey
}

export interface AgroFlowNavGroup {
  label: string
  items: AgroFlowNavItem[]
}

export const AGROFLOW_NAV_GROUPS: AgroFlowNavGroup[] = [
  {
    label: "Operacional",
    items: [
      { id: "dashboard", href: "/solutions/agroflowai/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        id: "propriedades",
        href: "/solutions/agroflowai/dashboard/propriedades",
        label: "Propriedades Rurais",
        icon: Leaf,
        module: "properties",
      },
      {
        id: "ordens-servico",
        href: "/solutions/agroflowai/dashboard/ordens-servico",
        label: "Ordens de Serviço",
        icon: ClipboardList,
        module: "work_orders",
      },
      {
        id: "laudos",
        href: "/solutions/agroflowai/dashboard/laudos",
        label: "Laudos Técnicos",
        icon: FileText,
        module: "laudos",
      },
      {
        id: "satelite",
        href: "/solutions/agroflowai/dashboard/satelite",
        label: "Monitor Satélite",
        icon: Satellite,
        module: "satellite_monitor",
      },
    ],
  },
  {
    label: "Equipe",
    items: [
      {
        id: "engenheiros",
        href: "/solutions/agroflowai/dashboard/engenheiros",
        label: "Engenheiros",
        icon: PencilRuler,
        module: "engineers",
      },
      {
        id: "tecnicos",
        href: "/solutions/agroflowai/dashboard/tecnicos",
        label: "Técnicos de Campo",
        icon: Wrench,
        module: "technicians",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        id: "clientes",
        href: "/solutions/agroflowai/dashboard/clientes",
        label: "Clientes / Proprietários",
        icon: Users,
        module: "clients",
      },
      {
        id: "leads",
        href: "/solutions/agroflowai/dashboard/leads",
        label: "Leads / CRM",
        icon: TrendingUp,
        module: "leads",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        id: "chat",
        href: "/solutions/agroflowai/dashboard/chat",
        label: "Chat IA",
        icon: MessageSquare,
        module: "ai_chat",
      },
      {
        id: "financeiro",
        href: "/solutions/agroflowai/dashboard/financeiro",
        label: "Financeiro",
        icon: DollarSign,
        module: "financial",
      },
      {
        id: "planos",
        href: "/solutions/agroflowai/dashboard/planos",
        label: "Planos e Assinatura",
        icon: CreditCard,
      },
      {
        id: "relatorios",
        href: "/solutions/agroflowai/dashboard/relatorios",
        label: "Relatórios & CAR",
        icon: BarChart3,
        module: "reports",
      },
      {
        id: "configuracoes",
        href: "/solutions/agroflowai/dashboard/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
]

export function getFilteredAgroFlowNav(
  enabledModules?: Record<string, boolean> | null
): AgroFlowNavGroup[] {
  if (!enabledModules || Object.keys(enabledModules).length === 0) {
    return AGROFLOW_NAV_GROUPS
  }

  return AGROFLOW_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.module) return true
      return enabledModules[item.module] === true || enabledModules[item.module] === undefined
    }),
  })).filter((group) => group.items.length > 0)
}
