"use client"

import { useEffect, useRef } from "react"

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const section = canvas.closest("section")
    const handleMove = (e: MouseEvent) => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = null }
    section?.addEventListener("mousemove", handleMove)
    section?.addEventListener("mouseleave", handleLeave)

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = []
    const particleCount = 40

    const resize = () => {
      const parent = canvas.parentElement
      let w = parent?.clientWidth ?? 0
      let h = parent?.clientHeight ?? 0
      if (w <= 0 || h <= 0) {
        w = window.innerWidth
        h = window.innerHeight
      }
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            r: Math.random() * 1.5 + 0.5,
          })
        }
      }
    }

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const mouse = mouseRef.current

      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)

      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.04)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 220 && dist > 0) {
            const f = (1 - dist / 220) * 0.06
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + dx
        p.y += p.vy + dy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.55 + Math.random() * 0.25})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const ddx = p.x - q.x
          const ddy = p.y - q.y
          const dist = Math.sqrt(ddx * ddx + ddy * ddy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,255,255,${0.2 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    requestAnimationFrame(resize)
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)
    draw()
    return () => {
      section?.removeEventListener("mousemove", handleMove)
      section?.removeEventListener("mouseleave", handleLeave)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full min-w-full min-h-full"
      style={{ opacity: 1 }}
      aria-hidden
    />
  )
}
