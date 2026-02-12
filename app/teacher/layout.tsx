"use client"

import { useState, useEffect } from "react"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { TeacherMobileNav } from "@/components/teacher/teacher-mobile-nav"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [teacherData, setTeacherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeacher() {
      try {
        setLoading(true)
        const userStr = localStorage.getItem("danceflow_user")
        if (!userStr) {
          window.location.href = "/login"
          return
        }
        const user = JSON.parse(userStr)

        // Buscar dados do professor para garantir que temos o studio_id e etc
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setTeacherData(teacher || user)
      } catch (error) {
        console.error("Erro ao carregar layout do professor:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTeacher()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0">
      <TeacherHeader teacher={teacherData} />
      <div className="flex-1">
        {children}
      </div>
      <TeacherMobileNav />
    </div>
  )
}
