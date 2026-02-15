'use client';

import { useState, useTransition } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XMLParser } from 'fast-xml-parser';
import { processXmlInvoice } from '@/lib/actions/erp-import';
import { toast } from 'sonner';

interface PreviewData {
  number: string;
  total: number;
  supplier: string;
  itemsCount: number;
  installmentsCount: number;
}

export function XmlUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      toast.error('Por favor, envie um arquivo XML válido.');
      return;
    }
    
    setFile(file);
    
    // Client-side Preview
    const text = await file.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    try {
      const jsonObj = parser.parse(text);
      const nfeProc = jsonObj.nfeProc || jsonObj.NFe;
      const infNFe = nfeProc?.NFe?.infNFe || nfeProc?.infNFe;
      
      if (!infNFe) throw new Error('Estrutura inválida');

      const total = parseFloat(infNFe.total.ICMSTot.vNF);
      const supplier = infNFe.emit.xNome;
      const itemsCount = Array.isArray(infNFe.det) ? infNFe.det.length : 1;
      const installmentsCount = infNFe.cobr?.dup ? (Array.isArray(infNFe.cobr.dup) ? infNFe.cobr.dup.length : 1) : 0;

      setPreview({
        number: infNFe.ide.nNF,
        total,
        supplier,
        itemsCount,
        installmentsCount
      });
      
    } catch (e) {
      console.error(e);
      toast.error('Erro ao ler o arquivo XML. Verifique se é uma NFe válida.');
      setFile(null);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const result: any = await processXmlInvoice(formData);
      
      if (result.success) {
        toast.success(`NFe ${preview?.number} importada com sucesso!`);
        setFile(null);
        setPreview(null);
      } else {
        toast.error(result.message || 'Erro ao importar NFe.');
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Importar NFe (XML)</CardTitle>
        <CardDescription>
          Arraste o arquivo XML da nota fiscal para importar fornecedores, produtos e financeiro automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {!preview ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('xml-upload')?.click()}
          >
            <input 
              id="xml-upload" 
              type="file" 
              accept=".xml" 
              className="hidden" 
              onChange={handleChange}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="font-medium text-sm">Clique para selecionar ou arraste o arquivo aqui</p>
              <p className="text-xs text-muted-foreground">Suporta apenas arquivos .xml</p>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Nota Fiscal: {preview.number}</h4>
                  <p className="text-sm text-muted-foreground">{preview.supplier}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                Trocar Arquivo
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="font-semibold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Itens</p>
                <p className="font-medium">{preview.itemsCount} produtos</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parcelas</p>
                <p className="font-medium">{preview.installmentsCount > 0 ? `${preview.installmentsCount}x` : 'À Vista'}</p>
              </div>
            </div>

            {preview.installmentsCount > 0 && (
                <Alert className="bg-blue-50/50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Financeiro Automático</AlertTitle>
                    <AlertDescription>
                        Serão gerados {preview.installmentsCount} lançamentos em Contas a Pagar.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {preview && (
          <Button onClick={handleImport} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirmar Importação
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
