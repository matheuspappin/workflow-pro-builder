"use client"

import { useRef, useEffect, useCallback } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  type: "fire" | "water" | "steam" | "spark" | "splash"
  hue: number
  saturation: number
  brightness: number
  turbulence: number
  alpha: number
  seed: number
}

const FIRE_COUNT = 900
const WATER_COUNT = 600
const STEAM_COUNT = 150
const SPARK_COUNT = 80
const SPLASH_COUNT = 60
const MOUSE_RADIUS = 180
const MOUSE_STRENGTH = 0.8
const LOGO_RADIUS = 140
const LOGO_REPEL = 0.4

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function noise1D(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function FireWaterCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false })
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const centerX = width * 0.5
    const leftThird = width * 0.33
    const rightThird = width * 0.66

    // Fire particles - chamas intensas do lado direito
    for (let i = 0; i < FIRE_COUNT; i++) {
      particles.push({
        x: randomRange(rightThird - 60, width + 80),
        y: randomRange(height * 0.3, height + 80),
        vx: randomRange(-2.5, -0.3),
        vy: randomRange(-5, -2),
        life: randomRange(0, 100),
        maxLife: randomRange(70, 140),
        size: randomRange(2, 5.5),
        type: "fire",
        hue: randomRange(15, 55),
        saturation: 85 + Math.random() * 15,
        brightness: 65 + Math.random() * 35,
        turbulence: randomRange(0.5, 1.5),
        alpha: randomRange(0.5, 1),
        seed: i * 1.618,
      })
    }

    // Sparks - faíscas brilhantes do fogo
    for (let i = 0; i < SPARK_COUNT; i++) {
      particles.push({
        x: randomRange(rightThird, width + 50),
        y: randomRange(height * 0.4, height + 30),
        vx: randomRange(-1.5, 1.5),
        vy: randomRange(-8, -4),
        life: randomRange(0, 60),
        maxLife: randomRange(40, 80),
        size: randomRange(0.4, 1.5),
        type: "spark",
        hue: randomRange(35, 55),
        saturation: 60 + Math.random() * 40,
        brightness: 95 + Math.random() * 5,
        turbulence: randomRange(0.8, 2),
        alpha: randomRange(0.8, 1),
        seed: i * 2.718,
      })
    }

    // Water particles - gotas e respingos do lado esquerdo
    for (let i = 0; i < WATER_COUNT; i++) {
      particles.push({
        x: randomRange(-80, leftThird + 100),
        y: randomRange(0, height + 80),
        vx: randomRange(0.8, 3.5),
        vy: randomRange(-2, 2.5),
        life: randomRange(0, 100),
        maxLife: randomRange(90, 200),
        size: randomRange(1.2, 4.5),
        type: "water",
        hue: randomRange(185, 215),
        saturation: 70 + Math.random() * 30,
        brightness: 70 + Math.random() * 30,
        turbulence: randomRange(0.3, 1.2),
        alpha: randomRange(0.4, 0.98),
        seed: i * 1.414,
      })
    }

    // Splash particles - gotas maiores de impacto
    for (let i = 0; i < SPLASH_COUNT; i++) {
      particles.push({
        x: randomRange(leftThird - 50, centerX - 30),
        y: randomRange(height * 0.2, height * 0.9),
        vx: randomRange(1, 4),
        vy: randomRange(-3, 3),
        life: randomRange(0, 80),
        maxLife: randomRange(60, 150),
        size: randomRange(2.5, 6),
        type: "splash",
        hue: randomRange(195, 210),
        saturation: 50 + Math.random() * 50,
        brightness: 80 + Math.random() * 20,
        turbulence: randomRange(0.4, 1.3),
        alpha: randomRange(0.5, 0.9),
        seed: i * 3.141,
      })
    }

    // Steam particles - vapor na zona de colisão
    for (let i = 0; i < STEAM_COUNT; i++) {
      particles.push({
        x: randomRange(centerX - 150, centerX + 150),
        y: randomRange(height * 0.15, height * 0.85),
        vx: randomRange(-1.2, 1.2),
        vy: randomRange(-3, -0.3),
        life: randomRange(0, 90),
        maxLife: randomRange(70, 140),
        size: randomRange(2.5, 6.5),
        type: "steam",
        hue: 195 + Math.random() * 20,
        saturation: 8 + Math.random() * 20,
        brightness: 88 + Math.random() * 12,
        turbulence: randomRange(0.6, 1.8),
        alpha: randomRange(0.12, 0.45),
        seed: i * 0.9 + 777,
      })
    }

    return particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      particlesRef.current = initParticles(width, height)
    }

    resize()
    window.addEventListener("resize", resize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / width,
        y: e.clientY / height,
        active: true,
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX / width,
          y: e.touches[0].clientY / height,
          active: true,
        }
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("mouseleave", handleMouseLeave)

    const mx = () => mouseRef.current.x * width
    const my = () => mouseRef.current.y * height

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      const particles = particlesRef.current
      const mouseX = mx()
      const mouseY = my()
      const mouseActive = mouseRef.current.active

      // Clear with dark background
      ctx.fillStyle = "rgba(0,0,0,0.08)"
      ctx.fillRect(0, 0, width, height)

      // Overlay de profundidade (mais suave para destacar fogo/água)
      const bgGradient = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 0,
        width * 0.5, height * 0.5, width * 0.9
      )
      bgGradient.addColorStop(0, "rgba(0,0,0,0.08)")
      bgGradient.addColorStop(0.5, "rgba(0,0,0,0.2)")
      bgGradient.addColorStop(1, "rgba(0,0,0,0.45)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Massa de água - volume à esquerda (ondas, fluido)
      const waterPulse = 0.7 + 0.3 * Math.sin(t * 0.8)
      const waterMass = ctx.createRadialGradient(
        width * 0.15, height * 0.55, 0,
        width * 0.15, height * 0.55, width * 0.6
      )
      waterMass.addColorStop(0, `rgba(60,160,255,${0.25 * waterPulse})`)
      waterMass.addColorStop(0.35, `rgba(40,120,220,${0.15 * waterPulse})`)
      waterMass.addColorStop(0.6, `rgba(20,80,180,${0.06 * waterPulse})`)
      waterMass.addColorStop(1, "transparent")
      ctx.fillStyle = waterMass
      ctx.fillRect(0, 0, width * 0.55, height)

      // Massa de fogo - volume à direita (chamas, calor)
      const firePulse = 0.65 + 0.35 * Math.sin(t * 1.2)
      const fireMass = ctx.createRadialGradient(
        width * 0.85, height * 0.5, 0,
        width * 0.85, height * 0.5, width * 0.55
      )
      fireMass.addColorStop(0, `rgba(255,180,80,${0.3 * firePulse})`)
      fireMass.addColorStop(0.25, `rgba(255,100,50,${0.2 * firePulse})`)
      fireMass.addColorStop(0.5, `rgba(200,60,30,${0.1 * firePulse})`)
      fireMass.addColorStop(0.75, `rgba(150,40,20,${0.04 * firePulse})`)
      fireMass.addColorStop(1, "transparent")
      ctx.fillStyle = fireMass
      ctx.fillRect(width * 0.4, 0, width * 0.65, height)

      // Zona de colisão - vapor e encontro
      const pulse = 0.6 + 0.4 * Math.sin(t * 1.5)
      const centerGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 0,
        width * 0.5, height * 0.5, width * 0.4
      )
      centerGlow.addColorStop(0, `rgba(255,200,150,${0.15 * pulse})`)
      centerGlow.addColorStop(0.3, `rgba(255,120,80,${0.12 * pulse})`)
      centerGlow.addColorStop(0.5, `rgba(120,180,255,${0.1 * pulse})`)
      centerGlow.addColorStop(0.8, "rgba(0,0,0,0.03)")
      centerGlow.addColorStop(1, "transparent")
      ctx.fillStyle = centerGlow
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life++

        // Reset particle when it dies or goes off screen
        if (p.life > p.maxLife || p.x < -120 || p.x > width + 120 || p.y < -120 || p.y > height + 120) {
          if (p.type === "fire") {
            p.x = randomRange(width * 0.55, width + 100)
            p.y = randomRange(height * 0.4, height + 80)
            p.vx = randomRange(-2.5, -0.3)
            p.vy = randomRange(-5, -2)
          } else if (p.type === "spark") {
            p.x = randomRange(width * 0.65, width + 60)
            p.y = randomRange(height * 0.5, height + 40)
            p.vx = randomRange(-1.5, 1.5)
            p.vy = randomRange(-8, -4)
          } else if (p.type === "water") {
            p.x = randomRange(-100, width * 0.38)
            p.y = randomRange(0, height + 80)
            p.vx = randomRange(0.8, 3.5)
            p.vy = randomRange(-2, 2.5)
          } else if (p.type === "splash") {
            p.x = randomRange(width * 0.2, width * 0.45)
            p.y = randomRange(height * 0.2, height * 0.9)
            p.vx = randomRange(1, 4)
            p.vy = randomRange(-3, 3)
          } else {
            p.x = randomRange(width * 0.42, width * 0.58)
            p.y = randomRange(height * 0.25, height * 0.75)
            p.vx = randomRange(-1.2, 1.2)
            p.vy = randomRange(-3, -0.3)
          }
          p.life = 0
        }

        // Logo repulsion - partículas fluem ao redor do centro (logo)
        const centerX = width * 0.5
        const centerY = height * 0.5
        const dxLogo = p.x - centerX
        const dyLogo = p.y - centerY
        const distLogo = Math.sqrt(dxLogo * dxLogo + dyLogo * dyLogo)
        if (distLogo < LOGO_RADIUS && distLogo > 10) {
          const force = (1 - distLogo / LOGO_RADIUS) * LOGO_REPEL
          const angle = Math.atan2(dyLogo, dxLogo)
          p.vx += Math.cos(angle) * force * 3
          p.vy += Math.sin(angle) * force * 3
        }

        // Mouse interaction - particles are pushed away from cursor
        if (mouseActive) {
          const dx = p.x - mouseX
          const dy = p.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 5) {
            const force = (1 - dist / MOUSE_RADIUS) * MOUSE_STRENGTH
            const angle = Math.atan2(dy, dx)
            p.vx += Math.cos(angle) * force * 2
            p.vy += Math.sin(angle) * force * 2
          }
        }

        // Turbulence - fire flickers more, water flows
        const turbMult = p.type === "fire" || p.type === "spark" ? 0.25 : p.type === "splash" ? 0.2 : 0.12
        const n1 = noise1D(t * 3 + p.seed)
        const n2 = noise1D(t * 3.5 + p.seed + 100)
        p.vx += (n1 - 0.5) * p.turbulence * turbMult
        p.vy += (n2 - 0.5) * p.turbulence * turbMult

        // Damping
        p.vx *= 0.98
        p.vy *= 0.98

        p.x += p.vx
        p.y += p.vy

        // Life-based alpha
        const lifeRatio = p.life / p.maxLife
        let alpha = p.alpha
        if (lifeRatio < 0.15) {
          alpha *= lifeRatio / 0.15
        } else if (lifeRatio > 0.85) {
          alpha *= (1 - lifeRatio) / 0.15
        }

        // Flicker/pulse for fire, subtle for water
        const flicker = p.type === "fire" || p.type === "spark" ? (0.85 + 0.3 * Math.sin(t * 8 + p.seed)) : 1
        const size = p.size * flicker

        if (p.type === "fire") {
          // Chama intensa: núcleo quente (amarelo/branco) → bordas (laranja/vermelho)
          const innerHue = Math.max(25, p.hue - 20)
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, size * 5
          )
          gradient.addColorStop(0, `hsla(${innerHue}, 90%, 98%, ${alpha * 0.95})`)
          gradient.addColorStop(0.2, `hsla(${p.hue}, ${p.saturation}%, ${p.brightness + 15}%, ${alpha})`)
          gradient.addColorStop(0.45, `hsla(${p.hue + 8}, ${p.saturation * 0.9}%, ${p.brightness * 0.9}%, ${alpha * 0.5})`)
          gradient.addColorStop(0.7, `hsla(${p.hue + 18}, ${p.saturation * 0.6}%, ${p.brightness * 0.6}%, ${alpha * 0.12})`)
          gradient.addColorStop(1, "transparent")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = `hsla(${innerHue}, 85%, 95%, ${alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 0.6, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.type === "spark") {
          // Faísca: ponto brilhante pequeno
          const sparkGradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, size * 6
          )
          sparkGradient.addColorStop(0, `hsla(45, 80%, 100%, ${alpha})`)
          sparkGradient.addColorStop(0.2, `hsla(${p.hue}, 70%, 95%, ${alpha * 0.9})`)
          sparkGradient.addColorStop(0.5, `hsla(${p.hue + 15}, 60%, 80%, ${alpha * 0.3})`)
          sparkGradient.addColorStop(1, "transparent")
          ctx.fillStyle = sparkGradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `hsla(50, 100%, 100%, ${alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.type === "water" || p.type === "splash") {
          // Água: reflexo de luz (highlight) + gota translúcida
          const highlightOffset = p.type === "splash" ? size * 0.35 : size * 0.25
          const gradient = ctx.createRadialGradient(
            p.x - highlightOffset, p.y - highlightOffset, 0,
            p.x, p.y, size * 3.5
          )
          gradient.addColorStop(0, `hsla(200, 30%, 100%, ${alpha * 0.9})`)
          gradient.addColorStop(0.15, `hsla(${p.hue}, ${p.saturation * 0.6}%, ${p.brightness + 25}%, ${alpha * 0.6})`)
          gradient.addColorStop(0.4, `hsla(${p.hue}, ${p.saturation}%, ${p.brightness}%, ${alpha})`)
          gradient.addColorStop(0.7, `hsla(${p.hue}, ${p.saturation}%, ${p.brightness * 0.8}%, ${alpha * 0.4})`)
          gradient.addColorStop(1, "transparent")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.brightness + 10}%, ${alpha * 0.85})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Steam - diffuse, soft
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, size * 6
          )
          gradient.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.brightness}%, ${alpha * 0.5})`)
          gradient.addColorStop(0.4, `hsla(${p.hue}, ${p.saturation}%, ${p.brightness}%, ${alpha * 0.2})`)
          gradient.addColorStop(1, "transparent")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current)
      } else {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}
    />
  )
}
