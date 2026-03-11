"use client"

import { useState, useRef, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  Settings,
  Brain,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { getProfessionalHeaders, CRM_FIELD_TO_LABEL } from "@/lib/import/crm-model"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Studio {
  id: string
  name: string
}

interface ImportData {
  sessionId: string
  fileName: string
  fileType: string
  recordCount: number
  sample: any[]
  headers: string[]
  analysis: {
    suggestedMappings: Array<{
      sourceField: string
      targetField: string
      confidence: number
      dataType: string
      sampleValue?: string
    }>
    dataQuality: {
      completeness: number
      consistency: number
      validity: number
      issues: string[]
    }
    detectedEntityType: string
    confidence: number
    recommendations: string[]
  }
}

interface ImportResult {
  imported: number
  errors: number
  details: string[]
  validationErrors?: number
}

export default function ImportPage() {
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importData, setImportData] = useState<ImportData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedStudio, setSelectedStudio] = useState("")
  const [importType, setImportType] = useState("")
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [executing, setExecuting] = useState(false)
  const [studios, setStudios] = useState<Studio[]>([])
  const [standardizeForAkaai, setStandardizeForAkaai] = useState(true)
  const [defaultCategory, setDefaultCategory] = useState("geral")
  const [loadingStudios, setLoadingStudios] = useState(true)
  const [catarinaOpen, setCatarinaOpen] = useState(false)
  const [catarinaMessages, setCatarinaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [catarinaInput, setCatarinaInput] = useState("")
  const [catarinaLoading, setCatarinaLoading] = useState(false)
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, string>>>({})
  const [testResult, setTestResult] = useState<{ wouldImport: number; preview: any[]; message: string; professionalHeaders?: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Buscar studios reais do banco
  useEffect(() => {
    async function fetchStudios() {
      try {
        const res = await fetch('/api/admin/studios')
        if (res.ok) {
          const data = await res.json()
          setStudios(data.studios || data || [])
        }
      } catch (e) {
        console.error('Erro ao buscar studios:', e)
      } finally {
        setLoadingStudios(false)
      }
    }
    fetchStudios()
  }, [])

  const resetState = () => {
    setStep(1)
    setImportData(null)
    setImportResult(null)
    setMapping({})
    setEditedRows({})
    setTestResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!selectedStudio || !importType) {
      toast.error("Selecione o estúdio e o tipo de importação")
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 50MB)")
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const allowedExtensions = /\.(xls|xlsx|csv|json|xml|txt)$/i
    if (!allowedExtensions.test(file.name)) {
      toast.error("Tipo de arquivo não suportado. Use: XLSX, XLS, CSV, JSON, XML ou TXT")
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetStudio', selectedStudio)
      formData.append('importType', importType)

      setUploadProgress(30)

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(70)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha no upload')
      }

      const result = await response.json()
      setUploadProgress(100)
      setImportData(result.data)

      // Inicializar mapeamento com sugestões da IA (Catarina/Gemini ou regras)
      const initialMapping: Record<string, string> = {}
      result.data.analysis.suggestedMappings.forEach((m: any) => {
        if (m.confidence > 0.5) {
          initialMapping[m.targetField] = m.sourceField
        }
      })
      setMapping(initialMapping)

      setStep(2)
      toast.success(`Arquivo "${file.name}" processado! ${result.data.recordCount} registros encontrados.`)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Falha no upload')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  const handleTestImport = async () => {
    if (!importData) return
    if (Object.keys(mapping).length === 0) {
      toast.error("Configure ao menos um mapeamento de campo antes de testar")
      return
    }
    setExecuting(true)
    setTestResult(null)
    try {
      const sessionRes = await fetch(`/api/admin/import?sessionId=${importData.sessionId}`)
      if (!sessionRes.ok) {
        const err = await sessionRes.json()
        throw new Error(err.error || 'Sessão expirada. Faça o upload novamente.')
      }
      const sessionData = await sessionRes.json()
      let fullRows = sessionData.data.rows
      if (Object.keys(editedRows).length > 0) {
        fullRows = fullRows.map((row: any, i: number) =>
          editedRows[i] ? { ...row, ...editedRows[i] } : row
        )
      }
      const response = await fetch('/api/admin/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapping,
          data: fullRows,
          targetStudio: selectedStudio,
          importType,
          standardizeForAkaai,
          defaultCategory: defaultCategory.trim() || "geral",
          dryRun: true,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha no teste')
      }
      const result = await response.json()
      setTestResult({
        wouldImport: result.data.wouldImport,
        preview: result.data.preview || [],
        message: result.data.message || `Simulação: ${result.data.wouldImport} registros prontos para importar.`,
        professionalHeaders: result.data.professionalHeaders,
      })
      toast.success("Teste concluído! Revise o preview antes de importar.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no teste')
    } finally {
      setExecuting(false)
    }
  }

  const handleExecuteImport = async () => {
    if (!importData) return

    if (Object.keys(mapping).length === 0) {
      toast.error("Configure ao menos um mapeamento de campo antes de importar")
      return
    }

    setExecuting(true)

    try {
      // Buscar dataset completo do servidor usando sessionId
      const sessionRes = await fetch(`/api/admin/import?sessionId=${importData.sessionId}`)
      if (!sessionRes.ok) {
        const err = await sessionRes.json()
        throw new Error(err.error || 'Sessão de importação expirada. Faça o upload novamente.')
      }
      const sessionData = await sessionRes.json()
      let fullRows = sessionData.data.rows
      if (Object.keys(editedRows).length > 0) {
        fullRows = fullRows.map((row: any, i: number) =>
          editedRows[i] ? { ...row, ...editedRows[i] } : row
        )
      }

      const response = await fetch('/api/admin/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapping,
          data: fullRows,
          targetStudio: selectedStudio,
          importType,
          standardizeForAkaai,
          defaultCategory: defaultCategory.trim() || "geral",
          dryRun: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha na importação')
      }

      const result = await response.json()
      setImportResult(result.data)
      setTestResult(null)
      setStep(3)
      toast.success(`${result.data.imported} registros importados com sucesso!`)
      if (result.data.errors > 0) {
        toast.warning(`${result.data.errors} registros não puderam ser importados.`)
      }

    } catch (error) {
      console.error('Import execute error:', error)
      toast.error(error instanceof Error ? error.message : 'Falha na importação')
    } finally {
      setExecuting(false)
    }
  }

  const handleDownloadReport = () => {
    if (!importResult) return
    const lines = [
      `Relatório de Importação — ${new Date().toLocaleString('pt-BR')}`,
      `Arquivo: ${importData?.fileName}`,
      `Total processado: ${importData?.recordCount}`,
      `Importados com sucesso: ${importResult.imported}`,
      `Erros: ${importResult.errors}`,
      '',
      'Detalhes de Erros:',
      ...importResult.details,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-importacao-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-500'
    if (confidence >= 0.6) return 'text-amber-500'
    return 'text-red-500'
  }

  const getImportContext = () => {
    if (!importData) return undefined
    return {
      headers: importData.headers,
      sample: importData.sample,
      mapping,
      importType,
      dataQuality: importData.analysis?.dataQuality,
      errors: importData.analysis?.dataQuality?.issues || [],
    }
  }

  const sendCatarinaMessage = async () => {
    const msg = catarinaInput.trim()
    if (!msg || catarinaLoading) return
    setCatarinaInput("")
    setCatarinaMessages((prev) => [...prev, { role: "user", content: msg }])
    setCatarinaLoading(true)
    try {
      const res = await fetch("/api/admin/catarina/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          history: catarinaMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          importContext: getImportContext(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao conectar")
      setCatarinaMessages((prev) => [...prev, { role: "assistant", content: json.response || "Sem resposta." }])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao falar com a Catarina")
      setCatarinaMessages((prev) => [...prev, { role: "assistant", content: `Erro: ${e instanceof Error ? e.message : "Não foi possível obter resposta."}` }])
    } finally {
      setCatarinaLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-10 bg-black">
      <AdminHeader title="Importação Universal de Dados" />

      <div className="p-8 max-w-[1400px] mx-auto w-full">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="studio-select">Estúdio Destino</Label>
                <Select value={selectedStudio} onValueChange={setSelectedStudio}>
                  <SelectTrigger id="studio-select" className="bg-white/5 border-white/10">
                    <SelectValue placeholder={loadingStudios ? "Carregando..." : "Selecione o estúdio"} />
                  </SelectTrigger>
                  <SelectContent>
                    {studios.map(studio => (
                      <SelectItem key={studio.id} value={studio.id}>
                        {studio.name}
                      </SelectItem>
                    ))}
                    {!loadingStudios && studios.length === 0 && (
                      <SelectItem value="__none__" disabled>Nenhum estúdio encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="import-type-select">Tipo de Importação</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger id="import-type-select" className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Clientes (quem comprou/visitou — CRM)</SelectItem>
                    <SelectItem value="students">Alunos (recorrentes, ativos)</SelectItem>
                    <SelectItem value="payments">Pagamentos</SelectItem>
                    <SelectItem value="products">Produtos</SelectItem>
                    <SelectItem value="services">Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl shadow-xl shadow-violet-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5 text-violet-400" />
                  Upload do Arquivo
                </CardTitle>
                <CardDescription className="text-white/50">
                  Clique para selecionar arquivos (Excel, CSV, JSON, XML, TXT). Use o modelo CRM padrão para importar contatos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-400/50 hover:bg-violet-500/5 transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file && fileInputRef.current) {
                      const dt = new DataTransfer()
                      dt.items.add(file)
                      fileInputRef.current.files = dt.files
                      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx,.csv,.json,.xml,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-violet-400" />
                  <p className="text-white mb-2">Arraste e solte ou clique para selecionar</p>
                  <p className="text-white/50 text-sm">
                    Formatos: XLSX, XLS, CSV, JSON, XML, TXT (máx 50MB)
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                    {(importType === "customers" || importType === "students") && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20"
                        onClick={() => {
                          const headers = getProfessionalHeaders()
                          const csv = headers.join(";") + "\n" + headers.map(() => "").join(";")
                          const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = "modelo-crm-contatos.csv"
                          a.click()
                          URL.revokeObjectURL(url)
                          toast.success("Modelo CRM baixado!")
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar modelo CRM
                      </Button>
                    )}
                  </div>
                </div>

                {uploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="bg-white/10" />
                    <p className="text-white/50 text-sm mt-2">
                      {uploadProgress < 50 ? 'Enviando arquivo...' : uploadProgress < 90 ? 'Analisando dados...' : 'Finalizando...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && importData && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Mapeamento de Campos</h2>
                <p className="text-white/50">
                  Arquivo: {importData.fileName} ({importData.recordCount} registros)
                </p>
              </div>
              <div className="flex gap-3">
                <Sheet open={catarinaOpen} onOpenChange={setCatarinaOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Perguntar à Catarina
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg bg-zinc-900 border-white/10 flex flex-col p-0">
                    <SheetHeader className="p-4 border-b border-white/10">
                      <SheetTitle className="text-white">Catarina — Ajuda na Importação</SheetTitle>
                      <SheetDescription className="text-white/50">
                        Pergunte sobre mapeamento, correção de erros ou formatação. A IA tem contexto do seu arquivo.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {catarinaMessages.length === 0 && (
                        <p className="text-white/50 text-sm">
                          Ex: &quot;Como mapear a coluna X?&quot;, &quot;Por que o email da linha 5 está inválido?&quot;, &quot;Como corrigir os telefones?&quot;
                        </p>
                      )}
                      {catarinaMessages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              m.role === "user"
                                ? "bg-violet-500/30 text-white"
                                : "bg-white/10 text-white/90"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {catarinaLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 rounded-lg px-3 py-2 text-white/50 text-sm">
                            Catarina está pensando...
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-white/10 flex gap-2">
                      <Input
                        value={catarinaInput}
                        onChange={(e) => setCatarinaInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendCatarinaMessage()}
                        placeholder="Sua pergunta..."
                        className="bg-white/5 border-white/10 text-white flex-1"
                        disabled={catarinaLoading}
                      />
                      <Button
                        onClick={sendCatarinaMessage}
                        disabled={catarinaLoading || !catarinaInput.trim()}
                        size="icon"
                        className="shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button variant="outline" onClick={resetState}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Novo Upload
                </Button>
                <Button
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20"
                  onClick={handleTestImport}
                  disabled={executing}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Testar importação
                </Button>
                <Button onClick={() => handleExecuteImport()} disabled={executing}>
                  {executing ? (
                    <>Importando {importData.recordCount} registros...</>
                  ) : (
                    <>Executar Importação <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>

            {/* Opções de importação */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl shadow-xl shadow-violet-500/5">
              <CardHeader>
                <CardTitle className="text-white text-base">Opções de Importação</CardTitle>
                <CardDescription className="text-white/50">
                  Configure como os dados serão processados antes de inserir no CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="standardize"
                    checked={standardizeForAkaai}
                    onCheckedChange={(v) => setStandardizeForAkaai(!!v)}
                    className="border-white/20 data-[state=checked]:bg-violet-500"
                  />
                  <Label htmlFor="standardize" className="flex items-center gap-2 text-white cursor-pointer">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Padronizar dados para AKAAI CORE
                  </Label>
                </div>
                <p className="text-white/50 text-sm ml-6">
                  Normaliza telefones, emails, CPF/CNPJ, datas e nomes para o formato esperado pelo CRM. Todos os registros são importados preservando o conteúdo disponível.
                </p>

                {(importType === "customers" || importType === "students") && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <Label htmlFor="defaultCategory" className="text-white">
                      Tipo de cliente / Categoria padrão
                    </Label>
                    <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                      <SelectTrigger id="defaultCategory" className="bg-white/5 border-white/10 text-white max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        <SelectItem value="marketplace">Marketplace (comprou via marketplace)</SelectItem>
                        <SelectItem value="curso">Curso (comprou curso)</SelectItem>
                        <SelectItem value="aula_experimental">Aula experimental</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-white/50 text-sm">
                      Usada quando não há coluna de categoria no arquivo ou o valor está vazio
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {testResult && (
              <Card className="bg-emerald-500/10 backdrop-blur-sm border-emerald-500/30 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="w-5 h-5" />
                    Teste de importação
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {testResult.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white">
                    <span className="font-bold text-emerald-400">{testResult.wouldImport}</span> registros prontos para importar.
                  </p>
                  {testResult.preview.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            {(testResult.professionalHeaders || Object.keys(testResult.preview[0] || {}).filter(k => !['studio_id', 'metadata'].includes(k))).map((k) => (
                              <th key={k} className="text-left p-2 text-white/70 font-medium whitespace-nowrap">
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.preview.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/5">
                              {(testResult.professionalHeaders || Object.keys(testResult.preview[0] || {}).filter(k => !['studio_id', 'metadata'].includes(k))).map((k) => (
                                <td key={k} className="p-2 text-white/80 truncate max-w-[140px] whitespace-nowrap">
                                  {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-white/60 text-sm">
                    Se o preview está correto, clique em &quot;Executar Importação&quot; para enviar ao CRM.
                  </p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="bg-white/10 rounded-xl">
                <TabsTrigger value="analysis" className="text-white">
                  <Brain className="w-4 h-4 mr-2" />
                  Análise IA
                </TabsTrigger>
                <TabsTrigger value="mapping" className="text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Mapeamento
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Qualidade dos Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Completude', value: importData.analysis.dataQuality.completeness },
                        { label: 'Consistência', value: importData.analysis.dataQuality.consistency },
                        { label: 'Validade', value: importData.analysis.dataQuality.validity },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm text-white/50 mb-1">
                            <span>{label}</span>
                            <span>{Math.max(0, value).toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.max(0, Math.min(100, value))} className="bg-white/10" />
                        </div>
                      ))}
                    </div>

                    {importData.analysis.dataQuality.issues.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {importData.analysis.dataQuality.issues.slice(0, 5).map((issue, i) => (
                              <div key={i} className="text-sm">{issue}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Detecção de Entidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-violet-400 border-violet-400">
                        {importData.analysis.detectedEntityType}
                      </Badge>
                      <span className={`text-sm ${getConfidenceColor(importData.analysis.confidence)}`}>
                        Confiança: {(importData.analysis.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {importData.analysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Mapeamento Sugerido</CardTitle>
                        <CardDescription className="text-white/50">
                          A IA mapeou automaticamente. Confirme ou ajuste se necessário.
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const autoMapping: Record<string, string> = {}
                          importData.analysis.suggestedMappings.forEach((m: any) => {
                            if (m.confidence > 0.5) autoMapping[m.targetField] = m.sourceField
                          })
                          setMapping(autoMapping)
                          toast.success("Mapeamento automático aplicado!")
                        }}
                        className="border-violet-500/50 text-violet-300"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Aplicar mapeamento automático
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {importData.analysis.suggestedMappings.map((suggestion, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                          <div className="flex-1">
                            <div className="text-white font-medium">{suggestion.sourceField}</div>
                            <div className="text-white/50 text-sm">{suggestion.sampleValue}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/50 shrink-0" />
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {CRM_FIELD_TO_LABEL[suggestion.targetField] || suggestion.targetField}
                            </div>
                            <div className="text-white/50 text-sm">{suggestion.dataType}</div>
                          </div>
                          <div className={`text-sm shrink-0 ${getConfidenceColor(suggestion.confidence)}`}>
                            {(suggestion.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Preview dos Dados</CardTitle>
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/50">
                        Primeiros 10 registros — edite para corrigir erros antes de importar (total: {importData.recordCount})
                      </CardDescription>
                      {Object.keys(editedRows).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditedRows({})}
                          className="text-white/50 hover:text-white"
                        >
                          Limpar correções
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {importData.headers.map((header, i) => (
                              <th key={i} className="text-left p-2 text-white/70 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importData.sample.map((row, i) => (
                            <tr key={i} className="border-b border-white/5">
                              {importData.headers.map((header, j) => {
                                const val = editedRows[i]?.[header] ?? (row[header] !== undefined && row[header] !== null ? String(row[header]) : '')
                                return (
                                  <td key={j} className="p-1">
                                    <Input
                                      value={val}
                                      onChange={(e) =>
                                        setEditedRows((prev) => ({
                                          ...prev,
                                          [i]: { ...prev[i], [header]: e.target.value },
                                        }))
                                      }
                                      className="h-8 text-xs bg-white/5 border-white/10 text-white max-w-[180px]"
                                    />
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && importResult && (
          <div className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl shadow-xl shadow-emerald-500/10">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white mb-2">Importação Concluída!</h2>
                <p className="text-white/50 mb-2">
                  <span className="text-emerald-400 font-bold">{importResult.imported}</span> registros importados com sucesso
                  {importResult.errors > 0 && (
                    <> · <span className="text-red-400 font-bold">{importResult.errors}</span> erros</>
                  )}
                </p>

                {importResult.details.length > 0 && (
                  <Alert className="text-left mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {importResult.details.slice(0, 10).map((d, i) => (
                          <div key={i} className="text-sm">{d}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 justify-center">
                  <Button onClick={resetState}>
                    <Upload className="w-4 h-4 mr-2" />
                    Nova Importação
                  </Button>
                  <Button variant="outline" onClick={handleDownloadReport}>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
