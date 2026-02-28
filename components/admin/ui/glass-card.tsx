"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface GlassCardProps extends React.ComponentProps<typeof motion.div> {
  className?: string
  children: React.ReactNode
}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]",
        className
      )}
      {...props}
    >
      {/* AKAAI HUB - subtle glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-[80px]" />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
