"use client"

import { useRef, useEffect } from "react"

export function FireControlLogoCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 280
    let height = 72
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        width = parent.clientWidth
        height = parent.clientHeight
      }
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current

      ctx.clearRect(0, 0, width, height)

      const logoX = width * 0.5
      const logoY = height * 0.5
      const logoSize = Math.min(width * 0.22, 52)
      const glowPulse = 0.5 + 0.2 * Math.sin(t * 2)

      ctx.font = `900 ${logoSize}px "Inter", system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Glow exterior (halo vermelho pulsante)
      const glowGrad = ctx.createRadialGradient(
        logoX, logoY, 0,
        logoX, logoY, logoSize * 5
      )
      glowGrad.addColorStop(0, `rgba(220, 38, 38, ${0.2 * glowPulse})`)
      glowGrad.addColorStop(0.25, `rgba(200, 60, 30, ${0.1 * glowPulse})`)
      glowGrad.addColorStop(0.5, `rgba(220, 38, 38, ${0.04 * glowPulse})`)
      glowGrad.addColorStop(1, "transparent")
      ctx.fillStyle = glowGrad
      ctx.fillText("FireControl", logoX, logoY)

      // Outline escuro para definição
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.6})`
      ctx.lineWidth = logoSize * 0.06
      ctx.lineJoin = "round"
      ctx.strokeText("FireControl", logoX, logoY)

      // Gradiente animado: Fire (branco/laranja) → Control (vermelho → ciano)
      const grad = ctx.createLinearGradient(logoX - 120, 0, logoX + 120, 0)
      const firePhase = 0.85 + 0.15 * Math.sin(t * 1.5)
      grad.addColorStop(0, `rgba(255, 255, 255, ${firePhase})`)
      grad.addColorStop(0.25, `rgba(255, 200, 150, ${firePhase})`)
      grad.addColorStop(0.45, `rgba(255, 100, 80, ${firePhase})`)
      grad.addColorStop(0.6, `rgba(220, 60, 60, ${firePhase})`)
      grad.addColorStop(0.8, `rgba(180, 120, 180, ${firePhase * 0.95})`)
      grad.addColorStop(1, `rgba(80, 160, 255, ${firePhase * 0.9})`)
      ctx.fillStyle = grad
      ctx.fillText("FireControl", logoX, logoY)

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block" }}
      aria-hidden
    />
  )
}
