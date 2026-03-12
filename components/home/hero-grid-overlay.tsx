"use client"

import { useState, useEffect } from "react"

export function HeroGridOverlay() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const section = document.getElementById("hero")
    if (!section) return
    const handleMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setOffset({ x: x * 8, y: y * 8 })
    }
    const handleLeave = () => setOffset({ x: 0, y: 0 })
    section.addEventListener("mousemove", handleMove)
    section.addEventListener("mouseleave", handleLeave)
    return () => {
      section.removeEventListener("mousemove", handleMove)
      section.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 opacity-30 z-[1] transition-transform duration-150 ease-out pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'linear-gradient(to bottom, black 20%, transparent 85%)',
        backgroundPosition: `${40 + offset.x}px ${40 + offset.y}px`,
      }}
      aria-hidden
    />
  )
}
