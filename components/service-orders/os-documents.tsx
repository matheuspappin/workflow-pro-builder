'use client'

import React, { useEffect, useState, useRef } from 'react'
import { 
    getServiceOrderDocuments, 
    createServiceOrderDocument, 
    deleteServiceOrderDocument,
    signServiceOrderDocument
} from '@/lib/actions/service-orders'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    FileText, 
    Upload, 
    Trash2, 
    CheckCircle2, 
    Clock, 
    File, 
    Image as ImageIcon,
    Download,
    Signature,
    Loader2,
    Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OSDocumentsProps {
    orderId: string
    studioId: string
}

export function OSDocuments({ orderId, studioId }: OSDocumentsProps) {
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [category, setCategory] = useState('laudo')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const loadDocuments = async () => {
        try {
            const data = await getServiceOrderDocuments(orderId)
            setDocuments(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDocuments()
    }, [orderId])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${orderId}/${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `service-orders/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('arquiteto upload')
                .upload(filePath, file)

            if (uploadError) {
                // Se o bucket não existir, precisamos tratar. 
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('arquiteto upload')
                .getPublicUrl(filePath)

            // 3. Create Record in Database
            await createServiceOrderDocument({
                service_order_id: orderId,
                title: file.name,
                file_url: publicUrl,
                file_type: fileExt,
                category: category
            }, studioId)

            toast.success('Documento enviado com sucesso!')
            loadDocuments()
        } catch (error: any) {
            console.error(error)
            toast.error('Erro ao enviar arquivo: ' + error.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (doc: any) => {
        if (!confirm('Tem certeza que deseja remover este documento?')) return
        try {
            await deleteServiceOrderDocument(doc.id, studioId)
            
            // Optional: Delete from storage too
            const urlParts = doc.file_url.split('/')
            const fileName = urlParts[urlParts.length - 1]
            const filePath = `service-orders/${orderId}/${fileName}`
            await supabase.storage.from('arquiteto upload').remove([filePath])
            
            toast.success('Documento removido')
            loadDocuments()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleSign = async (docId: string) => {
        try {
            await signServiceOrderDocument(docId, studioId)
            toast.success('Documento assinado com sucesso!')
            loadDocuments()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const getFileIcon = (type: string) => {
        const t = type?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(t)) return <ImageIcon className="w-4 h-4 text-blue-500" />
        if (t === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />
        return <File className="w-4 h-4 text-slate-400" />
    }

    if (loading) return <div>Carregando documentos...</div>

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Documentos e Laudos
                </CardTitle>
                <CardDescription>Upe plantas, ARTs, laudos e fotos da vistoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="laudo">Laudo Técnico</SelectItem>
                            <SelectItem value="planta">Planta / DWG</SelectItem>
                            <SelectItem value="foto">Foto Vistoria</SelectItem>
                            <SelectItem value="art">ART / RRT</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex-1">
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.dwg,.zip"
                        />
                        <Button 
                            variant="outline" 
                            className="w-full h-9 border-dashed border-2 hover:border-indigo-500 hover:bg-indigo-50 text-xs font-bold"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploading ? 'Enviando...' : 'Fazer Upload'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {documents.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
                        </div>
                    )}
                    {documents.map((doc) => (
                        <div key={doc.id} className="group relative flex flex-col gap-2 p-3 border rounded-xl bg-white dark:bg-slate-900 hover:border-indigo-200 transition-colors shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        {getFileIcon(doc.file_type)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold truncate max-w-[150px] sm:max-w-[200px]">{doc.title}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] px-1 h-4 uppercase font-black tracking-tighter">
                                                {doc.category}
                                            </Badge>
                                            <span className="text-[9px] text-muted-foreground">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </a>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(doc)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Signatures Section */}
                            <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                {doc.signed_at ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Assinado digitalmente</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-amber-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Aguardando Assinatura</span>
                                    </div>
                                )}

                                {doc.category === 'laudo' && !doc.signed_at && (
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-[10px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-0"
                                        onClick={() => handleSign(doc.id)}
                                    >
                                        <Signature className="w-3 h-3 mr-1" /> Assinar Laudo
                                    </Button>
                                )}
                                
                                {doc.signed_at && (
                                    <span className="text-[9px] text-muted-foreground italic">
                                        em {new Date(doc.signed_at).toLocaleDateString()} às {new Date(doc.signed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
