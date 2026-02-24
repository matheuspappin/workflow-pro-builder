"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TechnicianHeader } from "@/components/technician/technician-header"
import { TechnicianMobileNav } from "@/components/technician/technician-mobile-nav"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [technicianData, setTechnicianData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadTechnician() {
      try {
        setLoading(true)
        const userStr = localStorage.getItem("danceflow_user")
        if (!userStr) {
          router.push("/login")
          return
        }
        const user = JSON.parse(userStr)

        // Buscar dados do técnico
        const { data: professional } = await supabase
          .from('professionals')
          .select('*, user:users_internal(email)') // Incluir dados do usuário para verificar role
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (professional) {
          if (professional.professional_type === 'technician') {
            setTechnicianData({ ...professional, email: professional.user?.email || professional.email })
          } else if (professional.professional_type === 'engineer' || professional.role === 'engineer') {
            // Se for engenheiro, redirecionar para o portal do engenheiro
            router.push('/solutions/fire-protection/engineer')
            return
          } else {
            // Outro tipo não autorizado
            router.push("/login")
            return
          }
        } else {
            // Profissional não encontrado
            router.push("/login")
            return
        }

      } catch (error) {
        console.error("Erro ao carregar layout do técnico:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTechnician()
  }, [router])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!technicianData) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0">
      <TechnicianHeader technician={technicianData} />
      <div className="flex-1">
        {children}
      </div>
      <TechnicianMobileNav />
    </div>
  )
}
