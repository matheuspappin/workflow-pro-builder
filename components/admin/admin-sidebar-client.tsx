"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  PlusCircle,
  CreditCard,
  LifeBuoy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Users,
  FlaskConical,
  X,
  Handshake,
  Layers,
  FireExtinguisher,
  ChevronDown,
  Activity,
  Shield,
  Stethoscope,
  Wrench,
  Hammer,
  Truck,
  Car,
  Scissors,
  Dumbbell,
  ChefHat,
  Leaf,
  Music,
  Camera,
  Home,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  Briefcase,
  Package,
  Heart,
  Globe,
  Zap,
  Star,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { clearLocalUser } from "@/lib/constants/storage-keys"

// Mapa de ícones por nome (igual ao usado nas páginas de verticalização)
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FireExtinguisher, Shield, Stethoscope, Wrench, Hammer, Truck, Car,
  Scissors, Dumbbell, ChefHat, Leaf, Music, Camera, Home, BookOpen,
  GraduationCap, ShoppingCart, Briefcase, Package, Heart, Globe, Layers,
  Zap, Star, Users, Settings, Building2,
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'text-emerald-400 bg-emerald-500/20' },
  beta: { label: 'Beta', className: 'text-amber-400 bg-amber-500/20' },
  coming_soon: { label: 'Breve', className: 'text-white/40 bg-white/5' },
}

interface SidebarVerticalization {
  id: string
  name: string
  slug: string
  icon_name: string
  icon_color: string
  status: string
  admin_url?: string
}

export function AdminSidebarClient() {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [verticalizationsOpen, setVerticalizationsOpen] = useState(
    pathname.startsWith('/admin/verticalizations')
  )
  const [verticalizations, setVerticalizations] = useState<SidebarVerticalization[]>([])
  const [loadingVerticals, setLoadingVerticals] = useState(false)

  // Carrega verticalizações dinamicamente via API
  useEffect(() => {
    let cancelled = false

    async function fetchVerticalizations() {
      setLoadingVerticals(true)
      try {
        const res = await fetch('/api/admin/verticalizations', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setVerticalizations(Array.isArray(data) ? data : [])
        }
      } catch {
        // silencia erros de rede
      } finally {
        if (!cancelled) setLoadingVerticals(false)
      }
    }

    fetchVerticalizations()
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    clearLocalUser('default')
    window.location.href = "/login"
  }

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
    { icon: Activity, label: "Status do Ecossistema", href: "/admin/ecosystem-status" },
    { icon: Building2, label: "Tenants (Empresas)", href: "/admin/studios" },
    { icon: Handshake, label: "Afiliados", href: "/admin/affiliates" },
    { icon: PlusCircle, label: "Novo Ecossistema", href: "/admin/ecosystems/new" },
    { icon: Users, label: "Usuários Globais", href: "/admin/users" },
    { icon: CreditCard, label: "Planos & Assinaturas", href: "/admin/plans" },
    { icon: Upload, label: "Importação de Dados", href: "/admin/import" },
    { icon: Database, label: "Logs do Sistema", href: "/admin/logs" },
    { icon: Sparkles, label: "Comportamento da Catarina", href: "/admin/catarina" },
    { icon: FlaskConical, label: "Testes Laborais", href: "/admin/testes" },
    { icon: LifeBuoy, label: "Suporte", href: "/admin/support" },
    { icon: Settings, label: "Configurações Globais", href: "/admin/settings" },
  ]

  return (
    <>
      {/* Botão hambúrguer fixo no mobile (fora da sidebar) */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-0 right-0 h-16 px-4 lg:hidden z-40 flex items-center text-white"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Overlay para Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-black text-white border-r border-white/10 flex flex-col transition-all duration-300 z-50 lg:z-40",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {(!sidebarCollapsed || mobileOpen) && (
              <span className="text-lg font-black tracking-tight">
                AKAAI <span className="text-white/50">HUB</span>
              </span>
            )}
          </Link>
          {mobileOpen && (
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-1">
          {/* Menu Principal */}
          <ul className="space-y-1">
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {(!sidebarCollapsed || mobileOpen) && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Seção de Verticalizações */}
          {(!sidebarCollapsed || mobileOpen) && (
            <div className="pt-3">
              <div className="px-3 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Verticalizações
                </p>
              </div>

              {/* Header clicável para colapsar/expandir */}
              <button
                onClick={() => setVerticalizationsOpen(!verticalizationsOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  pathname.startsWith('/admin/verticalizations')
                    ? "bg-white/5 text-white border border-white/10"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <Layers className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">Soluções White-Label</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  verticalizationsOpen ? "rotate-180" : ""
                )} />
              </button>

              {verticalizationsOpen && (
                <ul className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                  {/* Central de verticalizações */}
                  <li>
                    <Link
                      href="/admin/verticalizations"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        pathname === '/admin/verticalizations'
                          ? "bg-white/10 text-white font-semibold border border-white/20"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Layers className="w-4 h-4 flex-shrink-0" />
                      <span>Central de Soluções</span>
                    </Link>
                  </li>

                  {/* Nova verticalização */}
                  <li>
                    <Link
                      href="/admin/verticalizations/new"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        pathname === '/admin/verticalizations/new'
                          ? "bg-white/10 text-white font-semibold border border-white/20"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <PlusCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Nova Verticalização</span>
                    </Link>
                  </li>

                  {/* Lista dinâmica de verticalizações */}
                  {loadingVerticals && verticalizations.length === 0 && (
                    <li className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/10 animate-pulse flex-shrink-0" />
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                      </div>
                    </li>
                  )}
                  {verticalizations.map(v => {
                    const IconComp = ICON_MAP[v.icon_name] || Layers
                    const href = v.admin_url || `/admin/verticalizations/${v.slug}`
                    const isActive = pathname.startsWith(href)
                    const badge = STATUS_BADGE[v.status] || STATUS_BADGE.coming_soon
                    return (
                      <li key={v.id}>
                        <Link
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                            isActive
                              ? "bg-white/5 text-white font-semibold border border-white/10"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <IconComp className={cn("w-4 h-4 flex-shrink-0", v.icon_color)} />
                          <span className="flex-1 truncate">{v.name}</span>
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0',
                            badge.className
                          )}>
                            {badge.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Ícone colapsado para verticalizações */}
          {sidebarCollapsed && !mobileOpen && (
            <div className="pt-3">
              <Link
                href="/admin/verticalizations"
                className={cn(
                  "flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-200",
                  pathname.startsWith('/admin/verticalizations')
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
                title="Verticalizações"
              >
                <Layers className="w-5 h-5" />
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full",
              "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span className="text-sm font-medium">Sair do Painel</span>}
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-black border border-white/20 hover:bg-white/5 text-white/60 hidden lg:flex"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </aside>
    </>
  )
}
