/**
 * Constantes e utilitários para impressoras térmicas ESC/POS
 */

export const ESC_POS = {
  // Inicialização
  INIT: [0x1B, 0x40],

  // Corte de papel
  CUT_FULL: [0x1D, 0x56, 0x00], // GS V 0
  CUT_PARTIAL: [0x1D, 0x56, 0x01], // GS V 1
  CUT_FEED: [0x1D, 0x56, 66, 0], // GS V 66 0 (Feed and cut)

  // Alinhamento
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],

  // Formatação de Texto
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  
  // Tamanho do texto (GS ! n)
  // n = 0 (normal), 16 (altura dupla), 32 (largura dupla), 48 (ambos)
  SIZE_NORMAL: [0x1D, 0x21, 0x00],
  SIZE_DOUBLE_HEIGHT: [0x1D, 0x21, 0x10],
  SIZE_DOUBLE_WIDTH: [0x1D, 0x21, 0x20],
  SIZE_LARGE: [0x1D, 0x21, 0x11], // Altura e largura duplas
  
  // Avanço de linha
  LF: [0x0A],
};

/**
 * Converte string para Uint8Array usando TextEncoder (UTF-8)
 * Nota: Algumas impressoras mais antigas podem precisar de codificação específica (PC850, etc),
 * mas UTF-8 é amplamente suportado em hardwares modernos ou configuráveis.
 */
export function encodeText(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * Concatena múltiplos Uint8Arrays em um único buffer para envio
 */
export function concatBuffers(...buffers: (Uint8Array | number[])[]): Uint8Array {
  // Calcular tamanho total
  let totalLength = 0;
  for (const buffer of buffers) {
    totalLength += buffer.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    const data = Array.isArray(buffer) ? new Uint8Array(buffer) : buffer;
    result.set(data, offset);
    offset += data.length;
  }

  return result;
}
