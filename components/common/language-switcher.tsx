"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useOrganization } from "@/components/providers/organization-provider"
import { cn } from "@/lib/utils"
import { Languages } from "lucide-react"

interface LanguageSwitcherProps {
  className?: string
  variant?: "ghost" | "outline" | "default"
  showIcon?: boolean
}

export function LanguageSwitcher({ 
  className, 
  variant = "ghost",
  showIcon = false 
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useOrganization()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const newLang = language === 'pt' ? 'en' : 'pt'
    setLanguage(newLang)
  }

  // Prevent hydration mismatch by rendering a consistent state initially
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="sm"
        disabled
        className={cn(
          "font-bold text-xs px-2 h-8 rounded-lg transition-all border border-foreground/10 opacity-0",
          className
        )}
      >
        {showIcon && <Languages className="w-4 h-4 mr-2" />}
        🇧🇷 PT
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "font-bold text-xs px-2 h-8 rounded-lg transition-all border border-foreground/10",
        variant === "ghost" && "hover:bg-primary/5 hover:text-primary",
        className
      )}
    >
      {showIcon && <Languages className="w-4 h-4 mr-2" />}
      {language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
    </Button>
  )
}
