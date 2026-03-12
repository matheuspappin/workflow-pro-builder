"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AffiliateHeader } from "@/components/dashboard/affiliate-header"
import { FileText, Copy, Check, ExternalLink, Plus } from "lucide-react"
import { toast } from "sonner"
import { nicheDictionary } from "@/config/niche-dictionary"
import { isVerticalizationNiche, VERTICALIZATION_LANDING_URL } from "@/config/niche-landing-theme"
import type { NicheType } from "@/config/niche-dictionary"

const SCRIPT_TEMPLATE = `O akaaicore é um sistema completo para {establishment}s. Gerencia {client}s, agenda de {provider}s, {service}s, financeiro e muito mais. Teste grátis por 14 dias, sem cartão de crédito.`

const EMAIL_TEMPLATE = `Assunto: Gestão inteligente para seu {establishment}

Olá,

Conheça o akaaicore — a plataforma completa para gerenciar seu {establishment}.

Com o sistema você pode:
• Cadastrar e gerenciar {client}s
• Organizar a agenda de {provider}s
• Controlar {service}s e financeiro
• Acessar de qualquer lugar

Teste grátis por 14 dias, sem cartão de crédito.

{landingUrl}

Qualquer dúvida, estou à disposição.`

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

export default function AffiliateMateriaisPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [selectedNiche, setSelectedNiche] = useState<NicheType>("dentist")
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedLanding, setCopiedLanding] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/portal/affiliate/login")
        return
      }
      const storedUser = localStorage.getItem("danceflow_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role !== "affiliate" && parsedUser.role !== "partner" && parsedUser.role !== "admin" && parsedUser.role !== "super_admin") {
          toast.error("Acesso restrito: Esta área é apenas para afiliados.")
          router.push("/portal/login")
          return
        }
      }
      setIsReady(true)
    }
    checkAuth()
  }, [router])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const vocab = nicheDictionary.pt[selectedNiche] ?? nicheDictionary.pt.dance
  const landingUrl = isVerticalizationNiche(selectedNiche)
    ? `${baseUrl}${VERTICALIZATION_LANDING_URL[selectedNiche] ?? `/solutions/nichos/${selectedNiche}`}`
    : `${baseUrl}/solutions/nichos/${selectedNiche}`
  const registerUrl = `${baseUrl}/register?niche=${selectedNiche}`

  const scriptText = interpolate(SCRIPT_TEMPLATE, {
    establishment: vocab.establishment,
    client: vocab.client,
    provider: vocab.provider,
    service: vocab.service,
  })

  const emailText = interpolate(EMAIL_TEMPLATE, {
    establishment: vocab.establishment,
    client: vocab.client,
    provider: vocab.provider,
    service: vocab.service,
    landingUrl,
  })

  const copyToClipboard = async (text: string, type: "script" | "email" | "landing") => {
    await navigator.clipboard.writeText(text)
    if (type === "script") setCopiedScript(true)
    else if (type === "email") setCopiedEmail(true)
    else setCopiedLanding(true)
    toast.success("Copiado!")
    setTimeout(() => {
      if (type === "script") setCopiedScript(false)
      else if (type === "email") setCopiedEmail(false)
      else setCopiedLanding(false)
    }, 2000)
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const nicheEntries = Object.entries(nicheDictionary.pt).filter(
    ([key]) => key !== "default_generic"
  ) as [NicheType, { name: string }][]

  return (
    <div className="p-6 space-y-8">
      <AffiliateHeader
        title="Materiais de Vendas"
        description="Links, scripts e modelos de e-mail para cada nicho. Use para prospectar clientes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Selecione o nicho</CardTitle>
          <CardDescription>
            Escolha o nicho do seu prospect para ver os materiais personalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedNiche} onValueChange={(v) => setSelectedNiche(v as NicheType)}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nicheEntries.map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Link da Landing
            </CardTitle>
            <CardDescription>
              Envie este link ao prospect para ele conhecer o sistema antes de criar a conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={landingUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(landingUrl, "landing")}
              >
                {copiedLanding ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href={landingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link de Cadastro</CardTitle>
            <CardDescription>
              Link direto para o cadastro com o nicho já selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={registerUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(registerUrl, "landing")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script de Vendas</CardTitle>
          <CardDescription>
            Use este texto em ligações ou reuniões para apresentar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-sans">
              {scriptText}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(scriptText, "script")}
            >
              {copiedScript ? <Check className="w-4 h-4 text-green-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelo de E-mail</CardTitle>
          <CardDescription>
            Copie e adapte para enviar por e-mail ao prospect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-sans max-h-64 overflow-auto">
              {emailText}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(emailText, "email")}
            >
              {copiedEmail ? <Check className="w-4 h-4 text-green-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximo passo</CardTitle>
          <CardDescription>
            Após o prospect demonstrar interesse, crie um ecossistema e envie o link de convite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/portal/affiliate/ecosystems/new">
              <Plus className="w-4 h-4" />
              Criar Novo Ecossistema
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
