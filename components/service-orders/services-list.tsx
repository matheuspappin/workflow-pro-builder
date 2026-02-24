'use client'

import React, { useState, useEffect } from 'react'
import { getServices, createService } from '@/lib/actions/service-orders'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useVocabulary } from "@/hooks/use-vocabulary"

interface ServicesListProps {
  studioId: string
}

export function ServicesList({ studioId }: ServicesListProps) {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newService, setNewService] = useState({ name: '', description: '', price: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t, vocabulary } = useVocabulary()

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await getServices(studioId)
      setServices(data || [])
    } catch (error) {
      console.error(error)
      toast.error(t.common.errorLoadingServices)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [studioId])

  const handleSave = async () => {
    if (!newService.name || !newService.price) {
      toast.error(t.service_orders.fillNameAndPrice)
      return
    }

    setIsSubmitting(true)
    try {
        await createService({
            name: newService.name,
            description: newService.description,
            price: parseFloat(newService.price)
        }, studioId)
        
        toast.success(t.service_orders.serviceCreatedSuccess.replace('{service}', vocabulary.service))
        setIsModalOpen(false)
        setNewService({ name: '', description: '', price: '' })
        fetchServices()
    } catch (error) {
        toast.error(t.service_orders.errorCreatingService.replace('{service}', vocabulary.service.toLowerCase()))
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
      if (!confirm(t.service_orders.confirmDeleteService.replace('{service}', vocabulary.service.toLowerCase()))) return

      try {
          const supabase = createClient()
          const { error } = await supabase.from('services').delete().eq('id', id)
          if (error) throw error
          toast.success(t.service_orders.serviceDeleted.replace('{service}', vocabulary.service))
          fetchServices()
      } catch (error) {
          toast.error(t.service_orders.errorDeletingService.replace('{service}', vocabulary.service.toLowerCase()))
      }
  }

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t.service_orders.catalog}</h2>
          <p className="text-sm text-muted-foreground">
            {t.service_orders.manageServiceTypes.replace('{services}', vocabulary.services.toLowerCase())}
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> {t.service_orders.newService.replace('{service}', vocabulary.service)}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.service_orders.newService.replace('{service}', vocabulary.service)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t.service_orders.serviceName.replace('{service}', vocabulary.service)}</Label>
                        <Input 
                            placeholder={t.service_orders.serviceNamePlaceholder} 
                            value={newService.name}
                            onChange={e => setNewService({...newService, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.service_orders.basePrice}</Label>
                        <Input 
                            type="number"
                            placeholder="0.00" 
                            value={newService.price}
                            onChange={e => setNewService({...newService, price: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.service_orders.serviceDescription}</Label>
                        <Input 
                            placeholder={t.service_orders.serviceDescriptionPlaceholder.replace('{service}', vocabulary.service.toLowerCase())} 
                            value={newService.description}
                            onChange={e => setNewService({...newService, description: e.target.value})}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? t.common.updating : t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.service_orders.searchServices.replace('{services}', vocabulary.services.toLowerCase())}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.service_orders.name}</TableHead>
              <TableHead>{t.service_orders.serviceDescription}</TableHead>
              <TableHead>{t.service_orders.price}</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">{t.common.loading}</TableCell></TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">{t.service_orders.noServicesRegistered.replace('{service}', vocabulary.service.toLowerCase())}</TableCell></TableRow>
            ) : filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-muted-foreground">{service.description || '-'}</TableCell>
                <TableCell>R$ {Number(service.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
