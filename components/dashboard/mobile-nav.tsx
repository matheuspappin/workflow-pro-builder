"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, Building2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { NavContent } from "./nav-content"
import { useOrganization } from "@/components/providers/organization-provider"
import { getNicheBranding } from "@/lib/niche-utils"
import { NICHE_TO_VERTICALIZATION } from "@/config/portal-routes"
import { OFFICIAL_LOGO } from "@/config/branding"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MobileNavProps {
  isAffiliate?: boolean
  isSeller?: boolean
  isFinance?: boolean
}

const AKAAICORE_BRANDING = {
  name: "AKAAI",
  accentName: "CORE",
  gradient: null,
  accentText: "text-primary",
  icon: Sparkles,
}

export function MobileNav({ isAffiliate = false, isSeller = false, isFinance = false }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const { enabledModules, studios, studioId, switchStudio, niche } = useOrganization()
  const isGenericNiche = !niche || !NICHE_TO_VERTICALIZATION[niche]
  const useAkaaiBranding = isAffiliate || isGenericNiche
  const branding = useAkaaiBranding
    ? { ...getNicheBranding("dance"), ...AKAAICORE_BRANDING }
    : getNicheBranding(niche || "dance")

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden mr-2">
        <div className={cn(
          "flex items-center gap-2 font-bold text-lg whitespace-nowrap shrink-0",
          useAkaaiBranding && "text-foreground"
        )}>
          {useAkaaiBranding ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={24} height={24} className="object-contain" />
            </div>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg",
              branding.gradient ? `bg-gradient-to-br ${branding.gradient}` : "bg-gradient-to-br from-red-600 to-orange-600"
            )}>
              <branding.icon className="w-4 h-4" />
            </div>
          )}
          {branding.name} <span className={branding.accentText ?? "text-red-600"}>{branding.accentName}</span>
        </div>

        {studios.length > 1 ? (
          <div className="flex-1 min-w-[100px] max-w-[160px]">
            <Select value={studioId || ""} onValueChange={switchStudio}>
              <SelectTrigger className="h-8 text-[11px] px-2 gap-1 bg-muted/50 border-none focus:ring-0">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-primary" />
                <SelectValue placeholder="Unidade" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id} className="text-xs">
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : studios.length === 1 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-[11px] font-medium text-muted-foreground truncate max-w-[120px]">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="truncate">{studios[0].name}</span>
          </div>
        )}
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <NavContent onNavigate={() => setOpen(false)} isAffiliate={isAffiliate} isSeller={isSeller} isFinance={isFinance} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
