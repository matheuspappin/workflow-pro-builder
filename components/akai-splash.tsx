"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ConstellationCanvas } from "@/components/constellation-canvas"

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 }

export function AkaiSplash() {
  return (
    <main className="relative w-full h-screen min-h-screen overflow-hidden bg-black">
      {/* Animação canvas: constelação + logo AK centralizado */}
      <ConstellationCanvas />

      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-20 px-6 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-6 pointer-events-auto w-full max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white text-center"
          >
            AKAAICORE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.7 }}
            className="text-xs md:text-sm text-white/60 font-medium text-center max-w-xs"
          >
            by AKAAI
            <br />
            <span className="text-white/50">Also known as Artificial Intelligence HUB.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.9 }}
          >
            <Link href="/home">
              <Button
                size="lg"
                className="h-14 px-12 text-lg font-black rounded-full"
              >
                Entrar
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
