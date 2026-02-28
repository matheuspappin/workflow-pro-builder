"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type InternalRole = "seller" | "finance" | "receptionist"

export function InternalLinkForm({ role }: { role: InternalRole }) {
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)

  const roleLabels: Record<InternalRole, string> = {
    seller: "Vendedor",
    finance: "Financeiro",
    receptionist: "Recepcionista",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) {
      toast.error("Informe o código de convite")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/internal/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invite_code: inviteCode.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao vincular")
      toast.success(data.message || "Empresa vinculada com sucesso!")
      setInviteCode("")
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao vincular")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="invite-code">Código de convite</Label>
        <Input
          id="invite-code"
          type="text"
          placeholder="Ex: ABC12345"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="mt-2 font-mono uppercase"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-slate-500">
          Solicite o código ao administrador da empresa para se vincular como {roleLabels[role].toLowerCase()}.
        </p>
      </div>
      <Button type="submit" disabled={loading || !inviteCode.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Vincular
      </Button>
    </form>
  )
}
