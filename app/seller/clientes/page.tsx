'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session' // Hook para obter informações do usuário logado
import { getSellerClients, deleteClientBySeller } from '@/lib/actions/seller-clients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusCircle, Edit, Trash, CircleAlert } from 'lucide-react'
import { SellerClientFormDialog } from '@/components/seller/client-form-dialog' // Componente a ser criado
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export default function SellerClientsPage() {
  const { user, studioId } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const sellerId = user?.id // O ID do usuário logado é o seller_id

  useEffect(() => {
    if (sellerId && studioId) {
      fetchClients()
    }
  }, [sellerId, studioId])

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSellerClients(sellerId!, studioId!)
      setClients(data as Client[])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes.')
      toast.error(err.message || 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewClient = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return
    try {
      if (sellerId && studioId) {
        await deleteClientBySeller(clientId, sellerId, studioId)
        toast.success('Cliente deletado com sucesso!')
        fetchClients()
      } else {
        toast.error('Dados do vendedor ou estúdio ausentes.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao deletar cliente.')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchClients()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg text-center mt-4">Carregando clientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meus Clientes</CardTitle>
            <CardDescription>Gerencie os clientes que você cadastrou.</CardDescription>
          </div>
          <Button onClick={handleNewClient}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
          </Button>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum cliente cadastrado ainda. Clique em "Adicionar Cliente" para começar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Criado Em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClient(client)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SellerClientFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        client={editingClient}
        sellerId={sellerId!}
        studioId={studioId!}
      />
    </div>
  )
}
