"use client"

import { OrganizationProvider } from "@/components/providers/organization-provider"
import MarketplacePage from "@/app/dashboard/marketplace/page"

export default function DanceStudioMarketplacePage() {
  return (
    <OrganizationProvider>
      <MarketplacePage />
    </OrganizationProvider>
  )
}
