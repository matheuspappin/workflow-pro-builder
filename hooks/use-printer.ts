"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner"; // Assumindo que você usa sonner ou similar
import { ESC_POS, concatBuffers, encodeText } from "@/lib/erp/printer-commands";

// Tipos para Web Serial API (estendendo globalmente ou usando aqui)
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}

interface NavigatorWithSerial extends Navigator {
  serial: {
    requestPort(options?: { filters?: { usbVendorId?: number }[] }): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  };
}

export function usePrinter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<SerialPort | null>(null);

  // Verifica suporte ao carregar
  useEffect(() => {
    const nav = navigator as unknown as NavigatorWithSerial;
    if (!nav.serial) {
      setError("Web Serial API não suportada neste navegador. Use Chrome, Edge ou Opera.");
    }
  }, []);

  // Função para conectar
  const connect = async () => {
    const nav = navigator as unknown as NavigatorWithSerial;
    if (!nav.serial) {
      toast.error("Navegador incompatível com impressoras via Serial/USB.");
      return;
    }

    try {
      // Solicita ao usuário selecionar uma porta
      const port = await nav.serial.requestPort();
      
      // Abre a conexão (baudRate 9600 é padrão para muitas impressoras térmicas, 
      // mas 115200 ou 38400 também são comuns. Idealmente configurável).
      await port.open({ baudRate: 9600 });
      
      portRef.current = port;
      setIsConnected(true);
      setError(null);
      toast.success("Impressora conectada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao conectar impressora:", err);
      // Se o usuário cancelar, não é exatamente um erro crítico
      if (err.name !== "NotFoundError") {
        setError("Falha ao conectar: " + (err.message || "Erro desconhecido"));
        toast.error("Falha na conexão com a impressora.");
      }
    }
  };

  // Função para desconectar
  const disconnect = async () => {
    if (portRef.current) {
      try {
        await portRef.current.close();
        portRef.current = null;
        setIsConnected(false);
        toast.info("Impressora desconectada.");
      } catch (err: any) {
        console.error("Erro ao desconectar:", err);
        toast.error("Erro ao fechar conexão.");
      }
    }
  };

  // Função principal de impressão
  const printReceipt = useCallback(async (content: string) => {
    if (!portRef.current || !portRef.current.writable) {
      toast.error("Impressora não conectada ou ocupada.");
      return;
    }

    setIsPrinting(true);
    const writer = portRef.current.writable.getWriter();

    try {
      // Prepara os comandos
      // 1. Inicializa
      // 2. Define alinhamento central (opcional, exemplo)
      // 3. Texto
      // 4. Pula linhas
      // 5. Corta papel
      
      const data = concatBuffers(
        ESC_POS.INIT,
        ESC_POS.ALIGN_CENTER,
        encodeText(content), // Conteúdo principal
        ESC_POS.LF, // Pula linha
        ESC_POS.LF, 
        ESC_POS.LF, // Margem final
        ESC_POS.CUT_FULL // Corta papel
      );

      await writer.write(data);
      toast.success("Enviado para impressão.");
    } catch (err: any) {
      console.error("Erro durante impressão:", err);
      toast.error("Erro ao enviar dados para impressora.");
      setError("Erro de escrita na porta serial.");
    } finally {
      writer.releaseLock();
      setIsPrinting(false);
    }
  }, [isConnected]); // Dependência de conexão

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => {
      if (portRef.current) {
        portRef.current.close().catch(console.error);
      }
    };
  }, []);

  return {
    isConnected,
    isPrinting,
    error,
    connect,
    disconnect,
    printReceipt
  };
}
