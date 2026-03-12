"use client"

import { OrganizationProvider } from "@/components/providers/organization-provider"
import InventoryPage from "@/app/dashboard/estoque/page"

export default function DanceStudioEstoquePage() {
  return (
    <OrganizationProvider>
      <InventoryPage />
    </OrganizationProvider>
  )
}
