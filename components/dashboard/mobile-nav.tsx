"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { NavContent } from "./nav-content"

interface MobileNavProps {
  isAffiliate?: boolean
}

export function MobileNav({ isAffiliate = false }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 font-bold text-lg">
        Workflow <span className="text-primary">Pro</span>
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
          <NavContent onNavigate={() => setOpen(false)} isAffiliate={isAffiliate} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
