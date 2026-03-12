"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { FireWaterCanvas } from "@/components/fire-protection/fire-water-canvas"
import { FireControlLogoCanvas } from "@/components/fire-protection/fire-control-logo-canvas"
import { ExtinguisherIcon } from "@/components/fire-protection/extinguisher-icon"
import { OFFICIAL_LOGO } from "@/config/branding"

export default function FireControlPrePage() {
  useEffect(() => {
    document.body.classList.add("scrollbar-sidebar-dark")
    return () => document.body.classList.remove("scrollbar-sidebar-dark")
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black font-sans">
      {/* Canvas interativo - colisão fogo/água */}
      <div className="absolute inset-0 z-0">
        <FireWaterCanvas className="w-full h-full" />
        {/* Overlay - mais suave no centro para o logo do canvas destacar */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 50% 40% at 50% 42%, transparent 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.88) 100%)
            `,
          }}
        />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        {/* Logo, badge e subtítulo — acima do Entrar */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                className="w-14 h-14 flex-shrink-0 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.5)]"
                animate={{
                  boxShadow: [
                    "0 0 40px rgba(220,38,38,0.5)",
                    "0 0 60px rgba(220,38,38,0.7)",
                    "0 0 40px rgba(220,38,38,0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ExtinguisherIcon className="w-8 h-8 text-white" />
              </motion.div>
              <div className="h-14 md:h-16 min-w-[280px] md:min-w-[360px] w-full max-w-[360px] flex items-center justify-center overflow-visible" aria-label="FireControl">
                <FireControlLogoCanvas className="w-full h-full" />
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
              Extintores • Vistorias • INMETRO
            </span>
          </div>
          <p className="text-slate-300 text-lg md:text-xl max-w-md mx-auto font-medium">
            Gestão inteligente de extintores e proteção contra incêndio
          </p>
        </motion.div>

        {/* Botão Entrar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative"
        >
          <Button
            size="lg"
            className="relative h-16 px-12 text-xl rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-bold border-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_25px_60px_-12px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group overflow-hidden"
            asChild
          >
            <Link href="/solutions/fire-protection/landing">
              <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-red-500/0 to-orange-500/0 group-hover:from-orange-400/10 group-hover:via-red-500/10 group-hover:to-orange-400/10 transition-colors duration-300" />
              <span className="relative flex items-center gap-2">
                Entrar
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            type="button"
            variant="ghost"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
            asChild
          >
            <Link href="/solutions/fire-protection/login">
              Já tenho conta
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2.5 group text-white/50 hover:text-white/80"
            asChild
          >
            <Link href="/home">
              <img src={OFFICIAL_LOGO} alt="AKAAI HUB" className="w-7 h-7 opacity-60 group-hover:opacity-90 transition-opacity object-contain" />
              <span className="font-black text-xs tracking-tight group-hover:text-white/80 transition-colors">AKAAI <span className="text-white/35">HUB</span></span>
            </Link>
          </Button>
          <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest">Powered by AKAAI CORE</span>
          <p className="text-[9px] text-white/25 font-mono uppercase tracking-wider">Also Known As Artificial Intelligence HUB</p>
        </motion.div>
      </div>
    </div>
  )
}
