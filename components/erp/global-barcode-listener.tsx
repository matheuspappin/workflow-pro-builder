"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface GlobalBarcodeListenerProps {
  onScan: (code: string) => void;
  minLength?: number; // Tamanho mínimo para considerar válido
  debug?: boolean; // Para ver logs no console
}

export function GlobalBarcodeListener({ 
  onScan, 
  minLength = 3, 
  debug = false 
}: GlobalBarcodeListenerProps) {
  // UseRefs para manter estado mutável sem re-renderizar listener
  const buffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);
  
  // Constante de tempo: leitores de código de barras enviam teclas MUITO rápido (< 30-50ms entre teclas)
  const TIMEOUT_MS = 50; 

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Se o tempo entre teclas for muito longo, assume que é uma nova entrada (reset)
      // A menos que o buffer esteja vazio, claro.
      if (timeDiff > TIMEOUT_MS && buffer.current.length > 0) {
        if (debug) console.log("Reset buffer (timeout):", buffer.current);
        buffer.current = "";
      }

      // Ignora teclas de controle (Shift, Ctrl, Alt, etc) mas permite Enter
      if (e.key.length > 1 && e.key !== "Enter") {
        return; 
      }

      // Se for Enter, verifica se temos um código válido
      if (e.key === "Enter") {
        if (buffer.current.length >= minLength) {
          // É provável que seja um scanner
          if (debug) console.log("Scan detected:", buffer.current);
          
          // Previne o comportamento padrão do Enter (submit de form, etc)
          // APENAS se detectamos um scan válido
          e.preventDefault(); 
          
          onScan(buffer.current);
          buffer.current = ""; // Limpa após sucesso
        } else {
          // Se for muito curto, provavelmente foi o usuário apertando Enter manualmente
          buffer.current = "";
        }
        return;
      }

      // Adiciona caractere ao buffer
      // Apenas caracteres imprimíveis
      if (e.key.length === 1) {
        buffer.current += e.key;
      }
      
      lastKeyTime.current = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScan, minLength, debug, TIMEOUT_MS]);

  return null; // Componente "invisível" (headless logic)
}
