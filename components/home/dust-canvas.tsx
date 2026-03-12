"use client"

import { useEffect, useRef } from "react"

export function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    const dust: Array<{
      x: number
      y: number
      vx: number
      vy: number
      r: number
      baseOpacity: number
      phase: number
    }> = []
    const dustCount = 80

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        dust.length = 0
        for (let i = 0; i < dustCount; i++) {
          dust.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08 - 0.02,
            r: Math.random() * 0.8 + 0.2,
            baseOpacity: 0.08 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const t = Date.now() * 0.001
      for (const d of dust) {
        d.x += d.vx + Math.sin(t + d.phase) * 0.05
        d.y += d.vy
        if (d.x < -10) d.x = canvas.width + 10
        if (d.x > canvas.width + 10) d.x = -10
        if (d.y < -10) d.y = canvas.height + 10
        if (d.y > canvas.height + 10) d.y = -10

        const flicker = 0.85 + Math.sin(t * 2 + d.phase * 3) * 0.15
        const opacity = d.baseOpacity * flicker

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    draw()

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId)
      } else {
        animationId = requestAnimationFrame(draw)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", handleVisibility)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ opacity: 1 }}
      aria-hidden
    />
  )
}
