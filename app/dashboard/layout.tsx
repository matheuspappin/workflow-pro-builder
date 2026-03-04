import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { DashboardSkeletonClient } from "@/components/dashboard/dashboard-skeleton-client"
import logger from "@/lib/logger"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Check if user is super admin - redirect to admin panel
  const userRole = user.user_metadata?.role || user.app_metadata?.role || ''
  if (userRole === 'super_admin') {
    redirect("/admin")
  }

  // Check user's studio and niche for proper routing
  try {
    const { data: userStudio } = await supabase
      .from('users_internal')
      .select('studio_id, role')
      .eq('id', user.id)
      .single()

    if (userStudio?.studio_id) {
      // Check if studio has specific niche routing
      const { data: studio } = await supabase
        .from('studios')
        .select('id, niche')
        .eq('id', userStudio.studio_id)
        .single()

      if (studio?.niche === 'fire_protection') {
        redirect(`/solutions/fire-protection/dashboard`)
      }
    }
  } catch (error) {
    // If there's any error checking studio, continue to normal dashboard
    logger.error('Error checking user studio:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSkeletonClient>
        {children}
      </DashboardSkeletonClient>
    </div>
  )
}
