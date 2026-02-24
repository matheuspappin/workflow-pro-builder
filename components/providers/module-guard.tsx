"use client"

import React from 'react'
import { useOrganization } from '@/components/providers/organization-provider'
import { ModuleKey } from '@/config/modules'
import { ModuleUpgradeBarrier } from '@/components/admin/module-upgrade-barrier'
import { ModuleLockScreen } from '@/components/common/module-lock-screen'
import { MODULE_PRICING } from '@/config/module-pricing'

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
  const { enabledModules, isLoading } = useOrganization()

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

      return <ModuleLockScreen title={title} description={description} />
    }

    return null
  }

  return <>{children}</>
}
