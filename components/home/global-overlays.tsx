"use client"

import { DustCanvas } from "./dust-canvas"

export function DustCanvasGlobal() {
  return <DustCanvas />
}

export function GlobalSpine() {
  return (
    <div
      className="fixed left-1/2 top-0 -translate-x-1/2 w-px min-h-[300vh] pointer-events-none z-[1] animate-tech-pulse"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.025) 35%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.04) 85%, transparent 100%)',
        boxShadow: '0 0 20px rgba(255,255,255,0.03)',
      }}
      aria-hidden
    />
  )
}

export function GlobalTechOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[2] min-h-[300vh]"
      style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
      aria-hidden
    />
  )
}
