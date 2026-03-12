import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingUp,
  Phone,
  MessageSquare,
  BarChart3,
  Settings,
  Trophy,
  Music,
  UserCheck,
  QrCode,
  ShoppingCart,
  Layers,
  Store,
  Package,
  CreditCard,
  Wallet,
  Receipt,
  Video,
} from "lucide-react"

export type DanceStudioModuleKey =
  | "dashboard"
  | "scanner"
  | "students"
  | "classes"
  | "financial"
  | "whatsapp"
  | "pos"
  | "erp"
  | "inventory"
  | "marketplace"
  | "leads"
  | "gamification"
  | "multi_unit"
  | "ai_chat"
  | "fiscal"

export interface DanceStudioNavItem {
  id: string
  href: string
  label: string
  icon: LucideIcon
  module?: DanceStudioModuleKey
}

export interface DanceStudioNavGroup {
  label: string
  items: DanceStudioNavItem[]
}

export const DANCE_STUDIO_NAV_GROUPS: DanceStudioNavGroup[] = [
  {
    label: "Operacional",
    items: [
      { id: "dashboard", href: "/solutions/estudio-de-danca/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        id: "alunos",
        href: "/solutions/estudio-de-danca/dashboard/alunos",
        label: "Alunos",
        icon: Users,
        module: "students",
      },
      {
        id: "turmas",
        href: "/solutions/estudio-de-danca/dashboard/turmas",
        label: "Turmas & Aulas",
        icon: Calendar,
        module: "classes",
      },
      {
        id: "professores",
        href: "/solutions/estudio-de-danca/dashboard/professores",
        label: "Professores",
        icon: GraduationCap,
        module: "classes",
      },
      {
        id: "pagamentos-professores",
        href: "/solutions/estudio-de-danca/dashboard/pagamentos-professores",
        label: "Pagamentos Professores",
        icon: Wallet,
        module: "classes",
      },
      {
        id: "scanner",
        href: "/solutions/estudio-de-danca/dashboard/scanner",
        label: "Scanner QR",
        icon: QrCode,
        module: "scanner",
      },
      {
        id: "ao-vivo",
        href: "/solutions/estudio-de-danca/dashboard/ao-vivo",
        label: "Aulas ao Vivo",
        icon: Video,
        module: "classes",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        id: "vendas",
        href: "/solutions/estudio-de-danca/dashboard/vendas",
        label: "PDV (Ponto de Venda)",
        icon: ShoppingCart,
        module: "pos",
      },
      {
        id: "leads",
        href: "/solutions/estudio-de-danca/dashboard/leads",
        label: "Clientes (CRM)",
        icon: TrendingUp,
        module: "leads",
      },
      {
        id: "whatsapp",
        href: "/solutions/estudio-de-danca/dashboard/whatsapp",
        label: "WhatsApp",
        icon: Phone,
        module: "whatsapp",
      },
      {
        id: "chat",
        href: "/solutions/estudio-de-danca/dashboard/chat",
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
        id: "gamificacao",
        href: "/solutions/estudio-de-danca/dashboard/gamificacao",
        label: "Gamificação",
        icon: Trophy,
        module: "gamification",
      },
      {
        id: "financeiro",
        href: "/solutions/estudio-de-danca/dashboard/financeiro",
        label: "Financeiro",
        icon: DollarSign,
        module: "financial",
      },
      {
        id: "relatorios",
        href: "/solutions/estudio-de-danca/dashboard/relatorios",
        label: "Relatórios",
        icon: BarChart3,
      },
      {
        id: "erp",
        href: "/solutions/estudio-de-danca/dashboard/erp",
        label: "ERP",
        icon: Layers,
        module: "erp",
      },
      {
        id: "emissor-fiscal",
        href: "/solutions/estudio-de-danca/dashboard/emissor-fiscal",
        label: "Emissor Fiscal (NF-e)",
        icon: Receipt,
        module: "fiscal",
      },
      {
        id: "estoque",
        href: "/solutions/estudio-de-danca/dashboard/estoque",
        label: "Estoque",
        icon: Package,
        module: "inventory",
      },
      {
        id: "marketplace",
        href: "/solutions/estudio-de-danca/dashboard/marketplace",
        label: "Marketplace",
        icon: Store,
        module: "marketplace",
      },
      {
        id: "planos",
        href: "/solutions/estudio-de-danca/dashboard/planos",
        label: "Planos e Preços",
        icon: CreditCard,
      },
      {
        id: "configuracoes",
        href: "/solutions/estudio-de-danca/dashboard/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
]

/**
 * Filtra a navegação pelos módulos habilitados no plano (100% controlado pelo admin).
 * - undefined/vazio: mostra apenas itens sem módulo (dashboard, planos, configuracoes)
 * - ERP não auto-libera inventory/marketplace; cada um deve estar explícito no plano
 */
export function getFilteredDanceStudioNav(
  enabledModules?: Record<string, boolean> | null
): DanceStudioNavGroup[] {
  const effective: Record<string, boolean> = {
    ...(enabledModules || {}),
  }

  return DANCE_STUDIO_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.module) return true
      return effective[item.module] === true
    }),
  })).filter((group) => group.items.length > 0)
}
