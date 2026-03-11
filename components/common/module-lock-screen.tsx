import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { Header } from "@/components/dashboard/header"

interface ModuleLockScreenProps {
  title: string
  description: React.ReactNode
  currentPlan?: string
  upgradeUrl?: string
  upgradeText?: string
  onUpgrade?: () => void
}

export function ModuleLockScreen({
  title,
  description,
  currentPlan = "GRATUITO",
  upgradeUrl = "/dashboard/configuracoes?tab=plano",
  upgradeText = "Fazer Upgrade",
  onUpgrade
}: ModuleLockScreenProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else if (upgradeUrl) {
      window.location.href = upgradeUrl
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} />
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md p-8 border-dashed border-2 bg-muted/30">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-2">{title}</CardTitle>
          <CardDescription className="text-base mb-8">
            {description}
            <br /><br />
            Sua conta atual: <Badge variant="outline" className="font-bold uppercase">{currentPlan}</Badge>
          </CardDescription>
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
              onClick={handleUpgrade}
            >
              {upgradeText}
            </Button>
            <p className="text-[10px] text-muted-foreground italic">
              {upgradeText === "Planos e Preços"
                ? "Acesse Planos e Preços para ver os planos disponíveis e fazer upgrade."
                : "A liberação é automática após a confirmação do upgrade no banco de dados."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
