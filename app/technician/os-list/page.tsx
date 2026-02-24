"use client"

import React, { useState, useEffect } from 'react'
import { getServiceOrders } from '@/lib/actions/service-orders'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  MoreHorizontal,
  ChevronLeft,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceOrderForm } from '@/components/service-orders/os-form' // Manter, caso o técnico possa criar OS
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { deleteServiceOrder } from '@/lib/actions/service-orders'
import { toast } from 'sonner'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function TechnicianServiceOrderList() {
  const { t, language, vocabulary } = useVocabulary()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [technicianId, setTechnicianId] = useState<string | null>(null)
  const [studioId, setStudioId] = useState<string | null>(null)

  const statusConfig = {
    draft: { label: t.service_orders.status.draft, color: 'bg-gray-100 text-gray-800' },
    open: { label: t.service_orders.status.open, color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: t.service_orders.status.in_progress, color: 'bg-yellow-100 text-yellow-800' },
    waiting_parts: { label: t.service_orders.status.waiting_parts, color: 'bg-orange-100 text-orange-800' },
    finished: { label: t.service_orders.status.finished, color: 'bg-green-100 text-green-800' },
    cancelled: { label: t.service_orders.status.cancelled, color: 'bg-red-100 text-red-800' },
  }

  const dateLocale = language === 'en' ? enUS : ptBR

  useEffect(() => {
    async function loadTechnicianData() {
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) {
        router.push("/login")
        return
      }
      const user = JSON.parse(userStr)
      setStudioId(user.studio_id)

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (professional) {
        setTechnicianId(professional.id)
      } else {
        toast.error("Perfil de técnico não encontrado.")
        router.push("/login")
      }
    }
    loadTechnicianData()
  }, [router, toast])

  const fetchOrders = async () => {
    if (!studioId || !technicianId) return
    setLoading(true)
    try {
      const data = await getServiceOrders(studioId, { 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search,
        professionalId: technicianId // Filtra por este profissional
      })
      
      setOrders(data || [])
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar Ordens de Serviço.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [studioId, technicianId, statusFilter, search]) // Adicionado search como dependência

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders() // Redundant, mas mantém o padrão se houvesse um botão de submit
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.service_orders.deleteConfirm)) return
    
    try {
      if (!studioId) throw new Error("Studio ID não encontrado.")
      await deleteServiceOrder(id, studioId)
      toast.success(t.service_orders.deleteSuccess)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message || t.service_orders.deleteError)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Minhas Ordens de Serviço</h1>
                <p className="text-sm text-muted-foreground">Gerencie suas vistorias, coletas e entregas.</p>
            </div>
        </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input 
            placeholder={t.service_orders.searchPlaceholder.replace('{client}', vocabulary.client.toLowerCase())} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'finished'].map(s => (
              <Button 
              key={s} 
              variant={statusFilter === s ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? t.common.allF : statusConfig[s as keyof typeof statusConfig]?.label || s}
              </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.service_orders.osDate}</TableHead>
                <TableHead>{t.service_orders.customer.replace('{client}', vocabulary.client)}</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t.common.loading}</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t.service_orders.noOrdersFound}</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.tracking_code}</span>
                        {order.project_type === 'ppci' && (
                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0">PPCI</Badge>
                        )}
                        {order.project_type === 'maintenance' && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">Prev.</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.opened_at), language === 'en' ? "MM/dd/yy 'at' HH:mm" : "dd/MM/yy 'às' HH:mm", { locale: dateLocale })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{order.customer?.name}</span>
                      <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.description || "N/A"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                      {statusConfig[order.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          // N�o permite editar a OS por aqui (apenas a partir dos detalhes)
                          // setEditingOrder(order)
                          // setIsFormOpen(true)
                          router.push(`/technician/os-details/${order.id}`)
                        }}>
                          <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> {t.common.delete}
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? `Editar OS #${editingOrder.tracking_code}` : `Nova Ordem de Serviço`}</DialogTitle>
          </DialogHeader>
          <ServiceOrderForm 
            studioId={studioId || ''} 
            initialData={editingOrder} 
            onSuccess={() => {
              setIsFormOpen(false)
              fetchOrders()
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
