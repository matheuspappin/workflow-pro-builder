"use client"

import React from 'react'
import { useOrganization } from '@/components/providers/organization-provider'
import { ModuleKey } from '@/config/modules'
import { ModuleUpgradeBarrier } from '@/components/admin/module-upgrade-barrier'

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
      return <ModuleUpgradeBarrier module={module} />
    }

    return null
  }

  return <>{children}</>
}
