"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function AnimatedButton({ children, className, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block w-full sm:w-auto"
    >
      <Button
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          className
        )}
        {...props}
      >
        <motion.div
          className="absolute inset-0 bg-white/10 opacity-0 transition-opacity hover:opacity-100"
          initial={false}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Button>
    </motion.div>
  )
}
