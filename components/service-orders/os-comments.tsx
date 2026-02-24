'use client'

import React, { useEffect, useState } from 'react'
import { getServiceOrderComments, createServiceOrderComment } from '@/lib/actions/service-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useOrganization } from '@/components/providers/organization-provider'

interface OSCommentsProps {
    orderId: string
    studioId: string
}

export function OSComments({ orderId, studioId }: OSCommentsProps) {
    const { language } = useOrganization()
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')

    const loadComments = async () => {
        try {
            const data = await getServiceOrderComments(orderId, studioId)
            setComments(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadComments()
    }, [orderId])

    const handleAddComment = async () => {
        if (!newComment.trim()) return
        try {
            await createServiceOrderComment(orderId, studioId, newComment)
            setNewComment('')
            loadComments()
            toast.success('Comentário enviado')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (loading) return <div>Carregando comentários...</div>

    const dateLocale = language === 'en' ? enUS : ptBR

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comentários & Histórico
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-[300px] max-h-[500px]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum comentário ainda. Inicie a conversa.
                        </p>
                    )}
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-primary">
                                    {comment.user?.email || 'Usuário'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: dateLocale })}
                                </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-2 pt-2 mt-auto border-t">
                    <Input 
                        placeholder="Escreva um comentário..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAddComment()
                            }
                        }}
                    />
                    <Button onClick={handleAddComment} size="icon">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
