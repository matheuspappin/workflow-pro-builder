"use client"

interface AffiliateHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function AffiliateHeader({ title, description, children }: AffiliateHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
