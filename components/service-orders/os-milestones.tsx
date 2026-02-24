'use client'

import React, { useEffect, useState } from 'react'
import { 
    getServiceOrderMilestones, 
    createServiceOrderMilestone, 
    updateMilestoneStatus, 
    deleteMilestone 
} from '@/lib/actions/service-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface OSMilestonesProps {
    orderId: string
    studioId: string
}

export function OSMilestones({ orderId, studioId }: OSMilestonesProps) {
    const [milestones, setMilestones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newTitle, setNewTitle] = useState('')

    const loadMilestones = async () => {
        try {
            const data = await getServiceOrderMilestones(orderId)
            setMilestones(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMilestones()
    }, [orderId])

    const handleAddMilestone = async () => {
        if (!newTitle.trim()) return
        try {
            await createServiceOrderMilestone({
                service_order_id: orderId,
                title: newTitle,
                order_index: milestones.length
            }, studioId)
            setNewTitle('')
            loadMilestones()
            toast.success('Marco adicionado')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleToggleStatus = async (milestone: any) => {
        const nextStatus = milestone.status === 'completed' ? 'pending' : 'completed'
        try {
            await updateMilestoneStatus(milestone.id, nextStatus, studioId)
            loadMilestones()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteMilestone(id, studioId)
            loadMilestones()
            toast.success('Marco removido')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (loading) return <div>Carregando marcos...</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Etapas do Projeto (Milestones)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Nova etapa (Ex: Vistoria Realizada)" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <Button onClick={handleAddMilestone} size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar
                    </Button>
                </div>

                <div className="space-y-2">
                    {milestones.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum marco definido para este projeto.
                        </p>
                    )}
                    {milestones.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleToggleStatus(m)}
                                >
                                    {m.status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </Button>
                                <span className={m.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                    {m.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {m.completed_at && (
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(m.completed_at).toLocaleDateString()}
                                    </span>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
