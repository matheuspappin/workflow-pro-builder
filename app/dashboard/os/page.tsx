"use client"

import { OSList } from '@/components/service-orders/os-list'
import { OSCalendar } from '@/components/service-orders/os-calendar'
import { ServicesList } from '@/components/service-orders/services-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/dashboard/header'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { useOrganization } from '@/components/providers/organization-provider'
import { ModuleGuard } from '@/components/providers/module-guard'
import { Calendar, List, Wrench } from 'lucide-react'

export default function OSPage() {
  const { t } = useVocabulary()
  const { studioId } = useOrganization()

  if (!studioId) return null

  return (
    <ModuleGuard module="service_orders" showFullError>
      <div className="flex flex-col min-h-screen">
        <Header title={t.service_orders.title} />
        <div className="p-6">
          <Tabs defaultValue="list" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  {t.service_orders.title}
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger value="catalog" className="gap-2">
                  <Wrench className="w-4 h-4" />
                  {t.service_orders.catalog}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-6">
              <OSList studioId={studioId} />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <OSCalendar studioId={studioId} />
            </TabsContent>

            <TabsContent value="catalog" className="space-y-6">
              <ServicesList studioId={studioId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModuleGuard>
  );
}
