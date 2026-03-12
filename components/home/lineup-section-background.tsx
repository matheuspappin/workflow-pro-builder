"use client"

import { useEffect, useRef } from "react"

/** Canvas com linhas em perspectiva, curvas e partículas — estilo akaaicore Lineup */
export function LineupSectionBackground() {
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

    let animationId: number
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      r: number
      opacity: number
      phase: number
      isBokeh: boolean
    }> = []
    const particleCount = 55

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        particles.length = 0
        const vanishY = h * 0.15
        const vanishX = w * 0.5
        for (let i = 0; i < particleCount; i++) {
          const rnd = Math.random()
          const x = (rnd - 0.5) * w * 1.5 + vanishX
          const y = h * 0.4 + Math.random() * h * 0.7
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.1,
            r: rnd < 0.15 ? 8 + Math.random() * 12 : Math.random() * 1.5 + 0.3,
            opacity: rnd < 0.15 ? 0.12 + Math.random() * 0.2 : 0.2 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            isBokeh: rnd < 0.1,
          })
        }
      }
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return

      const time = t * 0.0006
      const vanishX = w * 0.5
      const vanishY = h * 0.12
      const mouse = mouseRef.current

      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, "rgb(2, 2, 2)")
      gradient.addColorStop(0.2, "rgb(1, 1, 1)")
      gradient.addColorStop(0.5, "rgb(0, 0, 0)")
      gradient.addColorStop(1, "#000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      const lineCount = 5
      const lineSpacing = 0.22
      const lineColor = (alpha: number) => `rgba(255, 255, 255, ${alpha})`

      for (let li = 0; li < lineCount; li++) {
        const offset = (li - (lineCount - 1) / 2) * lineSpacing
        const mouseShift = mouse ? ((mouse.x - vanishX) / w) * 12 : 0
        ctx.beginPath()
        const steps = 60
        for (let i = 0; i <= steps; i++) {
          const t0 = i / steps
          const x = (0.5 - t0) * w * 1.2 + vanishX + Math.sin(time + li) * 20 + mouseShift
          const y = h * 0.5 + t0 * h * 0.6 + Math.sin(t0 * 3 + time + li * 0.5) * 18
          const perspectiveY = vanishY + (y - vanishY) * (0.3 + 0.7 * t0)
          const perspectiveX = vanishX + (x - vanishX) * (0.2 + 0.8 * t0) + offset * w * t0
          if (i === 0) ctx.moveTo(perspectiveX, perspectiveY)
          else ctx.lineTo(perspectiveX, perspectiveY)
        }
        ctx.strokeStyle = lineColor(0.22 + 0.1 * Math.sin(time + li))
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      const curveShift = mouse ? ((mouse.x - w / 2) / w) * 20 : 0
      for (let c = 0; c < 2; c++) {
        ctx.beginPath()
        for (let x = -50; x <= w + 50; x += 10) {
          const y = h * (0.5 + c * 0.2) + Math.sin(x * 0.005 + time * 2) * 35 + curveShift
          if (x === -50) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = lineColor(0.1 + 0.05 * Math.sin(time * 1.5 + c))
        ctx.lineWidth = 1
        ctx.stroke()
      }

      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.06)")
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      for (const p of particles) {
        let dx = 0, dy = 0
        if (mouse) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y)
          if (dist < 200 && dist > 0) {
            const f = (1 - dist / 200) * 0.08
            dx = (mouse.x - p.x) / dist * f
            dy = (mouse.y - p.y) / dist * f
          }
        }
        p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.15 + dx
        p.y += p.vy + dy
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        if (p.y > h + 20) p.y = -20

        const flicker = 0.75 + Math.sin(t * 0.003 + p.phase * 2) * 0.25

        if (p.isBokeh) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2)
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * flicker * 0.4})`)
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${p.opacity * flicker * 0.15})`)
          grad.addColorStop(1, "rgba(255, 255, 255, 0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * flicker * 0.9})`
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
