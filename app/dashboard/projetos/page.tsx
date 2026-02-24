'use client'

import React from 'react'
import { OSList } from '@/components/service-orders/os-list'
import { Header } from '@/components/dashboard/header'
import { useOrganization } from '@/components/providers/organization-provider'
import { ModuleGuard } from '@/components/providers/module-guard'

export default function ProjetosPage() {
  const { studioId } = useOrganization()

  if (!studioId) return null

  return (
    <ModuleGuard module="service_orders" showFullError>
      <div className="flex flex-col min-h-screen">
        <Header title="Gestão de Projetos PPCI" />
        <div className="p-6">
           <OSList studioId={studioId} />
        </div>
      </div>
    </ModuleGuard>
  );
}
