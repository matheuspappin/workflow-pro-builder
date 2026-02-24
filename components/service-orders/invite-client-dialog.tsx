'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UserPlus, Loader2, Copy } from 'lucide-react'
import { inviteClient } from '@/lib/actions/auth-invite'
import { toast } from 'sonner'

const inviteSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos)'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteClientDialogProps {
  studioId: string
  studioName: string
  onClientCreated: (clientId: string) => void
}

export function InviteClientDialog({ studioId, studioName, onClientCreated }: InviteClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  const onSubmit = async (values: InviteFormValues) => {
    setLoading(true)
    try {
      const result = await inviteClient({
        ...values,
        studioId,
        studioName,
      })

      if (result.success) {
        setInviteLink(result.inviteLink || null)
        toast.success('Cliente convidado com sucesso! O e-mail foi enviado e o link está disponível abaixo.')
        onClientCreated(result.userId)
        // setOpen(false) // Não fechar o dialog imediatamente para permitir a cópia do link
        // form.reset() // Não resetar o formulário imediatamente para manter o link visível
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao convidar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="w-full mt-2">
          <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente + Enviar Convite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Cliente</DialogTitle>
          <DialogDescription>
            Crie a conta do cliente e envie um link para ele definir a senha. Ele poderá acessar o portal para ver esta OS.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="joao@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando Convite...
                  </>
                ) : (
                  'Criar e Enviar Convite'
                )}
              </Button>
            </DialogFooter>
            {inviteLink && (
              <div className="mt-4 space-y-2">
                <FormLabel>Link de Convite Manual</FormLabel>
                <div className="flex space-x-2">
                  <Input value={inviteLink} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                      toast.info('Link copiado para a área de transferência!')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Compartilhe este link manualmente com o cliente.</p>
                <Button onClick={() => {
                  setOpen(false)
                  form.reset()
                  setInviteLink(null) // Limpar o link ao fechar
                }} className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
