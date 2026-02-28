'use client'

import React, { useState, useEffect } from 'react'
import { getServiceOrders } from '@/lib/actions/service-orders'
import { sendProjectToEngineer } from '@/lib/actions/engineer'
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
  AlertCircle,
  ClipboardList,
  Loader2,
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
import { ptBR, enUS } from 'date-fns/locale'
import { deleteServiceOrder, getServiceOrderById, getServiceOrderByIdForStudio } from '@/lib/actions/service-orders'
import { toast } from 'sonner'
import { useVocabulary } from '@/hooks/use-vocabulary'

interface OSListProps {
  studioId: string
}

// ─── Dialog: Visualizar Detalhes da OS (com Checklist) ─────────────────────────

function ViewOSDetailsDialog({
  order,
  open,
  onClose,
  studioId,
}: {
  order: any
  open: boolean
  onClose: () => void
  studioId?: string
}) {
  const { t, vocabulary, language } = useVocabulary()
  const [detalhe, setDetalhe] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const statusConfig = {
    draft: { label: t.service_orders.status.draft, color: 'bg-gray-100 text-gray-800' },
    open: { label: t.service_orders.status.open, color: 'bg-blue-100 text-blue-800' },
    pending_acceptance: { label: t.service_orders.status.pending_acceptance, color: 'bg-amber-100 text-amber-800' },
    in_progress: { label: t.service_orders.status.in_progress, color: 'bg-yellow-100 text-yellow-800' },
    waiting_parts: { label: t.service_orders.status.waiting_parts, color: 'bg-orange-100 text-orange-800' },
    finished: { label: t.service_orders.status.finished, color: 'bg-green-100 text-green-800' },
    cancelled: { label: t.service_orders.status.cancelled, color: 'bg-red-100 text-red-800' },
  }

  useEffect(() => {
    if (!open || !order?.id) return
    setLoading(true)
    setDetalhe(null)
    const fetchFn = studioId
      ? () => getServiceOrderByIdForStudio(order.id, studioId)
      : () => getServiceOrderById(order.id)
    fetchFn()
      .then((data) => {
        if (data) setDetalhe(data)
      })
      .finally(() => setLoading(false))
  }, [open, order?.id, studioId])

  const milestones = detalhe?.milestones ?? []
  const sortedMilestones = [...milestones].sort(
    (a: { order_index?: number }, b: { order_index?: number }) => (a.order_index ?? 0) - (b.order_index ?? 0)
  )
  const dateLocale = language === 'en' ? enUS : ptBR
  const totalMilestones = sortedMilestones.length
  const completedCount = sortedMilestones.filter((m: { status: string }) => m.status === 'completed').length
  const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0

  if (!order) return null

  const st = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.open

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {order.tracking_code} — {order.title || order.description || t.common.untitled}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={st.color}>{st.label}</Badge>
            </div>
            {order.customer && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{order.customer.name}</span>
                {order.customer.phone && (
                  <span className="text-muted-foreground">· {order.customer.phone}</span>
                )}
              </div>
            )}
            {order.professional && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {t.service_orders.technician.replace('{provider}', vocabulary.provider)}: {order.professional.name}
              </div>
            )}
            {order.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t.common.details}
                </p>
                <p className="text-sm">{order.description}</p>
              </div>
            )}
            {detalhe?.observations && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Observações / Laudo
                </p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{detalhe.observations}</p>
              </div>
            )}
            {/* Progressão do Projeto — sempre visível */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Progressão do Projeto
                </p>
                {totalMilestones > 0 ? (
                  <Badge
                    variant="secondary"
                    className={
                      completedCount === totalMilestones
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                    }
                  >
                    {completedCount}/{totalMilestones} etapas — {progressPercent}%
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem etapas</span>
                )}
              </div>
              {totalMilestones > 0 ? (
                <>
                  <div className="mb-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {sortedMilestones.map((m: { id: string; title: string; status: string; completed_at?: string }) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg border ${
                          m.status === 'completed'
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        {m.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={`flex-1 ${m.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                          {m.title}
                        </span>
                        {m.completed_at && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            {format(new Date(m.completed_at), language === 'en' ? "MM/dd/yy HH:mm" : "dd/MM/yy às HH:mm", { locale: dateLocale })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 rounded-lg bg-muted/30 border border-dashed text-center">
                  Nenhuma etapa definida ainda. As etapas PPCI serão criadas automaticamente quando o engenheiro aceitar o projeto.
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t.common.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function OSList({ studioId }: OSListProps) {
  const { t, language, vocabulary } = useVocabulary()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [viewingOrder, setViewingOrder] = useState<any>(null)

  const statusConfig = {
    draft: { label: t.service_orders.status.draft, color: 'bg-gray-100 text-gray-800' },
    open: { label: t.service_orders.status.open, color: 'bg-blue-100 text-blue-800' },
    pending_acceptance: { label: t.service_orders.status.pending_acceptance, color: 'bg-amber-100 text-amber-800' },
    in_progress: { label: t.service_orders.status.in_progress, color: 'bg-yellow-100 text-yellow-800' },
    waiting_parts: { label: t.service_orders.status.waiting_parts, color: 'bg-orange-100 text-orange-800' },
    finished: { label: t.service_orders.status.finished, color: 'bg-green-100 text-green-800' },
    cancelled: { label: t.service_orders.status.cancelled, color: 'bg-red-100 text-red-800' },
  }

  const dateLocale = language === 'en' ? enUS : ptBR

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getServiceOrders(studioId, { 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search 
      })
      
      // Se estivermos na página de projetos, filtramos apenas os que são projetos (ppci ou maintenance)
      const isProjectsPage = window.location.pathname.includes('/projetos')
      const filteredData = isProjectsPage 
        ? data.filter((o: any) => o.project_type === 'ppci' || o.project_type === 'maintenance')
        : data

      setOrders(filteredData || [])
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

  const handleDelete = async (id: string) => {
    if (!confirm(t.service_orders.deleteConfirm)) return
    
    try {
      await deleteServiceOrder(id, studioId)
      toast.success(t.service_orders.deleteSuccess)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message || t.service_orders.deleteError)
    }
  }

  const handleSendToEngineer = async (id: string) => {
    try {
      const result = await sendProjectToEngineer(id, studioId)
      if (result.success) {
        toast.success('Projeto enviado ao engenheiro para aceite.')
        fetchOrders()
      } else {
        toast.error(result.error || 'Erro ao enviar projeto.')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar projeto.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.service_orders.title}</h1>
          <p className="text-muted-foreground">
            {t.service_orders.manageOS
              .replace('{services}', vocabulary.services.toLowerCase())
              .replace('{establishment}', vocabulary.establishment.toLowerCase())}
          </p>
        </div>
        <Button onClick={() => {
          setEditingOrder(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" /> {t.service_orders.newOS}
        </Button>
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
                <TableHead>{t.service_orders.technician.replace('{provider}', vocabulary.provider)}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="text-right">{t.common.total}</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t.common.loading}</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t.service_orders.noOrdersFound}</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setViewingOrder(order)}
                >
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
                  <TableCell>{order.professional?.name || t.common.notAssigned}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                      {statusConfig[order.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {language === 'en' ? '$' : 'R$'} {Number(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingOrder(order)
                          setIsFormOpen(true)
                        }}>
                          <Edit className="w-4 h-4 mr-2" /> {t.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                          <Eye className="w-4 h-4 mr-2" /> {t.common.view}
                        </DropdownMenuItem>
                        {order.professional_id && order.status === 'open' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSendToEngineer(order.id)} className="text-amber-600">
                              <ChevronRight className="w-4 h-4 mr-2" /> {t.service_orders.sendToEngineer}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> {t.common.delete}
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
            <DialogTitle>{editingOrder ? `${t.service_orders.editOS} #${editingOrder.tracking_code}` : t.service_orders.newOS}</DialogTitle>
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

      {/* Dialog de Visualizar — Detalhes da OS com Checklist */}
      <ViewOSDetailsDialog
        order={viewingOrder}
        open={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        studioId={studioId}
      />
    </div>
  )
}
