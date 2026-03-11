"use client"

import { OrganizationProvider } from "@/components/providers/organization-provider"
import ERPPage from "@/app/dashboard/erp/page"

export default function DanceStudioERPPage() {
  return (
    <OrganizationProvider>
      <ERPPage />
    </OrganizationProvider>
  )
}
