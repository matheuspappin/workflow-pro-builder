"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePartner } from "@/lib/actions/super-admin"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface EditPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  partner: any
}

export function EditPartnerModal({ isOpen, onClose, onSuccess, partner }: EditPartnerModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    commission_rate: 0
  })
  const { toast } = useToast()

  // Reset form when partner changes
  useState(() => {
    if (partner) {
      setFormData({
        name: partner.name || "",
        slug: partner.slug || "",
        commission_rate: partner.commission_rate || 0
      })
    }
  })

  // Update effect
  if (partner && formData.name === "" && !loading && isOpen) {
       // This is a quick sync, ideally use useEffect with dependency on partner
       // But direct in render is risky, let's use useEffect properly below
  }

  // Proper sync
  const [initialized, setInitialized] = useState(false)
  if (isOpen && partner && partner.id && !initialized) {
      setFormData({
        name: partner.name || "",
        slug: partner.slug || "",
        commission_rate: partner.commission_rate || 0
      })
      setInitialized(true)
  }
  
  if (!isOpen && initialized) {
      setInitialized(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'commission_rate' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      await updatePartner(partner.id, formData, session?.access_token)
      
      toast({
        title: "Afiliado atualizado",
        description: "Os dados do afiliado foram atualizados com sucesso."
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o afiliado.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Afiliado</DialogTitle>
          <DialogDescription>
            Atualize as informações e comissões deste afiliado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Afiliado</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input 
              id="slug" 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Identificador único usado em URLs de indicação.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission_rate">Comissão (%)</Label>
            <Input 
              id="commission_rate" 
              name="commission_rate" 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={formData.commission_rate} 
              onChange={handleChange} 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Porcentagem recebida sobre vendas realizadas.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
