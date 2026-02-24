'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { ArrowRight, FireExtinguisher, ClipboardCheck, Shield } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Building geometry – isometric cutaway with interior
// ─────────────────────────────────────────────────────────────
const OX = 220
const OY = 400
const HW = 125
const HD = 48
const FH = 85

function pth(pts: [number, number][]) {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('') + 'Z'
}

function makeFloor(f: number) {
  const by = OY - f * FH
  return {
    top: pth([
      [OX,      by - FH - HD],
      [OX + HW, by - FH],
      [OX,      by - FH + HD],
      [OX - HW, by - FH],
    ]),
    right: pth([
      [OX,      by - FH + HD],
      [OX + HW, by - FH],
      [OX + HW, by],
      [OX,      by + HD],
    ]),
    left: pth([
      [OX - HW, by - FH],
      [OX,      by - FH + HD],
      [OX,      by + HD],
      [OX - HW, by],
    ]),
    cut: pth([
      [OX - HW * 0.5, by - FH + HD * 0.3],
      [OX + HW * 0.5, by - FH - HD * 0.3],
      [OX + HW * 0.5, by - HD * 0.3],
      [OX - HW * 0.5, by + HD * 0.7],
    ]),
    cx: OX,
    cy: OY - (f + 1) * FH,
    by,
  }
}

const FLOORS = [0, 1, 2, 3].map(makeFloor)

// Gradients
const DEFS = (
  <defs>
    <linearGradient id="floor0-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="50%" stopColor="#1e293b" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>
    <linearGradient id="floor0-right" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1e293b" />
      <stop offset="100%" stopColor="#020617" />
    </linearGradient>
    <linearGradient id="floor0-left" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>

    <linearGradient id="floor1-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="50%" stopColor="#334155" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>
    <linearGradient id="floor1-right" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>
    <linearGradient id="floor1-left" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#64748b" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>

    <linearGradient id="floor2-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="50%" stopColor="#334155" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>
    <linearGradient id="floor2-right" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>
    <linearGradient id="floor2-left" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#64748b" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>

    <linearGradient id="floor3-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="50%" stopColor="#1e293b" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>
    <linearGradient id="floor3-right" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1e293b" />
      <stop offset="100%" stopColor="#020617" />
    </linearGradient>
    <linearGradient id="floor3-left" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>

    <linearGradient id="active-red-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f87171" />
      <stop offset="50%" stopColor="#dc2626" />
      <stop offset="100%" stopColor="#991b1b" />
    </linearGradient>
    <linearGradient id="active-red-side" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#dc2626" />
      <stop offset="100%" stopColor="#7f1d1d" />
    </linearGradient>

    <linearGradient id="active-orange-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fb923c" />
      <stop offset="50%" stopColor="#ea580c" />
      <stop offset="100%" stopColor="#9a3412" />
    </linearGradient>
    <linearGradient id="active-orange-side" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ea580c" />
      <stop offset="100%" stopColor="#7c2d12" />
    </linearGradient>

    <linearGradient id="active-teal-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#2dd4bf" />
      <stop offset="50%" stopColor="#0d9488" />
      <stop offset="100%" stopColor="#0f766e" />
    </linearGradient>
    <linearGradient id="active-teal-side" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#0d9488" />
      <stop offset="100%" stopColor="#134e4a" />
    </linearGradient>

    <linearGradient id="cut-inner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1e293b" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>

    <radialGradient id="ground-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
      <stop offset="70%" stopColor="rgba(0,0,0,0.12)" />
      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
    </radialGradient>

    <filter id="fb-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
      <stop offset="50%" stopColor="#0f172a" stopOpacity="0.2" />
      <stop offset="100%" stopColor="transparent" />
    </linearGradient>
    <linearGradient id="tree-crown" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#166534" />
      <stop offset="50%" stopColor="#15803d" />
      <stop offset="100%" stopColor="#14532d" />
    </linearGradient>
    <radialGradient id="tree-highlight" cx="30%" cy="30%" r="50%">
      <stop offset="0%" stopColor="#22c55e" />
      <stop offset="100%" stopColor="#15803d" />
    </radialGradient>
  </defs>
)

function ExtinguisherSvg({ x, y, scale = 1, active = false }: { x: number; y: number; scale?: number; active?: boolean }) {
  const s = scale
  const body = '#dc2626'
  const nozzle = '#1f2937'
  const highlight = active ? '#fca5a5' : '#ef4444'
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={-8} rx={5} ry={3} fill={body} opacity={0.9} />
      <rect x={-4} y={-5} width={8} height={14} rx={1} fill={body} />
      <rect x={-1} y={9} width={2} height={4} fill={nozzle} />
      <ellipse cx={0} cy={-6} rx={2} ry={1} fill={highlight} opacity={0.6} />
    </g>
  )
}

function HoseCabinetSvg({ x, y, scale = 1, active = false }: { x: number; y: number; scale?: number; active?: boolean }) {
  const s = scale
  const door = active ? '#ea580c' : '#9a3412'
  const frame = '#1f2937'
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-8} y={-12} width={16} height={20} rx={1} fill={frame} />
      <rect x={-6} y={-10} width={12} height={16} rx={0.5} fill={door} />
      <path d="M 0 -6 Q 4 -2 0 2 Q -4 6 0 10" stroke="#1f2937" strokeWidth={1.5} fill="none" opacity={0.8} />
      <circle cx={4} cy={-4} r={1} fill="#fbbf24" opacity={active ? 1 : 0.5} />
    </g>
  )
}

function AlarmPanelSvg({ x, y, scale = 1, active = false }: { x: number; y: number; scale?: number; active?: boolean }) {
  const s = scale
  const bg = active ? '#0d9488' : '#134e4a'
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-10} y={-14} width={20} height={22} rx={2} fill={bg} stroke="#0f766e" strokeWidth={0.5} />
      <rect x={-6} y={-8} width={12} height={6} rx={0.5} fill="#0f172a" />
      <circle cx={-2} cy={-2} r={1} fill={active ? '#2dd4bf' : '#14b8a6'} className={active ? 'animate-pulse' : ''} />
      <rect x={2} y={-3} width={4} height={2} rx={0.3} fill="#fbbf24" opacity={active ? 1 : 0.6} />
    </g>
  )
}

function IsoCube({ x, y, w, d, h, color, highlight }: { x: number; y: number; w: number; d: number; h: number; color: string; highlight?: string }) {
  const top = pth([[x, y - d], [x + w, y], [x, y + d], [x - w, y]])
  const right = pth([[x, y + d], [x + w, y], [x + w, y + h], [x, y + d + h]])
  const left = pth([[x - w, y], [x, y + d], [x, y + d + h], [x - w, y + h]])
  return (
    <g>
      <path d={left} fill={color} opacity={0.7} />
      <path d={right} fill={color} opacity={0.85} />
      <path d={top} fill={highlight || color} />
    </g>
  )
}

function IsoTree({ x, y, scale = 1, variant = 0 }: { x: number; y: number; scale?: number; variant?: number }) {
  const s = scale
  const trunkH = 28 * s
  const crownW = 35 * s
  const crownH = 22 * s
  const colors = ['#166534', '#15803d', '#14532d', '#1a5f3a'] as const
  const trunkColor = variant % 2 === 0 ? '#78350f' : '#92400e'
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={pth([[0, 0], [8 * s, 3 * s], [8 * s, trunkH + 3 * s], [0, trunkH]])} fill={trunkColor} opacity={0.9} />
      <path d={pth([[0, 0], [-6 * s, 2 * s], [-6 * s, trunkH + 2 * s], [0, trunkH]])} fill={trunkColor} opacity={0.75} />
      <ellipse cx={0} cy={-trunkH * 0.3} rx={crownW} ry={crownH * 0.6} fill="url(#tree-crown)" opacity={0.95} />
      <ellipse cx={12 * s} cy={-trunkH * 0.5} rx={crownW * 0.7} ry={crownH * 0.5} fill={colors[variant % colors.length]} opacity={0.9} />
      <ellipse cx={-8 * s} cy={-trunkH * 0.4} rx={crownW * 0.6} ry={crownH * 0.55} fill={colors[(variant + 1) % colors.length]} opacity={0.85} />
      <ellipse cx={0} cy={-trunkH * 0.9} rx={crownW * 0.5} ry={crownH * 0.5} fill="url(#tree-highlight)" opacity={0.8} />
    </g>
  )
}

function IsoCar({ x, y, color = '#334155', facing = 'left' }: { x: number; y: number; color?: string; facing?: 'left' | 'right' }) {
  const flip = facing === 'right' ? -1 : 1
  const bodyW = 28
  const bodyD = 12
  const bodyH = 10
  return (
    <g transform={`translate(${x},${y}) scale(${flip},1)`}>
      <path d={pth([[0, bodyD], [bodyW, 0], [bodyW, bodyH], [0, bodyD + bodyH]])} fill={color} opacity={0.9} />
      <path d={pth([[0, 0], [bodyW, -bodyD], [bodyW, bodyH - bodyD], [0, bodyH]])} fill={color} opacity={0.75} />
      <path d={pth([[0, 0], [bodyW, -bodyD], [bodyW, 0], [0, bodyD]])} fill={color} opacity={0.85} />
      <path d={pth([[bodyW * 0.6, -bodyD * 0.5], [bodyW - 2, -bodyD * 0.8], [bodyW - 2, bodyH - bodyD * 0.8], [bodyW * 0.6, bodyH - bodyD * 0.5]])} fill="#0c4a6e" opacity={0.6} />
      <ellipse cx={bodyW * 0.25} cy={bodyD + bodyH} rx={4} ry={2} fill="#1e293b" />
      <ellipse cx={bodyW * 0.75} cy={bodyH} rx={4} ry={2} fill="#1e293b" />
      <ellipse cx={bodyW - 2} cy={-bodyD * 0.3} rx={2} ry={1} fill="#fef3c7" opacity={0.9} />
    </g>
  )
}

function StreetLamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-2} y={0} width={4} height={55} fill="#475569" rx={1} />
      <path d="M -8 -2 L 8 -2 L 6 2 L -6 2 Z" fill="#64748b" />
      <ellipse cx={0} cy={-8} rx={6} ry={4} fill="#fef3c7" opacity={0.9} />
      <ellipse cx={0} cy={-8} rx={4} ry={2} fill="#fde68a" opacity={0.6} />
    </g>
  )
}

const SCENES = [
  {
    badge: 'Ativos Monitorados',
    title: 'Extintores & Cargas',
    description: 'Cadastre cada extintor com QR Code único. Controle validade das cargas, recargas e manutenções preventivas com alertas automáticos antes do vencimento.',
    activeFloor: 1,
    colorKey: 'red',
    Icon: FireExtinguisher,
    range: [0.08, 0.37] as [number, number],
  },
  {
    badge: 'Equipe de Campo',
    title: 'Vistorias & Laudos Digitais',
    description: 'Técnicos com roteiro otimizado direto no celular. Laudos com fotos, assinatura eletrônica e geolocalização enviados ao cliente em tempo real.',
    activeFloor: 2,
    colorKey: 'orange',
    Icon: ClipboardCheck,
    range: [0.37, 0.66] as [number, number],
  },
  {
    badge: 'PPCI & Bombeiros',
    title: 'Certificação & Projetos',
    description: 'Gerencie plantas de incêndio, memorial descritivo e acompanhe cada etapa das aprovações no Corpo de Bombeiros em tempo real.',
    activeFloor: 3,
    colorKey: 'teal',
    Icon: Shield,
    range: [0.66, 0.93] as [number, number],
  },
]

const PALETTE = {
  red: {
    badge: 'bg-red-950/70 text-red-300 border border-red-800/60',
    title: 'text-red-400',
    btn: 'bg-red-600 hover:bg-red-700 shadow-red-600/40',
    dot: 'bg-red-500',
    progress: 'bg-red-500',
    glow: 'rgba(220,38,38,0.18)',
    particle: 'bg-red-400/40',
  },
  orange: {
    badge: 'bg-orange-950/70 text-orange-300 border border-orange-800/60',
    title: 'text-orange-400',
    btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/40',
    dot: 'bg-orange-500',
    progress: 'bg-orange-500',
    glow: 'rgba(234,88,12,0.18)',
    particle: 'bg-orange-400/40',
  },
  teal: {
    badge: 'bg-teal-950/70 text-teal-300 border border-teal-800/60',
    title: 'text-teal-400',
    btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/40',
    dot: 'bg-teal-500',
    progress: 'bg-teal-500',
    glow: 'rgba(13,148,136,0.18)',
    particle: 'bg-teal-400/40',
  },
} as const

export function FireBuildingScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeScene, setActiveScene] = useState(-1)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    let next = -1
    SCENES.forEach((s, i) => {
      if (v >= s.range[0] && v < s.range[1]) next = i
    })
    setActiveScene(next)
  })

  const f0y = useTransform(scrollYProgress, [0.00, 0.06, 0.93, 1.0], [70, 0, 0, 55])
  const f1y = useTransform(scrollYProgress, [0.00, 0.06, 0.93, 1.0], [145, 0, 0, -112])
  const f2y = useTransform(scrollYProgress, [0.00, 0.07, 0.93, 1.0], [215, 0, 0, -190])
  const f3y = useTransform(scrollYProgress, [0.00, 0.08, 0.93, 1.0], [285, 0, 0, -262])

  const f0op = useTransform(scrollYProgress, [0.00, 0.05, 0.94, 1.0], [0, 1, 1, 0])
  const f1op = useTransform(scrollYProgress, [0.01, 0.06, 0.94, 1.0], [0, 1, 1, 0])
  const f2op = useTransform(scrollYProgress, [0.02, 0.07, 0.94, 1.0], [0, 1, 1, 0])
  const f3op = useTransform(scrollYProgress, [0.03, 0.08, 0.94, 1.0], [0, 1, 1, 0])

  const floorY = [f0y, f1y, f2y, f3y]
  const floorOp = [f0op, f1op, f2op, f3op]

  const currentPalette = activeScene >= 0 ? PALETTE[SCENES[activeScene].colorKey as keyof typeof PALETTE] : null

  const getFloorStyle = (f: number) => {
    const active = activeScene >= 0 && SCENES[activeScene].activeFloor === f
    if (f === 1 && active) return { top: 'url(#active-red-top)', right: 'url(#active-red-side)', left: 'url(#active-red-side)' }
    if (f === 2 && active) return { top: 'url(#active-orange-top)', right: 'url(#active-orange-side)', left: 'url(#active-orange-side)' }
    if (f === 3 && active) return { top: 'url(#active-teal-top)', right: 'url(#active-teal-side)', left: 'url(#active-teal-side)' }
    return { top: `url(#floor${f}-top)`, right: `url(#floor${f}-right)`, left: `url(#floor${f}-left)` }
  }

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative bg-slate-950 overflow-hidden isolate"
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center" style={{ willChange: 'transform' }}>
        <div
          className="absolute inset-0 top-16 pointer-events-none transition-all duration-1000 z-0"
          style={{
            background: currentPalette
              ? `radial-gradient(ellipse 80% 60% at 35% 50%, ${currentPalette.glow} 0%, transparent 65%)`
              : 'radial-gradient(ellipse 70% 55% at 35% 50%, rgba(220,38,38,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="w-full relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center max-w-7xl mx-auto">

              <div className="flex justify-center items-center order-2 lg:order-1 relative">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className={cn('absolute w-1 h-1 rounded-full', currentPalette ? currentPalette.particle : 'bg-slate-500/30')}
                    style={{ left: `${15 + i * 18}%`, top: `${25 + (i % 3) * 20}%` }}
                    animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}

                <svg viewBox="0 0 480 560" className="w-full max-w-[340px] md:max-w-[420px] lg:max-w-[480px] drop-shadow-2xl" style={{ overflow: 'visible', filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))' }}>
                  {DEFS}

                  <rect x="0" y="0" width="480" height="200" fill="url(#sky-grad)" />
                  <g opacity={0.12}>
                    <rect x="0" y="180" width="80" height="120" fill="#0f172a" />
                    <rect x="85" y="160" width="60" height="140" fill="#0f172a" />
                    <rect x="150" y="175" width="90" height="125" fill="#0f172a" />
                    <rect x="245" y="150" width="70" height="150" fill="#0f172a" />
                    <rect x="320" y="165" width="55" height="135" fill="#0f172a" />
                    <rect x="380" y="185" width="65" height="115" fill="#0f172a" />
                    <rect x="448" y="170" width="35" height="130" fill="#0f172a" />
                  </g>

                  <g stroke="#64748b" strokeWidth="1.5" strokeDasharray="12 8" opacity={0.6}>
                    <line x1={120} y1={515} x2={360} y2={515} />
                  </g>

                  <ellipse cx={65} cy={398} rx={18} ry={6} fill="rgba(0,0,0,0.25)" />
                  <IsoTree x={65} y={390} scale={0.9} variant={0} />
                  <ellipse cx={400} cy={383} rx={20} ry={7} fill="rgba(0,0,0,0.25)" />
                  <IsoTree x={400} y={375} scale={1} variant={1} />
                  <ellipse cx={420} cy={418} rx={16} ry={5} fill="rgba(0,0,0,0.2)" />
                  <IsoTree x={420} y={410} scale={0.8} variant={2} />

                  <StreetLamp x={75} y={460} />
                  <StreetLamp x={405} y={445} />

                  <ellipse cx={OX} cy={OY + HD + 12} rx={HW + 25} ry={HD * 0.7} fill="url(#ground-shadow)" />
                  <ellipse cx={OX} cy={OY + HD + 8} rx={HW + 12} ry={HD * 0.5} fill="rgba(0,0,0,0.35)" />

                  <ellipse cx={150} cy={492} rx={14} ry={5} fill="rgba(0,0,0,0.3)" />
                  <IsoTree x={150} y={485} scale={0.7} variant={0} />
                  <ellipse cx={330} cy={485} rx={15} ry={5} fill="rgba(0,0,0,0.3)" />
                  <IsoTree x={330} y={478} scale={0.75} variant={1} />

                  {([0, 1, 2, 3] as const).map((f) => {
                    const geo = FLOORS[f]
                    const style = getFloorStyle(f)
                    const isActive = activeScene >= 0 && SCENES[activeScene].activeFloor === f

                    return (
                      <motion.g key={f} style={{ y: floorY[f], opacity: floorOp[f] }}>
                        <path d={geo.left} fill={style.left} style={{ transition: 'fill 0.6s ease' }} />
                        {f >= 1 && (
                          <rect x={OX - HW + 20} y={geo.by - FH - 20} width={16} height={22} rx={0.5} fill={isActive ? '#fef3c7' : '#0f172a'} opacity={isActive ? 0.9 : 0.5} stroke={isActive ? '#fde68a' : '#334155'} strokeWidth={0.3} style={{ transition: 'all 0.6s ease' }} />
                        )}
                        <path d={geo.right} fill={style.right} style={{ transition: 'fill 0.6s ease' }} />
                        {f >= 1 && (
                          <rect x={OX + HW - 28} y={geo.by - FH - 18} width={14} height={18} rx={0.5} fill={isActive ? '#fef3c7' : '#020617'} opacity={isActive ? 0.85 : 0.6} stroke={isActive ? '#fde68a' : '#1e293b'} strokeWidth={0.3} style={{ transition: 'all 0.6s ease' }} />
                        )}
                        <path d={geo.cut} fill="url(#cut-inner)" opacity={0.92} style={{ transition: 'opacity 0.6s ease' }} />
                        <path d={geo.top} fill={style.top} filter={isActive ? 'url(#fb-glow)' : undefined} style={{ transition: 'fill 0.6s ease' }} />

                        {f === 0 && (
                          <g style={{ opacity: 1 }}>
                            <IsoCube x={OX - 25} y={geo.cy - 5} w={18} d={7} h={12} color="#334155" highlight="#475569" />
                            <rect x={OX - 30} y={geo.cy - 8} width={8} height={4} rx={0.3} fill="#0f172a" opacity={0.6} />
                            <ExtinguisherSvg x={OX + 35} y={geo.cy + 15} scale={1.1} />
                            <rect x={OX - 45} y={geo.cy - 20} width={16} height={8} rx={0.5} fill="#1e293b" opacity={0.8} />
                            <text x={OX - 42} y={geo.cy - 14} fontSize="5" fill="#94a3b8" fontWeight="700">SAÍDA</text>
                            <circle cx={OX + 20} cy={geo.cy - 10} r={6} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.7} />
                            <rect x={OX + 16} y={geo.cy - 14} width={3} height={3} fill="#334155" opacity={0.5} />
                            <rect x={OX + 21} y={geo.cy - 14} width={3} height={3} fill="#334155" opacity={0.5} />
                            <rect x={OX + 16} y={geo.cy - 9} width={3} height={3} fill="#334155" opacity={0.5} />
                            <rect x={OX + 21} y={geo.cy - 9} width={3} height={3} fill="#334155" opacity={0.5} />
                          </g>
                        )}

                        {f === 1 && (
                          <g style={{ opacity: isActive ? 1 : 0.15, transition: 'opacity 0.6s ease' }}>
                            <ExtinguisherSvg x={OX - 38} y={geo.cy - 8} scale={1.2} active={isActive} />
                            <ExtinguisherSvg x={OX - 15} y={geo.cy - 2} scale={1.1} active={isActive} />
                            <ExtinguisherSvg x={OX + 10} y={geo.cy + 4} scale={1.1} active={isActive} />
                            <ExtinguisherSvg x={OX + 35} y={geo.cy + 10} scale={1.2} active={isActive} />
                            <IsoCube x={OX - 50} y={geo.cy - 15} w={14} d={5} h={18} color="#991b1b" highlight="#dc2626" />
                            <rect x={OX - 30} y={geo.cy - 25} width={60} height={3} fill="#1e293b" opacity={0.6} />
                            <circle cx={OX - 45} cy={geo.cy - 12} r={4} fill="#1e293b" stroke="#334155" strokeWidth={0.5} />
                          </g>
                        )}

                        {f === 2 && (
                          <g style={{ opacity: isActive ? 1 : 0.15, transition: 'opacity 0.6s ease' }}>
                            <HoseCabinetSvg x={OX - 45} y={geo.cy - 5} scale={1.1} active={isActive} />
                            <IsoCube x={OX} y={geo.cy + 5} w={20} d={8} h={6} color="#9a3412" highlight="#c2410c" />
                            <IsoCube x={OX + 38} y={geo.cy + 12} w={12} d={5} h={8} color="#1e293b" highlight="#334155" />
                            <rect x={OX + 25} y={geo.cy - 18} width={12} height={16} rx={0.5} fill="#fef3c7" opacity={0.9} />
                            <line x1={OX + 28} y1={geo.cy - 14} x2={OX + 34} y2={geo.cy - 14} stroke="#92400e" strokeWidth={0.5} />
                            <line x1={OX + 28} y1={geo.cy - 10} x2={OX + 34} y2={geo.cy - 10} stroke="#92400e" strokeWidth={0.5} />
                          </g>
                        )}

                        {f === 3 && (
                          <g style={{ opacity: isActive ? 1 : 0.15, transition: 'opacity 0.6s ease' }}>
                            <AlarmPanelSvg x={OX} y={geo.cy - 10} scale={1.2} active={isActive} />
                            <rect x={OX - 42} y={geo.cy - 22} width={28} height={20} rx={0.5} fill="#0f172a" stroke="#0d9488" strokeWidth={0.5} opacity={0.9} />
                            <line x1={OX - 38} y1={geo.cy - 16} x2={OX - 18} y2={geo.cy - 16} stroke="#0d9488" strokeWidth={0.3} opacity={0.7} />
                            <line x1={OX - 38} y1={geo.cy - 12} x2={OX - 25} y2={geo.cy - 12} stroke="#0d9488" strokeWidth={0.3} opacity={0.7} />
                            <rect x={OX + 30} y={geo.cy + 2} width={18} height={24} rx={0.5} fill="#134e4a" stroke="#0f766e" strokeWidth={0.3} />
                            <circle cx={OX + 45} cy={geo.cy - 5} r={3} fill="#fbbf24" opacity={isActive ? 0.9 : 0.4} />
                          </g>
                        )}

                        {f >= 1 && f <= 3 && (
                          <g opacity={isActive ? 0.8 : 0.2} style={{ transition: 'opacity 0.6s ease' }}>
                            <line x1={OX - HW + 15} y1={geo.by - FH} x2={OX + HW - 15} y2={geo.by - FH} stroke="#64748b" strokeWidth={1.5} strokeLinecap="round" />
                            <circle cx={OX - 20} cy={geo.by - FH - 2} r={2} fill="#94a3b8" />
                            <circle cx={OX} cy={geo.by - FH - 2} r={2} fill="#94a3b8" />
                            <circle cx={OX + 20} cy={geo.by - FH - 2} r={2} fill="#94a3b8" />
                          </g>
                        )}

                        {isActive && (
                          <line x1={OX - HW + 10} y1={geo.by - FH - 3} x2={OX + HW - 10} y2={geo.by - FH - 5} stroke={f === 1 ? '#fca5a5' : f === 2 ? '#fdba74' : '#5eead4'} strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                        )}

                        {f > 0 && (
                          <line x1={OX - HW + 5} y1={OY - f * FH} x2={OX + HW - 5} y2={OY - f * FH} stroke={isActive ? (f === 1 ? '#dc2626' : f === 2 ? '#ea580c' : '#0d9488') : '#1e3a5f'} strokeWidth={1} opacity={0.6} style={{ transition: 'stroke 0.6s ease' }} />
                        )}
                      </motion.g>
                    )
                  })}

                  <motion.g style={{ y: floorY[3], opacity: floorOp[3] }}>
                    <path d={pth([[OX - 25, 0], [OX + 25, -8], [OX + 25, 8], [OX - 25, 16]])} fill="#475569" opacity={0.95} />
                    <path d={pth([[OX - 25, 0], [OX + 25, -8], [OX + 25, 8], [OX - 25, 16]])} fill="none" stroke="#64748b" strokeWidth={0.5} opacity={0.6} />
                    <IsoCube x={OX - 30} y={5} w={8} d={3} h={4} color="#94a3b8" highlight="#cbd5e1" />
                    <IsoCube x={OX + 22} y={6} w={6} d={2} h={3} color="#94a3b8" highlight="#cbd5e1" />
                    <line x1={OX + 8} y1={5} x2={OX + 8} y2={0} stroke="#64748b" strokeWidth={1} />
                    <line x1={OX + 4} y1={2} x2={OX + 12} y2={2} stroke="#64748b" strokeWidth={0.8} />
                    <line x1={OX + 4} y1={0} x2={OX + 12} y2={0} stroke="#64748b" strokeWidth={0.8} />
                    <circle cx={OX + 8} cy={0} r={1.5} fill="#fbbf24" opacity={0.9} />
                  </motion.g>

                  {([1, 2, 3] as const).map((f) => {
                    const isActive = activeScene >= 0 && SCENES[activeScene].activeFloor === f
                    const colors = ['#dc2626', '#ea580c', '#0d9488'] as const
                    return (
                      <text key={f} x={OX + HW + 20} y={OY - f * FH + 5} fontSize="9" fontWeight="800" fill={isActive ? colors[f - 1] : '#334155'} letterSpacing="0.12em" style={{ transition: 'fill 0.6s ease' }}>
                        {f === 1 ? 'EXTINTORES' : f === 2 ? 'VISTORIAS' : 'PPCI'}
                      </text>
                    )
                  })}

                  <motion.g initial={{ x: 0, y: 0 }} animate={{ x: [-520, 520], y: [0, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: 'center center' }}>
                    <IsoCar x={260} y={508} color="#dc2626" facing="left" />
                  </motion.g>
                  <motion.g initial={{ x: 0, y: 0 }} animate={{ x: [520, -520], y: [0, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'linear', delay: 3 }} style={{ transformOrigin: 'center center' }}>
                    <IsoCar x={-260} y={502} color="#475569" facing="right" />
                  </motion.g>
                  <motion.g initial={{ x: 0, y: 0 }} animate={{ x: [-520, 520], y: [0, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'linear', delay: 6 }} style={{ transformOrigin: 'center center' }}>
                    <IsoCar x={280} y={518} color="#334155" facing="left" />
                  </motion.g>

                  <g transform="translate(185, 468)">
                    <rect x={-4} y={0} width={8} height={22} fill="#dc2626" rx={1} />
                    <rect x={-6} y={-2} width={12} height={6} fill="#b91c1c" rx={0.5} />
                    <circle cx={-6} cy={8} r={2} fill="#dc2626" />
                    <circle cx={0} cy={8} r={2} fill="#dc2626" />
                    <circle cx={6} cy={8} r={2} fill="#dc2626" />
                    <rect x={-1} y={-6} width={2} height={6} fill="#64748b" />
                    <circle cx={-6} cy={2} r={1.5} fill="#fbbf24" />
                    <circle cx={6} cy={2} r={1.5} fill="#fbbf24" />
                  </g>
                </svg>
              </div>

              <div className="order-1 lg:order-2 relative" style={{ minHeight: '320px' }}>
                <motion.div className="absolute inset-0 flex flex-col justify-center" animate={{ opacity: activeScene < 0 ? 1 : 0, y: activeScene < 0 ? 0 : -20 }} transition={{ duration: 0.5 }} style={{ pointerEvents: activeScene < 0 ? 'auto' : 'none' }}>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 font-black mb-5">Como funciona</p>
                  <h2 className="text-4xl lg:text-5xl xl:text-[3.2rem] font-black text-white leading-[1.05] mb-6">
                    Proteção Contra<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Incêndio Digital</span>
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-md">Role para explorar o interior do prédio e veja como o FireControl organiza cada andar do seu negócio.</p>
                </motion.div>

                {SCENES.map((scene, i) => {
                  const c = PALETTE[scene.colorKey as keyof typeof PALETTE]
                  const Icon = scene.Icon
                  return (
                    <motion.div
                      key={i}
                      className="absolute inset-0 flex flex-col justify-center"
                      animate={{ opacity: activeScene === i ? 1 : 0, y: activeScene === i ? 0 : activeScene > i ? -24 : 24 }}
                      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ pointerEvents: activeScene === i ? 'auto' : 'none' }}
                    >
                      <span className={cn('inline-flex items-center gap-2 self-start px-4 py-2 rounded-full', 'text-[10px] font-black uppercase tracking-[0.2em] mb-6', c.badge)}>
                        <span className={cn('w-2 h-2 rounded-full shrink-0 shadow-lg', c.dot)} />
                        {scene.badge}
                      </span>
                      <h3 className={cn('text-3xl lg:text-4xl font-black mb-5 leading-tight', c.title)}>{scene.title}</h3>
                      <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-md">{scene.description}</p>
                      <div className="flex items-center gap-4">
                        <Link href="/solutions/fire-protection/register">
                          <button className={cn('inline-flex items-center gap-2 px-8 py-4 rounded-full', 'text-white font-bold shadow-xl transition-all duration-300', 'hover:scale-105 hover:shadow-2xl', c.btn)}>
                            Começar Grátis
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </Link>
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg', c.btn)}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center">
            {SCENES.map((s, i) => {
              const c = PALETTE[s.colorKey as keyof typeof PALETTE]
              return (
                <div key={i} className={cn('w-1.5 rounded-full transition-all duration-500', activeScene === i ? cn('h-10 shadow-lg', c.progress) : 'h-1.5 bg-slate-700')} />
              )
            })}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: activeScene < 0 ? 0.5 : 0, transition: 'opacity 0.5s ease' }}>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.22em] font-bold">Role para explorar</p>
          <div className="w-px h-12 bg-gradient-to-b from-slate-500 to-transparent rounded-full" />
        </div>
      </div>
    </section>
  )
}
