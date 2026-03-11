"use client"

import React, { useEffect, useState } from 'react'
import { useOrganization } from '@/components/providers/organization-provider'
import { ModuleKey } from '@/config/modules'
import { ModuleLockScreen } from '@/components/common/module-lock-screen'
import { MODULE_PRICING } from '@/config/module-pricing'
import { PLAN_LIMITS } from '@/lib/plan-limits'

interface ModuleGuardProps {
  module: ModuleKey
  children: React.ReactNode
  fallback?: React.ReactNode
  showFullError?: boolean
}

/**
 * Componente que protege partes da interface baseando-se nos módulos ativos.
 * Mostra uma barreira de upgrade se o módulo não estiver ativo.
 */
export function ModuleGuard({ 
  module, 
  children, 
  fallback, 
  showFullError = false 
}: ModuleGuardProps) {
  const { enabledModules, isLoading, planName, niche, studioId } = useOrganization()
  const [fetchedPlanName, setFetchedPlanName] = useState<string | null>(null)

  // Mesma fonte que a página Planos e Preços: /api/dance-studio/usage + danceflow_user
  const effectiveStudioId = studioId ?? (typeof window !== 'undefined' ? (() => {
    try {
      const u = localStorage.getItem('danceflow_user')
      if (u) {
        const p = JSON.parse(u)
        return p.studio_id || p.studioId || null
      }
    } catch { /* ignore */ }
    return null
  })() : null)

  // Fallback: buscar plano via API (mesma fonte que Planos e Preços)
  useEffect(() => {
    if (!showFullError || !effectiveStudioId || planName) return
    fetch(`/api/dance-studio/usage?studioId=${encodeURIComponent(effectiveStudioId)}`)
      .then((r) => r.json())
      .then((data) => data.planName && setFetchedPlanName(data.planName))
      .catch(() => {})
  }, [showFullError, effectiveStudioId, planName])

  if (isLoading) return null

  const isEnabled = enabledModules[module]

  if (!isEnabled) {
    if (fallback) return <>{fallback}</>

    if (showFullError) {
      const pricing = MODULE_PRICING[module]
      const title = `Módulo ${pricing?.description || module}`
      const description = (
        <div className="space-y-2">
          <p>Este ecossistema de gestão é exclusivo para parceiros com o módulo ativo.</p>
          <ul className="text-sm text-left list-disc list-inside opacity-80">
            {pricing?.benefits?.slice(0, 3).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )

      const isEstudioDeDanca = typeof window !== 'undefined' && window.location.pathname.includes('/solutions/estudio-de-danca')
      const upgradeUrl = niche === 'dance' && isEstudioDeDanca
        ? '/solutions/estudio-de-danca/dashboard/planos'
        : '/dashboard/configuracoes?tab=plano'
      const upgradeText = isEstudioDeDanca ? 'Planos e Preços' : 'Fazer Upgrade'

      const displayPlan = planName ?? fetchedPlanName ?? PLAN_LIMITS.gratuito.name

      return (
        <ModuleLockScreen
          title={title}
          description={description}
          currentPlan={displayPlan}
          upgradeUrl={upgradeUrl}
          upgradeText={upgradeText}
        />
      )
    }

    return null
  }

  return <>{children}</>
}
