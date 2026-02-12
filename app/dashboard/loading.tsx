import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 text-primary animate-spin" />
      <p className="text-muted-foreground font-medium">Carregando dados do sistema...</p>
    </div>
  )
}
