'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client' // Importa o cliente Supabase do lado do cliente
import { User } from '@supabase/supabase-js'

interface UserSession {
  user: User | null
  studioId: string | null
  role: string | null
  isLoading: boolean
}

export function useSession(): UserSession {
  const [session, setSession] = useState<UserSession>({
    user: null,
    studioId: null,
    role: null,
    isLoading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    const getSession = async () => {
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
        setSession({ user: null, studioId: null, role: null, isLoading: false })
        return
      }

      if (supabaseSession) {
        const user = supabaseSession.user
        const userRole = user.user_metadata?.role || null
        const userStudioId = user.user_metadata?.studio_id || null
        
        setSession({
          user,
          studioId: userStudioId,
          role: userRole,
          isLoading: false,
        })
      } else {
        setSession({ user: null, studioId: null, role: null, isLoading: false })
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = session.user
        const userRole = user.user_metadata?.role || null
        const userStudioId = user.user_metadata?.studio_id || null
        setSession({
          user,
          studioId: userStudioId,
          role: userRole,
          isLoading: false,
        })
      } else {
        setSession({ user: null, studioId: null, role: null, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return session
}
