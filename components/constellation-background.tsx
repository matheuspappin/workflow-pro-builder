"use client"

import { useMemo } from "react"

const DOT_COUNT = 150
const CONNECTION_DISTANCE = 0.14

function generatePoints() {
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < DOT_COUNT; i++) {
    points.push({
      x: Math.random(),
      y: Math.random(),
    })
  }
  return points
}

function getConnections(points: { x: number; y: number }[]) {
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
  return connections
}

export function ConstellationBackground() {
  const { points, connections } = useMemo(() => {
    const pts = generatePoints()
    const conn = getConnections(pts)
    return { points: pts, connections: conn }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Linhas finas conectando pontos */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.4">
          {connections.map(([i, j], idx) => (
            <line
              key={idx}
              x1={points[i].x * 1000}
              y1={points[i].y * 1000}
              x2={points[j].x * 1000}
              y2={points[j].y * 1000}
            />
          ))}
        </g>
        {/* Pontos brancos */}
        <g fill="rgba(255,255,255,0.85)">
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * 1000}
              cy={p.y * 1000}
              r="2"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
