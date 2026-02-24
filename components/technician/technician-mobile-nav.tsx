"use client"

import { LayoutDashboard, Calendar, DollarSign, User, QrCode } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TechnicianMobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      label: "Início",
      icon: LayoutDashboard,
      href: "/technician",
      active: pathname === "/technician"
    },
    {
      label: "Scanner",
      icon: QrCode,
      href: "/technician/scanner",
      active: pathname.startsWith("/technician/scanner")
    },
    {
      label: "OSs",
      icon: Calendar,
      href: "/technician/os-list", // Nova rota para listar OSs do técnico
      active: pathname.startsWith("/technician/os-list")
    },
    {
      label: "Perfil",
      icon: User,
      href: "/technician/perfil",
      active: pathname.startsWith("/technician/perfil")
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50 md:hidden">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          className={cn(
            "flex flex-col gap-1 h-auto py-2 px-1 flex-1 rounded-none",
            item.active ? "text-primary bg-primary/5 border-t-2 border-primary" : "text-muted-foreground"
          )}
          onClick={() => router.push(item.href)}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </Button>
      ))}
    </nav>
  )
}
