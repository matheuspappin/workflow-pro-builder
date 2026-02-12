"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegistrationLinkModalProps {
  isOpen: boolean
  onClose: () => void
  inviteToken: string | null
  studioName: string
}

export function RegistrationLinkModal({ 
  isOpen, 
  onClose, 
  inviteToken,
  studioName
}: RegistrationLinkModalProps) {
  const [registrationLink, setRegistrationLink] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (inviteToken) {
      const link = `${window.location.origin}/setup/invite/${inviteToken}`
      setRegistrationLink(link)
    }
  }, [inviteToken])

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationLink).then(() => {
      setCopied(true)
      toast({
        title: "Link copiado!",
        description: "O link de cadastro foi copiado para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link de Cadastro para {studioName}</DialogTitle>
          <DialogDescription>
            Envie este link para o proprietário da empresa para que ele possa se cadastrar e configurar a conta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          <Input 
            value={registrationLink} 
            readOnly 
            className="flex-1"
          />
          <Button onClick={handleCopy} size="icon">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
