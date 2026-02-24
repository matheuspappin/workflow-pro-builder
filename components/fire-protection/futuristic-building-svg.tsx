'use client'

import { useId } from 'react'

/**
 * Prédio futurista eco – perspectiva ISOMÉTRICA (estilo Saphi)
 * Ângulo: vista de cima-esquerda, 3 faces visíveis (topo, frente, lateral)
 */
export function FuturisticBuildingSvg({
  className,
  viewBox = '0 0 400 420',
  accentColor = 'red',
}: {
  className?: string
  viewBox?: string
  accentColor?: 'red' | 'orange' | 'teal'
}) {
  const uid = useId().replace(/:/g, '')
  const accents = {
    red: { main: '#ef4444' },
    orange: { main: '#f97316' },
    teal: { main: '#14b8a6' },
  }
  const { main } = accents[accentColor]

  // Isométrico 2:1 – ângulo Saphi (≈30°)
  const iso = { x: 0.866, y: 0.5 } // cos30°, sin30°

  // Centro do bloco na base, dimensões
  const cx = 200
  const baseY = 380
  const W = 140   // largura frente
  const D = 60    // profundidade (lado)
  const H = 360   // altura total

  // Vértices do paralelepípedo isométrico (frente = face principal)
  // Frente: base centro-esquerda (a) até centro-direita (b), sobe para (c,d)
  const ax = cx - W / 2
  const ay = baseY
  const bx = cx + W / 2
  const by = baseY
  const cx_ = bx - D * iso.x
  const cy_ = by + D * iso.y
  const dx_ = ax - D * iso.x
  const dy_ = ay + D * iso.y
  // Altura H: sobe na vertical (y -)
  const v = H

  // Topo: os 4 pontos superiores
  const topFrontL = { x: ax, y: ay - v }
  const topFrontR = { x: bx, y: by - v }
  const topBackR = { x: cx_, y: cy_ - v }
  const topBackL = { x: dx_, y: dy_ - v }

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${uid}-facade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${uid}-side`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${uid}-top`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#475569" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uid}-vegetation`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id={`${uid}-solar`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${uid}-led`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={main} stopOpacity="0.9" />
          <stop offset="100%" stopColor={main} stopOpacity="0.3" />
        </linearGradient>
        <filter id={`${uid}-shadow`}>
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <filter id={`${uid}-glow`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Face LATERAL ESQUERDA (mais escura, profundidade) */}
      <path
        d={`M${dx_} ${dy_} L${topBackL.x} ${topBackL.y} L${topFrontL.x} ${topFrontL.y} L${ax} ${ay} Z`}
        fill={`url(#${uid}-side)`}
        filter={`url(#${uid}-shadow)`}
      />

      {/* Face FRONTAL (principal) */}
      <path
        d={`M${ax} ${ay} L${topFrontL.x} ${topFrontL.y} L${topFrontR.x} ${topFrontR.y} L${bx} ${by} Z`}
        fill={`url(#${uid}-facade)`}
        filter={`url(#${uid}-shadow)`}
      />

      {/* Face LATERAL DIREITA */}
      <path
        d={`M${bx} ${by} L${topFrontR.x} ${topFrontR.y} L${topBackR.x} ${topBackR.y} L${cx_} ${cy_} Z`}
        fill={`url(#${uid}-side)`}
        filter={`url(#${uid}-shadow)`}
      />

      {/* Faixas de janela na FRENTE */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const t = i / 9
        const y1 = ay - v * t
        const y2 = by - v * t
        return (
          <line
            key={i}
            x1={ax + 15}
            y1={y1}
            x2={bx - 15}
            y2={y2}
            stroke="#64748b"
            strokeWidth="0.8"
            opacity="0.4"
          />
        )
      })}

      {/* Vidro central na frente */}
      <path
        d={`M${ax + 20} ${ay - 20} L${ax + 20} ${topFrontL.y + 30} L${bx - 20} ${topFrontR.y + 30} L${bx - 20} ${by - 20} Z`}
        fill={`url(#${uid}-glass)`}
        opacity="0.5"
      />

      {/* Vegetação em balcões (frente) */}
      <ellipse cx={cx - 40} cy={topFrontL.y + 120} rx="18" ry="7" fill={`url(#${uid}-vegetation)`} opacity="0.9" />
      <ellipse cx={cx + 35} cy={topFrontR.y + 150} rx="15" ry="6" fill={`url(#${uid}-vegetation)`} opacity="0.85" />

      {/* TOPO – superfície visível (paralelogramo) */}
      <path
        d={`M${topFrontL.x} ${topFrontL.y} L${topFrontR.x} ${topFrontR.y} L${topBackR.x} ${topBackR.y} L${topBackL.x} ${topBackL.y} Z`}
        fill={`url(#${uid}-top)`}
        filter={`url(#${uid}-shadow)`}
      />

      {/* Painéis solares no topo */}
      <rect x={topFrontL.x + 15} y={topFrontL.y + 5} width="28" height="18" rx="1" fill={`url(#${uid}-solar)`} transform={`skewX(${-5})`} />
      <rect x={topFrontL.x + 50} y={topFrontL.y + 2} width="30" height="20" rx="1" fill={`url(#${uid}-solar)`} transform={`skewX(${-5})`} />
      <rect x={topBackR.x - 55} y={topBackR.y + 8} width="25" height="16" rx="1" fill={`url(#${uid}-solar)`} transform={`skewX(${5})`} />
      <rect x={topBackR.x - 25} y={topBackR.y + 5} width="22" height="18" rx="1" fill={`url(#${uid}-solar)`} transform={`skewX(${5})`} />

      {/* Heliporto no topo */}
      <ellipse
        cx={(topFrontL.x + topFrontR.x + topBackR.x + topBackL.x) / 4}
        cy={(topFrontL.y + topFrontR.y + topBackR.y + topBackL.y) / 4 - 5}
        rx="22"
        ry="12"
        fill="#64748b"
        stroke="#94a3b8"
        strokeWidth="1"
        opacity="0.95"
      />
      <ellipse
        cx={(topFrontL.x + topFrontR.x + topBackR.x + topBackL.x) / 4}
        cy={(topFrontL.y + topFrontR.y + topBackR.y + topBackL.y) / 4 - 5}
        rx="16"
        ry="8"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        opacity="0.7"
      />
      <text
        x={(topFrontL.x + topFrontR.x + topBackR.x + topBackL.x) / 4}
        y={(topFrontL.y + topFrontR.y + topBackR.y + topBackL.y) / 4 - 2}
        textAnchor="middle"
        fill={main}
        fontSize="12"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        H
      </text>
      <ellipse
        cx={(topFrontL.x + topFrontR.x + topBackR.x + topBackL.x) / 4 - 3}
        cy={(topFrontL.y + topFrontR.y + topBackR.y + topBackL.y) / 4 - 8}
        rx="4"
        ry="2"
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth="0.5"
      />

      {/* Jardim no topo */}
      <ellipse
        cx={topFrontL.x + 25}
        cy={topFrontL.y + 25}
        rx="16"
        ry="6"
        fill={`url(#${uid}-vegetation)`}
        opacity="0.9"
      />
      <ellipse
        cx={topBackR.x - 20}
        cy={topBackR.y + 22}
        rx="14"
        ry="5"
        fill={`url(#${uid}-vegetation)`}
        opacity="0.85"
      />

      {/* Antena */}
      <line
        x1={(topFrontL.x + topFrontR.x) / 2}
        y1={Math.min(topFrontL.y, topFrontR.y)}
        x2={(topFrontL.x + topFrontR.x) / 2}
        y2={Math.min(topFrontL.y, topFrontR.y) - 25}
        stroke={main}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle
        cx={(topFrontL.x + topFrontR.x) / 2}
        cy={Math.min(topFrontL.y, topFrontR.y) - 25}
        r="2.5"
        fill={main}
        filter={`url(#${uid}-glow)`}
      />

      {/* Faixa LED na base */}
      <path
        d={`M${ax + 10} ${ay + 5} L${bx - 10} ${by + 5}`}
        stroke={`url(#${uid}-led)`}
        strokeWidth="2"
        strokeLinecap="round"
        filter={`url(#${uid}-glow)`}
      />
    </svg>
  )
}
