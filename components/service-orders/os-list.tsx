'use client'

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
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle
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
import { ServiceOrderForm } from './os-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OSListProps {
  studioId: string
}

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  open: { label: 'Aberta', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Executando', color: 'bg-yellow-100 text-yellow-800' },
  waiting_parts: { label: 'Peças', color: 'bg-orange-100 text-orange-800' },
  finished: { label: 'Finalizada', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
}

export function OSList({ studioId }: OSListProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getServiceOrders(studioId, { 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search 
      })
      setOrders(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [studioId, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie consertos, atendimentos e manutenções.</p>
        </div>
        <Button onClick={() => {
          setEditingOrder(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" /> Nova OS
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input 
            placeholder="Buscar por cliente, OS ou problema..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex gap-2">
          <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
             {/* Note: Usando Select inline ou dropdown conforme UI pattern */}
             <div className="flex gap-1">
                {['all', 'open', 'in_progress', 'finished'].map(s => (
                   <Button 
                    key={s} 
                    variant={statusFilter === s ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                   >
                     {s === 'all' ? 'Todas' : statusConfig[s as keyof typeof statusConfig]?.label || s}
                   </Button>
                ))}
             </div>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS / Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma OS encontrada.</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.tracking_code}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.opened_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{order.customer?.name}</span>
                      <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.professional?.name || 'Não atribuído'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                      {statusConfig[order.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingOrder(order)
                          setIsFormOpen(true)
                        }}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
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
            <DialogTitle>{editingOrder ? `Editar OS #${editingOrder.tracking_code}` : 'Nova Ordem de Serviço'}</DialogTitle>
          </DialogHeader>
          <ServiceOrderForm 
            studioId={studioId} 
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
