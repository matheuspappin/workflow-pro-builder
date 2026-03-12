"use client"

import { useRef, useEffect, useCallback } from "react"
import { OFFICIAL_LOGO } from "@/config/branding"

const DOT_COUNT = 180
const CONNECTION_DISTANCE = 0.13
const LOGO_SIZE_RATIO = 0.35
const PARALLAX_STRENGTH = 0.08
const MOUSE_SMOOTH = 0.06

interface Point {
  x: number
  y: number
  z: number // profundidade 0-1 (0=longe, 1=perto) para efeito 4D/parallax
  phase: number
  speed: number
}

export function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoRef = useRef<HTMLImageElement | null>(null)
  const logoNoBgRef = useRef<HTMLCanvasElement | null>(null)
  const pointsRef = useRef<Point[]>([])
  const connectionsRef = useRef<[number, number][]>([])
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  const initPoints = useCallback(() => {
    const points: Point[] = []
    for (let i = 0; i < DOT_COUNT; i++) {
      points.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(), // profundidade para efeito 4D
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      })
    }
    pointsRef.current = points

    const connections: [number, number][] = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x
        const dy = points[i].y - points[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DISTANCE) {
          connections.push([i, j])
        }
      }
    }
    connectionsRef.current = connections
  }, [])

  // Remove fundo preto do logo (pixels escuros -> transparente)
  const processLogoNoBg = useCallback((img: HTMLImageElement) => {
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    const id = ctx.getImageData(0, 0, c.width, c.height)
    const data = id.data
    const threshold = 40
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (r < threshold && g < threshold && b < threshold) {
        data[i + 3] = 0
      }
    }
    ctx.putImageData(id, 0, 0)
    return c
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = OFFICIAL_LOGO
    img.crossOrigin = "anonymous"
    img.onload = () => {
      logoRef.current = img
      logoNoBgRef.current = processLogoNoBg(img)
    }
  }, [processLogoNoBg])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = -(e.clientY / window.innerHeight - 0.5) * 2
      mouseRef.current.targetX = x
      mouseRef.current.targetY = y
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        const x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
        const y = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2
        mouseRef.current.targetX = x
        mouseRef.current.targetY = y
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      if (pointsRef.current.length === 0) initPoints()
    }

    let time = 0
    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      // Suavizar mouse
      const m = mouseRef.current
      m.x += (m.targetX - m.x) * MOUSE_SMOOTH
      m.y += (m.targetY - m.y) * MOUSE_SMOOTH

      ctx.clearRect(0, 0, w, h)
      time += 0.016

      const points = pointsRef.current
      const connections = connectionsRef.current

      // Rotação 4D: ângulo que simula projeção de hiperesfera
      const rot4d = time * 0.15
      const getProjectedPos = (p: Point) => {
        const wx = Math.cos(rot4d + p.phase) * p.z * 0.03
        const wy = Math.sin(rot4d * 1.3 + p.phase * 0.7) * p.z * 0.03
        return { wx, wy }
      }

      // Parallax interativo: pontos com z maior se movem mais com o mouse
      const parallaxX = m.x * PARALLAX_STRENGTH
      const parallaxY = m.y * PARALLAX_STRENGTH

      // Desenhar linhas com profundidade e projeção 4D
      ctx.lineWidth = 0.5
      connections.forEach(([i, j]) => {
        const p1 = points[i]
        const p2 = points[j]
        const proj1 = getProjectedPos(p1)
        const proj2 = getProjectedPos(p2)
        const off1X = parallaxX * p1.z * w * 0.5 + proj1.wx * w
        const off1Y = parallaxY * p1.z * h * 0.5 + proj1.wy * h
        const off2X = parallaxX * p2.z * w * 0.5 + proj2.wx * w
        const off2Y = parallaxY * p2.z * h * 0.5 + proj2.wy * h
        const x1 = p1.x * w + off1X
        const y1 = p1.y * h + off1Y
        const x2 = p2.x * w + off2X
        const y2 = p2.y * h + off2Y
        const depth = (p1.z + p2.z) / 2
        const pulse = 0.08 * Math.sin(time * p1.speed + p1.phase)
        const alpha = 0.1 + pulse + depth * 0.08
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.04, alpha)})`
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Desenhar pontos com parallax, projeção 4D e twinkle
      points.forEach((p) => {
        const proj = getProjectedPos(p)
        const offsetX = parallaxX * p.z * w * 0.5 + proj.wx * w
        const offsetY = parallaxY * p.z * h * 0.5 + proj.wy * h
        const px = p.x * w + offsetX
        const py = p.y * h + offsetY
        const twinkle = 0.5 + 0.4 * Math.sin(time * p.speed + p.phase)
        const size = 1 + p.z * 0.8
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.35, twinkle)})`
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Logo AK centralizado (sem fundo) com parallax sutil
      const logoCanvas = logoNoBgRef.current
      if (logoCanvas) {
        const logoSize = Math.min(w, h) * LOGO_SIZE_RATIO
        const logoW = logoSize
        const logoH = (logoCanvas.height / logoCanvas.width) * logoW
        const baseX = (w - logoW) / 2
        const baseY = (h - logoH) / 2
        const logoOffsetX = m.x * 12
        const logoOffsetY = m.y * 12
        ctx.globalAlpha = 0.95
        ctx.drawImage(logoCanvas, baseX + logoOffsetX, baseY + logoOffsetY, logoW, logoH)
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    initPoints()
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [initPoints])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full bg-black"
      style={{ display: "block" }}
      aria-hidden
    />
  )
}
