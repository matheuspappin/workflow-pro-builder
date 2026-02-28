"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface MotionButtonProps extends Omit<HTMLMotionProps<"button">, "children">, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden group")}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        {/* Shine effect on hover */}
        <motion.div
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />
      </motion.button>
    )
  }
)
MotionButton.displayName = "MotionButton"
