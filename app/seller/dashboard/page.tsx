"use client"

import { useOrganization } from "@/components/providers/organization-provider"
import { InternalLinkForm } from "@/components/fire-protection/internal-link-form"

export default function SellerDashboardPage() {
  const { studioId, isLoading } = useOrganization()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!studioId) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Portal do Vendedor</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Para acessar o portal, vincule-se à empresa usando o código de convite fornecido pelo administrador.
        </p>
        <InternalLinkForm role="seller" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-2">
      <h1 className="text-4xl font-bold text-center">Bem-vindo ao Portal do Vendedor!</h1>
      <p className="text-lg text-center mt-4">Aqui você poderá gerenciar seus clientes e ordens de serviço.</p>
    </div>
  )
}