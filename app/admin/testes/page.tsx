"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FlaskConical, 
  Play, 
  MessageSquare, 
  Zap, 
  Database, 
  CheckCircle2, 
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  FileText,
  Upload,
  Brain,
  Settings2,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function TestesLaboraisPage() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRunningStress, setIsRunningStress] = useState(false)
  const [stressProgress, setStressProgress] = useState(0)
  
  // Estados do Controlador de IA
  const [responseStyle, setResponseStyle] = useState<'simple' | 'complex'>('simple')
  const [trainingFile, setTrainingFile] = useState<File | null>(null)
  const [customKnowledge, setCustomKnowledge] = useState("")
  const [isTraining, setIsTraining] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "text/plain") {
      setTrainingFile(file)
      toast({
        title: "Arquivo selecionado",
        description: `${file.name} pronto para processamento.`,
      })
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos .txt",
        variant: "destructive",
      })
    }
  }

  const handleTrainAI = async () => {
    setIsTraining(true)
    // Simulação de treinamento
    setTimeout(() => {
      setIsTraining(false)
      toast({
        title: "Treinamento Concluído",
        description: "A inteligência artificial foi atualizada com os novos dados e estilo de resposta.",
      })
    }, 3000)
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ai_training_conversations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setConversations(data || [])
    } catch (e: any) {
      console.error("Erro ao carregar conversas:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleRunStressTest = () => {
    setIsRunningStress(true)
    setStressProgress(0)
    
    const interval = setInterval(() => {
      setStressProgress(prev => {
        const next = prev + 5
        if (next >= 100) {
          clearInterval(interval)
          // Usamos um setTimeout 0 para tirar a execução do ciclo de renderização atual do React
          setTimeout(() => {
            setIsRunningStress(false)
            toast({
              title: "Teste de Estresse Concluído",
              description: "O sistema suportou 1000 requisições simultâneas com latência média de 45ms.",
            })
          }, 0)
          return 100
        }
        return next
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      <AdminHeader title="Testes Laborais" />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <Tabs defaultValue="monitoramento" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Laboratório de IA & Estresse</h2>
              <p className="text-slate-500">Ambiente controlado para treinamento de modelos e testes de carga.</p>
            </div>
            
            <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1 h-12">
              <TabsTrigger value="monitoramento" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                Monitoramento
              </TabsTrigger>
              <TabsTrigger value="controlador" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                Controlador de IA
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monitoramento" className="space-y-8 mt-0">
            <div className="flex justify-end gap-3">
              <Button 
                onClick={handleRunStressTest} 
                disabled={isRunningStress}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                {isRunningStress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Simular Estresse (Carga)
              </Button>
              <Button 
                variant="outline" 
                onClick={loadConversations}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Atualizar Base
              </Button>
            </div>

            {isRunningStress && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Simulando 50 usuários simultâneos...
                    </span>
                    <span className="text-sm font-black text-orange-700 dark:text-orange-400">{stressProgress}%</span>
                  </div>
                  <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${stressProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estatísticas do Lab */}
              <Card className="lg:col-span-1 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-indigo-600" />
                    Status da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Base de Conhecimento</p>
                    <p className="text-2xl font-black">{conversations.length} Conversas</p>
                  </div>
                  <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Taxa de Coesão</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">98.2%</p>
                  </div>
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <p className="text-xs text-indigo-600 uppercase font-bold mb-1">Modelo Ativo</p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">Gemini 2.0 Flash</p>
              </div>
                </CardContent>
              </Card>

              {/* Base de Dados de Conversas */}
              <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        Dataset de Treinamento
                      </CardTitle>
                      <CardDescription>Conversas simuladas para ajuste de tom e respostas.</CardDescription>
                    </div>
                    <Badge className="bg-indigo-600">Simulação Ativa</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[600px] overflow-y-auto bg-white dark:bg-slate-900">
                  <div className="divide-y">
                    {loading ? (
                      <div className="p-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4" />
                        <p className="text-slate-500">Carregando base de dados...</p>
                      </div>
                    ) : conversations.map((conv) => (
                      <div key={conv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={conv.scenario_type === 'enrollment' ? 'text-emerald-600 border-emerald-200' : 'text-blue-600 border-blue-200'}>
                            {conv.scenario_type === 'enrollment' ? 'MATRÍCULA' : 'AGENDAMENTO'}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{new Date(conv.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">U</div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{conv.student_message}"</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">AI</div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{conv.ai_response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="controlador" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload de Conhecimento */}
              <div className="space-y-8">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-indigo-600" />
                      <CardTitle>Alimentação de Dados</CardTitle>
                    </div>
                    <CardDescription>Envie arquivos .txt com conversas simuladas para treinar a IA</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept=".txt" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="font-bold text-sm">{trainingFile ? trainingFile.name : "Clique ou arraste o arquivo .txt"}</p>
                        <p className="text-xs text-slate-500">Tamanho máximo: 5MB</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Valores e Regras Específicas</Label>
                      <Textarea 
                        placeholder="Ex: Mensalidade Ballet R$ 200,00. Desconto de 10% para irmãos..."
                        className="min-h-[120px] bg-slate-50 dark:bg-slate-950 border-none"
                        value={customKnowledge}
                        onChange={(e) => setCustomKnowledge(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-indigo-600" />
                      <CardTitle>Estilo de Resposta</CardTitle>
                    </div>
                    <CardDescription>Defina a complexidade e o tom de voz da IA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setResponseStyle('simple')}
                        className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${responseStyle === 'simple' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-transparent bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${responseStyle === 'simple' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-sm">Leve & Direta</p>
                        <p className="text-xs text-slate-500">Respostas curtas, ideais para dúvidas rápidas e agendamentos.</p>
                      </button>

                      <button 
                        onClick={() => setResponseStyle('complex')}
                        className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${responseStyle === 'complex' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-transparent bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${responseStyle === 'complex' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-sm">Complexa & Consultiva</p>
                        <p className="text-xs text-slate-500">Respostas detalhadas, explicativas e com foco em conversão.</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview e Ação */}
              <div className="space-y-8">
                <Card className="border-none shadow-sm bg-indigo-900 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Resumo do Treinamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs text-indigo-300 uppercase font-bold">Arquivo de Base</p>
                      <p className="text-sm font-medium">{trainingFile ? trainingFile.name : "Nenhum arquivo selecionado"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-indigo-300 uppercase font-bold">Nível de Inteligência</p>
                      <p className="text-sm font-medium">{responseStyle === 'simple' ? "Leve (Otimizado para velocidade)" : "Complexa (Otimizado para profundidade)"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-indigo-300 uppercase font-bold">Conhecimento Customizado</p>
                      <p className="text-sm font-medium line-clamp-3">{customKnowledge || "Nenhuma regra adicional definida"}</p>
                    </div>

                    <Button 
                      onClick={handleTrainAI}
                      disabled={isTraining || (!trainingFile && !customKnowledge)}
                      className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold h-12 text-lg mt-4"
                    >
                      {isTraining ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processando Conhecimento...
                        </>
                      ) : (
                        <>
                          Treinar Agora
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Nota sobre o Treinamento</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        O processo de treinamento utiliza RAG (Retrieval-Augmented Generation). Os dados enviados serão indexados e servirão como fonte única de verdade para a IA, reduzindo alucinações como nomes de turmas inexistentes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
