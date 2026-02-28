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
} from "lucide-react"

export type DanceStudioModuleKey =
  | "dashboard"
  | "students"
  | "classes"
  | "financial"
  | "whatsapp"
  | "pos"
  | "leads"
  | "gamification"
  | "multi_unit"
  | "ai_chat"

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
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        id: "leads",
        href: "/solutions/estudio-de-danca/dashboard/leads",
        label: "Leads / CRM",
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
        id: "configuracoes",
        href: "/solutions/estudio-de-danca/dashboard/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
]

export function getFilteredDanceStudioNav(
  enabledModules?: Record<string, boolean> | null
): DanceStudioNavGroup[] {
  if (!enabledModules || Object.keys(enabledModules).length === 0) {
    return DANCE_STUDIO_NAV_GROUPS
  }

  return DANCE_STUDIO_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.module) return true
      return enabledModules[item.module] === true
    }),
  })).filter((group) => group.items.length > 0)
}
