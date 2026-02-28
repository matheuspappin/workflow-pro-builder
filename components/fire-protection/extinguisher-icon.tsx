"use client"

/** Ícone de extintor preenchido (sólido) para o logo FireControl - baseado em Lucide, variante filled */
export function ExtinguisherIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Corpo cilíndrico - preenchido */}
      <path d="M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z" fill="currentColor" stroke="none" />
      {/* Alça e tubo */}
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
      <path d="M9 18h6" />
      <path d="M15 7h2a2 2 0 0 1 2 2v1" />
      <path d="M6 14h2" />
      <path d="M11 3a6 6 0 0 0-6 6v8" />
    </svg>
  )
}
