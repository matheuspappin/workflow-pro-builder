"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FileText, Plus, Search, Download, Calendar, MapPin,
  User, X, Loader2, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, ChevronUp, ArrowRight, Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type LaudoStatus = 'draft' | 'review' | 'approved' | 'issued'
type LaudoType = 'car' | 'desmatamento' | 'ndvi' | 'licenciamento' | 'impacto_ambiental' | 'supressao'

interface Laudo {
  id: string
  code: string
  title: string
  client: string
  property: string
  type: LaudoType
  status: LaudoStatus
  engineer: string
  date: string
  description?: string
  art?: string
}

const statusConfig: Record<LaudoStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: "Rascunho", color: "text-slate-400", bg: "bg-slate-400/10", icon: Clock },
  review: { label: "Em Revisão", color: "text-amber-400", bg: "bg-amber-400/10", icon: AlertTriangle },
  approved: { label: "Aprovado", color: "text-blue-400", bg: "bg-blue-400/10", icon: CheckCircle2 },
  issued: { label: "Emitido", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
}

const typeLabels: Record<LaudoType, string> = {
  car: "Laudo CAR",
  desmatamento: "Desmatamento",
  ndvi: "NDVI / Vegetação",
  licenciamento: "Licenciamento Ambiental",
  impacto_ambiental: "Impacto Ambiental",
  supressao: "Supressão Vegetal",
}

interface StudioInfo {
  name: string
  cnpj?: string
  phone?: string
  address?: string
  crea_responsible?: string
  responsible_name?: string
  email?: string
}

function generateLaudoPDF(laudo: Laudo, studioInfo: StudioInfo) {
  const typeMap: Record<string, string> = {
    car: "Laudo CAR — Cadastro Ambiental Rural",
    desmatamento: "Laudo de Desmatamento",
    ndvi: "Laudo NDVI / Cobertura Vegetal",
    licenciamento: "Laudo de Licenciamento Ambiental",
    impacto_ambiental: "Laudo de Impacto Ambiental",
    supressao: "Laudo de Supressão Vegetal",
  }
  const statusColors: Record<string, { bg: string; color: string }> = {
    draft:    { bg: "#f1f5f9", color: "#475569" },
    review:   { bg: "#fef3c7", color: "#92400e" },
    approved: { bg: "#dbeafe", color: "#1e40af" },
    issued:   { bg: "#d1fae5", color: "#065f46" },
  }
  const statusLabels: Record<string, string> = {
    draft: "Rascunho", review: "Em Revisão", approved: "Aprovado", issued: "Emitido",
  }
  const { bg: sBg, color: sColor } = statusColors[laudo.status] || { bg: "#f1f5f9", color: "#475569" }
  const studioName = studioInfo.name || "AgroFlowAI"
  const protocolNum = `${laudo.code}-${new Date().getFullYear()}`

  const companyLines: string[] = []
  if (studioInfo.address) companyLines.push(studioInfo.address)
  if (studioInfo.phone) companyLines.push(`Tel: ${studioInfo.phone}`)
  if (studioInfo.email) companyLines.push(studioInfo.email)
  if (studioInfo.cnpj) companyLines.push(`CNPJ: ${studioInfo.cnpj}`)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${laudo.code} — ${laudo.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 11pt; line-height: 1.6; }
    .page { max-width: 820px; margin: 0 auto; padding: 48px 56px; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #059669; margin-bottom: 30px; }
    .logo-area h1 { font-size: 20pt; font-weight: 900; color: #059669; letter-spacing: -0.5px; }
    .logo-area .tagline { font-size: 8.5pt; color: #64748b; margin-top: 3px; }
    .logo-area .company-info { font-size: 7.5pt; color: #94a3b8; margin-top: 6px; line-height: 1.5; }
    .doc-meta { text-align: right; }
    .doc-meta .code { font-size: 13pt; font-weight: 900; color: #059669; }
    .doc-meta .protocol { font-size: 8pt; color: #94a3b8; margin-top: 2px; }
    .doc-meta .date { font-size: 8.5pt; color: #64748b; margin-top: 4px; }
    .status-pill { display: inline-block; background: ${sBg}; color: ${sColor}; padding: 3px 11px; border-radius: 20px; font-size: 8pt; font-weight: 700; margin-top: 6px; border: 1px solid ${sColor}40; }
    /* Title block */
    .title-block { background: #f0fdf4; border-left: 5px solid #059669; padding: 18px 22px; margin-bottom: 28px; border-radius: 0 10px 10px 0; }
    .title-block .doc-type { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #059669; margin-bottom: 5px; }
    .title-block h2 { font-size: 16pt; font-weight: 900; color: #0f172a; line-height: 1.3; }
    /* Sections */
    .section { margin-bottom: 26px; page-break-inside: avoid; }
    .section-title { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 7px; margin-bottom: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .field { margin-bottom: 4px; }
    .field label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; display: block; margin-bottom: 2px; }
    .field span { font-size: 10.5pt; color: #1e293b; font-weight: 500; }
    .field span.accent { color: #059669; font-weight: 700; }
    /* Description box */
    .desc-box { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 10pt; color: #374151; line-height: 1.7; min-height: 60px; }
    /* Declaration */
    .declaration { font-size: 9.5pt; color: #374151; line-height: 1.8; text-align: justify; }
    /* Legal note */
    .legal-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; font-size: 8.5pt; color: #78350f; line-height: 1.6; margin-top: 8px; }
    .legal-box strong { color: #92400e; }
    /* Signatures */
    .signature-area { margin-top: 52px; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; page-break-inside: avoid; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1.5px solid #334155; padding-top: 8px; margin-top: 48px; }
    .sig-name { font-weight: 700; font-size: 10pt; color: #0f172a; }
    .sig-role { font-size: 8.5pt; color: #64748b; margin-top: 2px; }
    .sig-crea { font-size: 8pt; color: #059669; font-weight: 600; margin-top: 2px; }
    /* Footer */
    .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #94a3b8; }
    .footer .watermark { font-size: 7pt; color: #cbd5e1; }
    /* Print */
    @media print {
      body { font-size: 10pt; }
      .page { padding: 0; max-width: 100%; }
      @page { margin: 18mm 18mm 14mm 18mm; size: A4; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo-area">
      <h1>${studioName}</h1>
      <div class="tagline">Consultoria de Compliance Ambiental e Engenharia</div>
      ${companyLines.length ? `<div class="company-info">${companyLines.join(" &nbsp;·&nbsp; ")}</div>` : ""}
    </div>
    <div class="doc-meta">
      <div class="code">${laudo.code}</div>
      <div class="protocol">Protocolo: ${protocolNum}</div>
      <div class="date">Data de emissão: ${laudo.date}</div>
      <div class="status-pill">${statusLabels[laudo.status] || laudo.status}</div>
    </div>
  </div>

  <div class="title-block">
    <div class="doc-type">${typeMap[laudo.type] || laudo.type}</div>
    <h2>${laudo.title}</h2>
  </div>

  <div class="section">
    <div class="section-title">1. Identificação do Cliente e Propriedade</div>
    <div class="grid-2">
      <div class="field"><label>Cliente / Proprietário Rural</label><span>${laudo.client || "—"}</span></div>
      <div class="field"><label>Propriedade / Imóvel Rural</label><span>${laudo.property || "—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Responsabilidade Técnica</div>
    <div class="grid-3">
      <div class="field"><label>Engenheiro Responsável</label><span>${laudo.engineer || "—"}</span></div>
      <div class="field"><label>Número ART</label><span class="accent">${laudo.art || "—"}</span></div>
      ${studioInfo.crea_responsible ? `<div class="field"><label>CREA Responsável</label><span>${studioInfo.crea_responsible}</span></div>` : "<div></div>"}
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Objeto e Descrição do Laudo</div>
    <div class="desc-box">
      ${laudo.description
        ? laudo.description.replace(/\n/g, "<br>")
        : `Este laudo técnico foi elaborado em atendimento às exigências da legislação ambiental vigente,
           especificamente quanto ao ${typeMap[laudo.type] || "tipo de serviço solicitado"} e normas complementares
           aplicáveis. O profissional responsável declara que as informações contidas neste documento são verídicas
           e baseadas em análise técnica.`}
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Declaração de Responsabilidade</div>
    <p class="declaration">
      O profissional abaixo identificado, detentor do presente laudo técnico, declara para os devidos fins que
      as informações, dados e conclusões aqui apresentadas são fruto de análise técnica especializada, baseada em
      metodologias e normas vigentes. Este documento é válido exclusivamente após assinatura do responsável técnico
      e registro da Anotação de Responsabilidade Técnica (ART) junto ao Conselho Regional de Engenharia e Agronomia
      (CREA) competente, nos termos da Lei Federal n.º 5.194/1966 e Resolução CONFEA n.º 1.025/2009.
    </p>
    <div class="legal-box" style="margin-top:12px;">
      <strong>Base Legal:</strong> Lei n.º 12.651/2012 (Código Florestal Brasileiro) · Instrução Normativa MMA
      n.º 02/2014 · Decreto n.º 7.830/2012 (SICAR) · Resolução CONAMA vigente aplicável ao tipo de laudo.
      Documento gerado eletronicamente pelo sistema AgroFlowAI — os dados e responsabilidades são do profissional
      emitente.
    </div>
  </div>

  <div class="signature-area">
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-name">${laudo.engineer || "Engenheiro Responsável"}</div>
        <div class="sig-role">Engenheiro Ambiental / Agrônomo</div>
        ${laudo.art ? `<div class="sig-crea">ART Nº ${laudo.art}</div>` : ""}
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-name">${studioInfo.responsible_name || studioName}</div>
        <div class="sig-role">Responsável pela Consultoria</div>
        ${studioInfo.cnpj ? `<div class="sig-crea">CNPJ: ${studioInfo.cnpj}</div>` : ""}
      </div>
    </div>
  </div>

  <div class="footer">
    <span>${laudo.code} &nbsp;·&nbsp; Gerado em ${new Date().toLocaleString("pt-BR")}</span>
    <span class="watermark">AgroFlowAI — Sistema de Gestão Ambiental &amp; Compliance</span>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export default function LaudosPage() {
  const [laudos, setLaudos] = useState<Laudo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<LaudoStatus | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [studioInfo, setStudioInfo] = useState<StudioInfo>({ name: "" })
  const { toast } = useToast()

  const [form, setForm] = useState({
    title: "",
    client: "",
    property: "",
    type: "car" as LaudoType,
    engineer: "",
    art: "",
  })

  const getStudioId = () => {
    try { return JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || "" } catch { return "" }
  }

  useEffect(() => {
    const studioId = getStudioId()
    if (!studioId) { setLoading(false); return }
    // Load studio info for PDF generation
    fetch(`/api/agroflowai/configuracoes?studioId=${studioId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStudioInfo({
          name: data.name || "",
          cnpj: data.cnpj,
          phone: data.phone,
          address: data.address,
          crea_responsible: data.crea_responsible,
          responsible_name: data.responsible_name,
          email: data.email,
        })
      })
      .catch(() => {
        try {
          const user = JSON.parse(localStorage.getItem("workflow_user") || "{}")
          setStudioInfo({ name: user.studioName || user.studio_name || "" })
        } catch {}
      })
    fetch(`/api/agroflowai/laudos?studioId=${studioId}`)
      .then(r => r.json())
      .then(data => setLaudos(Array.isArray(data) ? data : []))
      .catch(() => setLaudos([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusAdvance = async (laudo: Laudo) => {
    const nextStatus: Record<LaudoStatus, LaudoStatus | null> = {
      draft: "review", review: "approved", approved: "issued", issued: null,
    }
    const next = nextStatus[laudo.status]
    if (!next) return
    setUpdatingId(laudo.id)
    setLaudos(prev => prev.map(l => l.id === laudo.id ? { ...l, status: next } : l))
    try {
      const studioId = getStudioId()
      const res = await fetch(`/api/agroflowai/laudos/${laudo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, status: next }),
      })
      if (!res.ok) throw new Error()
      const labels = { review: "Em Revisão", approved: "Aprovado", issued: "Emitido" }
      toast({ title: `Laudo → ${labels[next as keyof typeof labels] || next}` })
    } catch {
      setLaudos(prev => prev.map(l => l.id === laudo.id ? { ...l, status: laudo.status } : l))
      toast({ title: "Erro ao atualizar laudo", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) {
      toast({ title: "Informe o título do laudo", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/laudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, ...form, type: form.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar laudo")
      setLaudos(prev => [data, ...prev])
      toast({ title: "Laudo criado!", description: `${data.code} adicionado como rascunho` })
      setShowForm(false)
      setForm({ title: "", client: "", property: "", type: "car", engineer: "", art: "" })
    } catch (err: any) {
      toast({ title: "Erro ao criar laudo", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const filtered = laudos.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.client.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: laudos.length,
    draft: laudos.filter(l => l.status === "draft").length,
    review: laudos.filter(l => l.status === "review").length,
    approved: laudos.filter(l => l.status === "approved").length,
    issued: laudos.filter(l => l.status === "issued").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Laudos Técnicos</h1>
          <p className="text-slate-400 mt-1">Laudos ambientais, CAR, licenciamentos e regularizações</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Laudo
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: `Todos (${counts.all})` },
          { key: "draft", label: `Rascunho (${counts.draft})` },
          { key: "review", label: `Revisão (${counts.review})` },
          { key: "approved", label: `Aprovados (${counts.approved})` },
          { key: "issued", label: `Emitidos (${counts.issued})` },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              filterStatus === f.key
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar laudos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                Novo Laudo Técnico
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Título do Laudo *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Laudo de Regularização CAR..."
                    required
                    className="bg-slate-800 border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente *</label>
                    <Input
                      value={form.client}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                      placeholder="Nome do cliente"
                      required
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Propriedade / Área</label>
                    <Input
                      value={form.property}
                      onChange={(e) => setForm({ ...form, property: e.target.value })}
                      placeholder="Ex: Fazenda, ha..."
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Laudo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(typeLabels) as [LaudoType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, type: key })}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-bold text-left border transition-all",
                          form.type === key
                            ? "border-violet-500 bg-violet-600/20 text-violet-400"
                            : "border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engenheiro Responsável</label>
                    <Input
                      value={form.engineer}
                      onChange={(e) => setForm({ ...form, engineer: e.target.value })}
                      placeholder="Nome do engenheiro"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nº ART (opcional)</label>
                    <Input
                      value={form.art}
                      onChange={(e) => setForm({ ...form, art: e.target.value })}
                      placeholder="ART-2026-..."
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Laudo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">Nenhum laudo encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((laudo) => {
            const st = statusConfig[laudo.status]
            const StatusIcon = st.icon
            return (
              <Card key={laudo.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-500 font-mono">{laudo.code}</span>
                        <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>
                          <StatusIcon className="w-2.5 h-2.5 mr-1" />
                          {st.label}
                        </Badge>
                        <Badge className="text-[10px] font-bold border-0 text-teal-400 bg-teal-400/10">{typeLabels[laudo.type]}</Badge>
                      </div>
                      <p className="font-bold text-white mb-1">{laudo.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{laudo.client}</span>
                        {laudo.property && <span>{laudo.property}</span>}
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{laudo.engineer}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{laudo.date}</span>
                        {laudo.art && <span className="text-emerald-400 font-bold">{laudo.art}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Advance status button */}
                      {laudo.status !== "issued" && (
                        updatingId === laudo.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleStatusAdvance(laudo)}
                            className="h-7 px-2 text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 border border-violet-500/20 rounded-lg font-bold"
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            {laudo.status === "draft" ? "Revisar" : laudo.status === "review" ? "Aprovar" : "Emitir"}
                          </Button>
                        )
                      )}
                      {/* PDF button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateLaudoPDF(laudo, studioInfo)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10"
                        title="Gerar PDF do laudo"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => setExpandedId(expandedId === laudo.id ? null : laudo.id)}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                      >
                        {expandedId === laudo.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === laudo.id && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Cliente</span>
                          <span className="text-slate-300">{laudo.client || "—"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Propriedade</span>
                          <span className="text-slate-300">{laudo.property || "—"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Engenheiro</span>
                          <span className="text-slate-300">{laudo.engineer || "—"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">ART</span>
                          <span className="text-emerald-400 font-bold">{laudo.art || "—"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateLaudoPDF(laudo, studioInfo)}
                        className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold"
                      >
                        <Download className="w-3.5 h-3.5 mr-2" /> Gerar PDF do Laudo Técnico
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
