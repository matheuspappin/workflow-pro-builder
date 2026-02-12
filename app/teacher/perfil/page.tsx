"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Loader2,
  Lock,
  RefreshCw,
  Award
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function TeacherPerfilPage() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [teacherData, setTeacherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[]
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (teacher) {
        setTeacherData(teacher)
        setFormData({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || "",
          specialties: teacher.specialties || []
        })
      } else {
        setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          specialties: []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherData?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          name: formData.name,
          phone: formData.phone,
          specialties: formData.specialties
        })
        .eq('id', teacherData.id)

      if (error) throw error

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso."
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return null

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-xs text-muted-foreground">Gerencie suas informações e especialidades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-slate-50 dark:border-slate-800 shadow-lg">
                    <AvatarImage src={teacherData?.avatar} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 text-2xl font-black uppercase">
                      {formData.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-all active:scale-90">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h3 className="mt-4 font-bold text-center">{formData.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">{vocabulary.provider}</p>
                
                <div className="w-full mt-6">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] font-bold uppercase text-amber-600 border border-amber-100/50">
                    <Award className="h-3.5 w-3.5" />
                    <span>Plataforma Oficial</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full text-xs h-9 border-slate-100">Alterar Senha</Button>
              <Button variant="ghost" className="w-full text-xs h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50">Sair de tudo</Button>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800 mb-6">
              <CardTitle className="text-lg">Informações</CardTitle>
              <CardDescription className="text-xs">Dados visíveis para o estúdio.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</Label>
                    <Input 
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800 border-none h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">E-mail</Label>
                    <Input 
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-slate-100 dark:bg-slate-900 border-none opacity-60 cursor-not-allowed h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">WhatsApp</Label>
                    <Input 
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="bg-slate-50 dark:bg-slate-800 border-none h-11"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Especialidades</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((spec, i) => (
                      <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 text-[10px] font-bold">
                        {spec}
                        <button 
                          type="button" 
                          className="ml-2 hover:text-indigo-900"
                          onClick={() => setFormData({...formData, specialties: formData.specialties.filter((_, idx) => idx !== i)})}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    placeholder="Adicionar (Enter)..."
                    id="new-spec"
                    className="bg-slate-50 dark:bg-slate-800 border-none h-10 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const target = e.currentTarget as HTMLInputElement
                        if (target.value && !formData.specialties.includes(target.value)) {
                          setFormData({...formData, specialties: [...formData.specialties, target.value]})
                          target.value = ""
                        }
                      }
                    }}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2 px-10 h-11 font-bold"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
