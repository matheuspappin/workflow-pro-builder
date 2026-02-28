import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEffect } from "react"
import { toast } from "sonner"
import { createClientBySeller, updateClientBySeller } from "@/lib/actions/seller-clients"

// Schema de validação para cliente (pode ser movido para lib/schemas/seller-clients.ts)
const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface SellerClientFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client: (ClientFormValues & { id?: string }) | null
  sellerId: string
  studioId: string
}

export function SellerClientFormDialog({
  isOpen,
  onClose,
  onSuccess,
  client,
  sellerId,
  studioId,
}: SellerClientFormDialogProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || { name: "", email: "", phone: "", birth_date: "", address: "" },
  })

  useEffect(() => {
    if (client) {
      form.reset(client)
    } else {
      form.reset({ name: "", email: "", phone: "", birth_date: "", address: "" })
    }
  }, [client, form])

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (client) {
        // Editar cliente existente
        await updateClientBySeller(client.id!, values, sellerId, studioId)
        toast.success("Cliente atualizado com sucesso!")
      } else {
        // Criar novo cliente
        await createClientBySeller(values, sellerId, studioId)
        toast.success("Cliente adicionado com sucesso!")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Faça alterações no perfil do cliente." : "Adicione um novo cliente para o seu portal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="col-span-3"
            />
            {form.formState.errors.name && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              {...form.register("email")}
              className="col-span-3"
            />
            {form.formState.errors.email && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Telefone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="birth_date" className="text-right">Data Nasc.</Label>
            <Input
              id="birth_date"
              type="date"
              {...form.register("birth_date")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Endereço</Label>
            <Input
              id="address"
              {...form.register("address")}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}