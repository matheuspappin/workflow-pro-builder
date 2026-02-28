"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Edit, Percent, Trash2 } from "lucide-react"
import { getPartnersList, deletePartner } from "@/lib/actions/super-admin"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { EditPartnerModal } from "@/components/admin/edit-partner-modal"
import logger from "@/lib/logger"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AffiliatesPage() {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPartners()
  }, [])

  async function loadPartners() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const { partners } = await getPartnersList(1, 50, session?.access_token)
      setPartners(partners || [])
    } catch (error) {
      logger.error({ err: error }, "Erro ao carregar afiliados")
      toast({
        title: "Erro ao carregar afiliados",
        description: "Não foi possível buscar a lista de afiliados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePartner = async (id: string) => {
    try {
      setDeletingId(id)
      const { data: { session } } = await supabase.auth.getSession()
      await deletePartner(id, session?.access_token)
      
      toast({
        title: "Afiliado excluído",
        description: "O afiliado e seu usuário foram removidos com sucesso.",
      })
      
      loadPartners()
    } catch (error: any) {
      logger.error(error)
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o afiliado.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditClick = (partner: any) => {
    setSelectedPartner(partner)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    loadPartners()
  }

  const filteredPartners = partners.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Gestão de Afiliados" />
      
      <div className="p-8 max-w-[1600px] mx-auto w-full space-y-6">
        {/* ... mantendo o header da busca ... */}
        <div className="flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou slug..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Futuro: Botão de adicionar afiliado manualmente se necessário */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Afiliados Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Comissão (%)</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Nenhum afiliado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">
                          {partner.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {partner.slug || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold text-emerald-600">
                             <Percent className="w-3 h-3" />
                             {partner.commission_rate ? `${partner.commission_rate}%` : '0%'}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(partner.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(partner)} className="gap-2">
                              <Edit className="w-4 h-4" />
                              Editar
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                  {deletingId === partner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o afiliado
                                    <span className="font-bold"> {partner.name}</span> e seu acesso ao sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePartner(partner.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Confirmar Exclusão
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <EditPartnerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        partner={selectedPartner}
      />
    </div>
  )
}
