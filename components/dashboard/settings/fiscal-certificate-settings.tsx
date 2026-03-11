"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Receipt, Upload, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FiscalCertificateSettingsProps {
  studioId: string | null
}

export function FiscalCertificateSettings({ studioId }: FiscalCertificateSettingsProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<{
    configured: boolean
    environment?: string
    valid_until?: string
    updated_at?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [password, setPassword] = useState("")
  const [environment, setEnvironment] = useState<"homologation" | "production">("homologation")
  const [file, setFile] = useState<File | null>(null)

  const fetchStatus = async () => {
    if (!studioId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fiscal/certificate?studioId=${encodeURIComponent(studioId)}`)
      const text = await res.text()
      let data: { configured?: boolean; environment?: string; valid_until?: string; updated_at?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        setStatus({ configured: false })
        return
      }
      if (res.ok) setStatus({ configured: data.configured ?? false, environment: data.environment, valid_until: data.valid_until, updated_at: data.updated_at })
      else setStatus({ configured: false })
    } catch {
      setStatus({ configured: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [studioId])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId || !file || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o arquivo .pfx e informe a senha.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("pfx", file)
      formData.append("password", password)
      formData.append("environment", environment)

      const res = await fetch(`/api/fiscal/certificate?studioId=${encodeURIComponent(studioId)}`, {
        method: "POST",
        body: formData,
      })

      const text = await res.text()
      let data: { error?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error("Resposta inválida do servidor. Tente novamente.")
      }

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar certificado")
      }

      toast({
        title: "Certificado salvo",
        description: "O certificado A1 foi configurado com sucesso.",
      })
      setPassword("")
      setFile(null)
      fetchStatus()
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao salvar certificado",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!studioId || !confirm("Remover o certificado? Você precisará fazer upload novamente para emitir NF-e.")) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/fiscal/certificate?studioId=${encodeURIComponent(studioId)}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao remover")
      toast({ title: "Certificado removido" })
      fetchStatus()
    } catch {
      toast({ title: "Erro ao remover certificado", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  if (!studioId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Certificado Fiscal (NF-e)
        </CardTitle>
        <CardDescription>
          Configure o certificado digital A1 (.pfx) para emissão de Notas Fiscais Eletrônicas via SEFAZ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : status?.configured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Certificado configurado</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {status.environment === "production" ? "Produção" : "Homologação"}
              </Badge>
              {status.updated_at && (
                <Badge variant="secondary">
                  Atualizado em {new Date(status.updated_at).toLocaleDateString("pt-BR")}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <form onSubmit={handleUpload} className="flex flex-col gap-4 flex-1">
                <p className="text-sm text-muted-foreground">
                  Para substituir o certificado, selecione um novo arquivo .pfx e informe a senha.
                </p>
                <div className="flex flex-col gap-2">
                  <Label>Novo arquivo .pfx</Label>
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Senha do certificado</Label>
                  <Input
                    type="password"
                    placeholder="Senha do .pfx"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!file || !password || uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Substituir certificado
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remover
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Certificado não configurado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Faça o upload do certificado digital A1 (.pfx) para habilitar a emissão de NF-e.
            </p>
            <div className="flex flex-col gap-2">
              <Label>Arquivo .pfx</Label>
              <Input
                type="file"
                accept=".pfx,.p12"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Senha do certificado</Label>
              <Input
                type="password"
                placeholder="Senha do .pfx"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Ambiente</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as "homologation" | "production")}
              >
                <option value="homologation">Homologação (testes)</option>
                <option value="production">Produção</option>
              </select>
            </div>
            <Button type="submit" disabled={!file || !password || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Salvar certificado
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
