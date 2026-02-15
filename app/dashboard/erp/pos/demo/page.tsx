import { HardwareStatus } from "@/components/erp/hardware-status";

export default function POSPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Frente de Caixa (PDV)</h1>
        <p className="text-muted-foreground">
          Gerencie vendas e conexão com hardware local.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Painel de Hardware */}
        <div className="md:col-span-1">
          <HardwareStatus />
        </div>

        {/* Área de Simulação de Venda */}
        <div className="md:col-span-1 p-6 border rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Carrinho Atual</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-md bg-slate-50 dark:bg-slate-900 text-muted-foreground">
            Aguardando leitura de produtos...
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Use o leitor de código de barras para adicionar itens automaticamente ou digite o código manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}
