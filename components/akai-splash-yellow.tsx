"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SplashScene } from "@/components/splash-scene"

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 }

export function AkaiSplashYellow() {
  return (
    <main className="relative w-full h-screen min-h-screen overflow-hidden bg-black">
      {/* Cena 3D - espirais orgânicas vibrantes (inspirada na imagem) */}
      <SplashScene theme="aurora" />

      {/* Overlay escuro sutil para legibilidade do texto */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"
        aria-hidden
      />

      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 px-6 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-cyan-400 text-center"
          >
            AKAAICORE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.7 }}
            className="text-xs md:text-sm text-cyan-300/70 font-medium text-center max-w-xs"
          >
            by AKAAI
            <br />
            <span className="text-cyan-200/60">Also known as Artificial Intelligence HUB.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.9 }}
          >
            <Link href="/home">
              <Button
                size="lg"
                className="h-14 px-12 text-lg font-black rounded-full bg-cyan-500 hover:bg-cyan-400 text-black border-0"
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
