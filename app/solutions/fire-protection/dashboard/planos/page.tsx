"use client"

import { PlanosVerticalPage } from "@/components/subscription/planos-vertical-page"

export default function FireProtectionPlanosPage() {
  return (
    <PlanosVerticalPage
      verticalizationSlug="fire-protection"
      configUrl="/solutions/fire-protection/dashboard/configuracoes"
      themeColor="text-red-400"
      themeBg="bg-red-600"
    />
  )
}
