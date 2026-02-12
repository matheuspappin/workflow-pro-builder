"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, ExternalLink, Loader2, Trash2, Link as LinkIcon } from "lucide-react"
import { getTenantsList, getOrCreateStudioInvite, deleteStudio } from "@/lib/actions/super-admin"
import { nicheDictionary } from "@/config/niche-dictionary"
import { supabase } from "@/lib/supabase"
import { RegistrationLinkModal } from "@/components/admin/registration-link-modal"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { tenants } = await getTenantsList(1, 50, session?.access_token)
      setTenants(tenants || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureClick = async (tenant: any) => {
    setSelectedTenant(tenant)
    setIsGeneratingLink(true)
    setIsModalOpen(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const result = await getOrCreateStudioInvite(tenant.id, session?.access_token)
      if (result.token) {
        setInviteToken(result.token)
      } else {
        throw new Error("Token not received")
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link de cadastro. Tente novamente.",
        variant: "destructive",
      })
      setIsModalOpen(false)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleDeleteClick = (tenant: any) => {
    setTenantToDelete(tenant)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!tenantToDelete) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      await deleteStudio(tenantToDelete.id, session?.access_token)
      toast({
        title: "Empresa Excluída",
        description: `A empresa '${tenantToDelete.name}' foi excluída permanentemente.`, 
        variant: "success"
      })
      loadTenants() // Recarregar a lista de tenants
    } catch (error) {
      console.error('Erro ao deletar tenant:', error)
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a empresa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setTenantToDelete(null)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTenant(null)
    setInviteToken(null)
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.organization_settings?.[0]?.niche?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Gestão de Tenants" />
      
      <div className="p-8 max-w-[1600px] mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou nicho..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button>Adicionar Manualmente</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nicho</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const settings = Array.isArray(tenant.organization_settings) ? tenant.organization_settings[0] : tenant.organization_settings
                    const niche = settings?.niche || 'dance'
                    const nicheInfo = nicheDictionary[niche as keyof typeof nicheDictionary]
                    const nicheLabel = nicheInfo?.name || 'Dança'
                    
                    const studioEmail = tenant.studio_settings?.find((s: any) => s.setting_key === 'email')?.setting_value || 'N/A'
                    
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-base font-bold">{tenant.name}</span>
                            <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{studioEmail}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={settings?.niche ? "outline" : "secondary"} 
                            className={`uppercase text-[10px] tracking-wider ${settings?.niche ? 'border-primary/50 text-primary' : 'opacity-50'}`}
                          >
                            {nicheLabel}
                          </Badge>
                          {!settings?.niche && <span className="ml-2 text-[10px] text-muted-foreground italic">(Default)</span>}
                        </TableCell>
                        <TableCell>{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => handleConfigureClick(tenant)}
                              disabled={isGeneratingLink && selectedTenant?.id === tenant.id}
                            >
                              {isGeneratingLink && selectedTenant?.id === tenant.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LinkIcon className="w-4 h-4" />
                              )}
                              Link
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => handleDeleteClick(tenant)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <RegistrationLinkModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        inviteToken={isGeneratingLink ? null : inviteToken}
        studioName={selectedTenant?.name || ""}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a empresa '<span className="font-semibold text-foreground">{tenantToDelete?.name}</span>' e todos os dados relacionados (alunos, professores, finanças, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
