"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, ExternalLink, Loader2, Trash2, Link as LinkIcon, Info } from "lucide-react"
import { getTenantsList, getOrCreateStudioInvite, deleteStudio } from "@/lib/actions/super-admin"
import { nicheDictionary } from "@/config/niche-dictionary"
import { MODULE_DEFINITIONS } from "@/config/modules"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<any | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [tenantDetails, setTenantDetails] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { tenants } = await getTenantsList(1, 50, session?.access_token)
      
      const { data: plans } = await supabase
        .from('system_plans')
        .select('*')
      
      setTenants(tenants || [])
      setPlans(plans || [])
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
        description: `A empresa '${tenantToDelete.name}' foi excluída permanentemente.`
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
                    <TableHead>Plano</TableHead>
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
                    const nicheInfo = nicheDictionary.pt[niche as keyof typeof nicheDictionary.pt]
                    const nicheLabel = nicheInfo?.name || 'Dança'
                    
                    // Lógica para encontrar o email do responsável
                    let studioEmail = 'N/A'
                    
                    // 1. Tenta encontrar pelo owner_id na lista de usuários internos
                    if (tenant.owner_id && Array.isArray(tenant.users_internal)) {
                      const owner = tenant.users_internal.find((u: any) => u.id === tenant.owner_id)
                      if (owner?.email) studioEmail = owner.email
                    }
                    
                    // 2. Se não achou, tenta qualquer admin ou o primeiro usuário
                    if (studioEmail === 'N/A' && Array.isArray(tenant.users_internal) && tenant.users_internal.length > 0) {
                      const admin = tenant.users_internal.find((u: any) => u.role === 'admin') || tenant.users_internal[0]
                      if (admin?.email) studioEmail = admin.email
                    }

                    // 3. Fallback para settings (legacy)
                    if (studioEmail === 'N/A') {
                       studioEmail = tenant.studio_settings?.find((s: any) => s.setting_key === 'studio_email' || s.setting_key === 'email')?.setting_value || 'N/A'
                    }

                    const planName = plans?.find((p: any) => p.id === tenant.plan)?.name || 'Gratuito (Legacy)'
                    
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
                           <Badge variant="outline" className="text-xs font-normal bg-slate-100 dark:bg-slate-800">
                            {planName}
                          </Badge>
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
                              variant="ghost"
                              className="w-8 h-8 p-0"
                              onClick={() => {
                                setTenantDetails(tenant)
                                setIsDetailsModalOpen(true)
                              }}
                              title="Detalhes e Informações Adicionais"
                            >
                              <Info className="w-4 h-4 text-slate-500" />
                            </Button>
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

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informações Adicionais</DialogTitle>
            <DialogDescription>
              Detalhes técnicos de <span className="font-semibold text-foreground">{tenantDetails?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {tenantDetails && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-bold text-sm text-slate-500">Plano Atual:</span>
                <div className="col-span-3">
                  <Badge variant="outline" className="text-sm font-normal bg-slate-100 dark:bg-slate-800">
                    {plans.find(p => p.id === tenantDetails?.plan)?.name || 'Gratuito (Legacy)'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-bold text-sm text-slate-500">ID do Sistema:</span>
                <div className="col-span-3 font-mono text-xs text-muted-foreground break-all">{tenantDetails?.id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-bold text-sm text-slate-500">Slug (URL):</span>
                <div className="col-span-3 font-mono text-sm">{tenantDetails?.slug}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-bold text-sm text-slate-500">Cadastro:</span>
                <div className="col-span-3 text-sm">{new Date(tenantDetails?.created_at).toLocaleString('pt-BR')}</div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="text-right font-bold text-sm text-slate-500 pt-2">Módulos:</span>
                <div className="col-span-3 pt-1">
                  {(() => {
                    const settings = Array.isArray(tenantDetails?.organization_settings) ? tenantDetails.organization_settings[0] : tenantDetails.organization_settings
                    const customModules = settings?.enabled_modules
                    const hasCustomization = customModules && Object.keys(customModules).length > 0
                    
                    let activeModules: string[] = []
                    let isCustom = false

                    if (hasCustomization) {
                      activeModules = Object.entries(customModules)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => key)
                      isCustom = true
                    } else {
                      const plan = plans.find(p => p.id === tenantDetails?.plan)
                      // Se o plano tiver módulos definidos, usa eles. Se não, assume alguns defaults ou vazio.
                      // O ideal seria importar a lógica de defaults do sistema, mas vamos tentar pegar do plano carregado.
                      const planModules = plan?.modules || {}
                      activeModules = Object.entries(planModules)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => key)
                    }

                    return (
                      <div className="flex flex-col gap-2">
                        {isCustom ? (
                          <Badge variant="outline" className="w-fit border-amber-500 text-amber-600 bg-amber-50">
                            Personalizado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit text-slate-500">
                            Padrão do Plano
                          </Badge>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {activeModules.length > 0 ? (
                            activeModules.map((key) => {
                              // Safe access to module definition
                              const def = MODULE_DEFINITIONS[key as keyof typeof MODULE_DEFINITIONS]
                              return (
                                <Badge key={key} variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                                  {def?.label || key}
                                </Badge>
                              )
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Nenhum módulo ativo</span>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

               <div className="grid grid-cols-4 items-start gap-4">
                <span className="text-right font-bold text-sm text-slate-500 pt-2">Configurações:</span>
                <div className="col-span-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(Array.isArray(tenantDetails?.organization_settings) ? tenantDetails?.organization_settings[0] : tenantDetails?.organization_settings, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
