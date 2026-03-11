import { DashboardSkeletonClient } from "@/components/dashboard/dashboard-skeleton-client"

// Auth and role-based routing is fully handled by proxy.ts middleware.
// This layout only provides the shell UI (sidebar, mobile nav).
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSkeletonClient>
        {children}
      </DashboardSkeletonClient>
    </div>
  )
}
