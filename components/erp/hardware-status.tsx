"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ScanBarcode, AlertCircle, CheckCircle2, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePrinter } from "@/hooks/use-printer";
import { GlobalBarcodeListener } from "@/components/erp/global-barcode-listener";
import { useState } from "react";
import { toast } from "sonner";

export function HardwareStatus() {
  const { isConnected, error, connect, disconnect, printReceipt, isPrinting } = usePrinter();
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const handleTestPrint = () => {
    const testContent = `
    WORKFLOW AI
    --------------------------------
    TESTE DE IMPRESSAO
    --------------------------------
    Data: ${new Date().toLocaleString()}
    Status: OK
    
    Obrigado por usar nosso sistema!
    `;
    printReceipt(testContent);
  };

  const handleScan = (code: string) => {
    setLastScannedCode(code);
    toast.success(`Código detectado: ${code}`);
    // Aqui você chamaria sua API para buscar o produto
  };

  return (
    <div className="space-y-4">
      <GlobalBarcodeListener onScan={handleScan} debug={true} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Hardware PDV
          </CardTitle>
          <CardDescription>
            Gerenciamento de periféricos locais (Impressora e Leitor)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status da Impressora */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <Printer className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Impressora Térmica</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? "Conectada via Serial/USB" : "Nenhuma impressora ativa"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                  <Button variant="outline" size="sm" onClick={handleTestPrint} disabled={isPrinting}>
                    {isPrinting ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : "Teste"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={disconnect} className="text-red-500 hover:text-red-600">
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={connect}>
                  Conectar
                </Button>
              )}
            </div>
          </div>

          {/* Status do Leitor (Sempre Ativo) */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <ScanBarcode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Leitor de Código de Barras</h3>
                <p className="text-sm text-muted-foreground">
                  Modo: Emulação de Teclado (Sempre Ouvindo)
                </p>
              </div>
            </div>
            <div>
               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ativo</Badge>
            </div>
          </div>

          {lastScannedCode && (
             <Alert className="bg-green-50 border-green-200">
               <CheckCircle2 className="h-4 w-4 text-green-600" />
               <AlertTitle className="text-green-800">Última Leitura</AlertTitle>
               <AlertDescription className="text-green-700 font-mono">
                 {lastScannedCode}
               </AlertDescription>
             </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Hardware</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
