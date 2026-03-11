"use client"

import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavContent } from "./nav-content"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isAffiliate?: boolean
  isSeller?: boolean
  isFinance?: boolean
}

export function Sidebar({ collapsed, onToggle, isAffiliate, isSeller, isFinance }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col transition-all duration-300 z-30",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <NavContent collapsed={collapsed} isAffiliate={isAffiliate} isSeller={isSeller} isFinance={isFinance} />

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent hidden md:flex"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>
    </aside>
  )
}
