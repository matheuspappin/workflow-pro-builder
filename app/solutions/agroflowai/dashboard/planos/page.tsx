"use client"

import { PlanosVerticalPage } from "@/components/subscription/planos-vertical-page"

export default function AgroFlowAIPlanosPage() {
  return (
    <PlanosVerticalPage
      verticalizationSlug="agroflowai"
      configUrl="/solutions/agroflowai/dashboard/configuracoes"
      themeColor="text-emerald-400"
      themeBg="bg-emerald-600"
    />
  )
}
