import React from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfigureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
  className?: string
  label?: string
}

export function ConfigureButton({ onClick, className, label = "Configurar", ...props }: ConfigureButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2 shadow-xs hover:bg-accent hover:text-accent-foreground", className)}
      onClick={onClick}
      {...props}
    >
      <Settings className="w-4 h-4" />
      {label}
    </Button>
  )
}
