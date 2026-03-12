"use client"

import { useEffect, useRef } from "react"

/** Canvas com ondas horizontais e partículas cósmicas — estilo akaaicore Core */
export function CoreSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    const handleMove = (e: MouseEvent) => {
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    const handleLeave = () => { mouseRef.current = null }
    parent?.addEventListener("mousemove", handleMove)
    parent?.addEventListener("mouseleave", handleLeave)

    let animationId = 0
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number; phase: number; isCosmic: boolean }> = []
    const particleCount = 70

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        const centerY = h * 0.5
        for (let i = 0; i < particleCount; i++) {
          const rnd = Math.random()
          const x = Math.random() * w
          const y = centerY - h * 0.35 + Math.random() * (h * 0.7)
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08,
            r: rnd < 0.12 ? 6 + Math.random() * 10 : Math.random() * 1.5 + 0.2,
            opacity: rnd < 0.12 ? 0.08 + Math.random() * 0.15 : 0.2 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            isCosmic: rnd < 0.12,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return

      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)

      const time = t * 0.0008
      const centerY = h * 0.55
      const mouse = mouseRef.current

      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.05)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      const amplitude = h * 0.06
      const frequency = 0.003
      const waveCountReduced = 4
      const waveSpacing = 50

      const waveShift = mouse ? ((mouse.y - h / 2) / h) * 20 : 0
      for (let wav = 0; wav < waveCountReduced; wav++) {
        const offsetY = (wav - (waveCountReduced - 1) / 2) * waveSpacing + centerY + waveShift
        const phase = (wav / waveCountReduced) * Math.PI * 2 + time

        ctx.beginPath()
        for (let x = -20; x <= w + 20; x += 4) {
          const y = offsetY + Math.sin(x * frequency + phase) * amplitude
          if (x === -20) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 180 && dist > 0) {
            const f = (1 - dist / 180) * 0.06
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.2 + dx
        p.y += p.vy + dy
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20

        const twinkle = 0.6 + Math.sin(t * 0.004 + p.phase * 3) * 0.4
        const flicker = p.opacity * twinkle

        if (p.isCosmic) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
          grad.addColorStop(0, `rgba(255, 255, 255, ${flicker * 0.6})`)
          grad.addColorStop(0.4, `rgba(255, 255, 255, ${flicker * 0.25})`)
          grad.addColorStop(1, "rgba(255, 255, 255, 0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`
          ctx.fill()
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    animationId = requestAnimationFrame(draw)

    return () => {
      parent?.removeEventListener("mousemove", handleMove)
      parent?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      aria-hidden
    />
  )
}
