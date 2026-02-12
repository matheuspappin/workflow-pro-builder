export interface Ncm {
  code: string;
  description: string;
}

export const COMMON_NCMS: Ncm[] = [
  { code: "22011000", description: "Águas minerais naturais ou artificiais" },
  { code: "22021000", description: "Águas, incluindo as águas minerais e as águas gaseificadas, adicionadas de açúcar ou de outros edulcorantes ou aromatizadas" },
  { code: "19059090", description: "Outros produtos de padaria, pastelaria ou da indústria de bolachas e biscoitos" },
  { code: "18063110", description: "Chocolates e outras preparações alimentícias contendo cacau, recheados" },
  { code: "18063210", description: "Chocolates e outras preparações alimentícias contendo cacau, não recheados" },
  { code: "20098990", description: "Outros sucos de fruta ou de produtos hortícolas" },
  { code: "61091000", description: "Camisetas de malha de algodão" },
  { code: "61099000", description: "Camisetas de outras matérias têxteis" },
  { code: "62046200", description: "Calças, jardineiras, bermudas e shorts, de algodão" },
  { code: "61159500", description: "Meias de outras matérias têxteis (Ballet)" },
  { code: "64041100", description: "Calçados para esporte; calçados de tênis, basquetebol, ginástica, treino e semelhantes" },
  { code: "64035900", description: "Outros calçados com sola exterior de couro natural" },
];

export async function searchNcm(query: string): Promise<Ncm[]> {
  // 1. Busca local primeiro (mais rápido e garantido para itens comuns)
  const localResults = COMMON_NCMS.filter(
    ncm => 
      ncm.code.includes(query) || 
      ncm.description.toLowerCase().includes(query.toLowerCase())
  );

  // Se a query for muito curta, retorna só local para não floodar a API
  if (query.length < 3) return localResults;

  // 2. Busca na BrasilAPI
  try {
    const response = await fetch(`https://brasilapi.com.br/api/ncm/v1?search=${query}`);
    
    if (response.ok) {
      const data = await response.json();
      // A BrasilAPI retorna um array de objetos NCM. Vamos limitar a 20 resultados.
      const apiResults = data.slice(0, 20).map((item: any) => ({
        code: item.codigo,
        description: item.descricao
      }));
      
      // Combinar resultados, removendo duplicatas (pelo código)
      const combined = [...localResults, ...apiResults];
      const unique = Array.from(new Map(combined.map(item => [item.code, item])).values());
      
      return unique;
    }
  } catch (error) {
    console.warn("Erro ao buscar NCM na BrasilAPI:", error);
  }

  return localResults;
}
