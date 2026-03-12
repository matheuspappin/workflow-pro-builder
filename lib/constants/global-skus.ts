export interface GlobalSku {
  sku: string;
  name: string;
  category: string;
  suggested_price?: number;
}

export const GLOBAL_SKU_LIST: GlobalSku[] = [
  // ==============================================================================
  // ENERGÉTICOS (RED BULL & MONSTER - VARIAÇÕES COMPLETAS)
  // ==============================================================================
  // Red Bull 250ml
  { sku: "9002490200035", name: "Red Bull Energy Drink 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490200530", name: "Red Bull Sugar Free 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490216920", name: "Red Bull Tropical 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490226325", name: "Red Bull Melancia 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490234856", name: "Red Bull Pitaya 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490240956", name: "Red Bull Açaí 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490238687", name: "Red Bull Coco e Açaí 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490250269", name: "Red Bull Figo e Maçã (Winter) 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490244466", name: "Red Bull Morango e Pêssego 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490257572", name: "Red Bull Pera e Canela 250ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "9002490263696", name: "Red Bull Curuba e Flor de Sabugueiro 250ml", category: "Bebidas", suggested_price: 9.00 },
  
  // Red Bull 355ml
  { sku: "9002490206655", name: "Red Bull Energy Drink 355ml", category: "Bebidas", suggested_price: 12.00 },
  { sku: "9002490206693", name: "Red Bull Sugar Free 355ml", category: "Bebidas", suggested_price: 12.00 },
  { sku: "9002490220644", name: "Red Bull Tropical 355ml", category: "Bebidas", suggested_price: 12.00 },
  { sku: "9002490234726", name: "Red Bull Melancia 355ml", category: "Bebidas", suggested_price: 12.00 },

  // Red Bull 473ml
  { sku: "9002490200752", name: "Red Bull Energy Drink 473ml", category: "Bebidas", suggested_price: 15.00 },
  { sku: "9002490200875", name: "Red Bull Sugar Free 473ml", category: "Bebidas", suggested_price: 15.00 },
  { sku: "9002490237703", name: "Red Bull Tropical 473ml", category: "Bebidas", suggested_price: 15.00 },

  // Monster
  { sku: "708470000109",  name: "Monster Energy Original 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470000123",  name: "Monster Energy Absolutely Zero 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470243018",  name: "Monster Energy Mango Loco 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470370011",  name: "Monster Energy Ultra White 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470322010",  name: "Monster Energy Ultra Violet 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470358019",  name: "Monster Energy Pacific Punch 473ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "708470350013",  name: "Monster Dragon Ice Tea Limão 473ml", category: "Bebidas", suggested_price: 8.00 },
  { sku: "708470351010",  name: "Monster Dragon Ice Tea Pêssego 473ml", category: "Bebidas", suggested_price: 8.00 },

  // ==============================================================================
  // REFRIGERANTES (COCA, AMBEV - TODAS AS EMBALAGENS)
  // ==============================================================================
  // Coca-Cola
  { sku: "7891000100103", name: "Coca-Cola Original 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7894900011517", name: "Coca-Cola Zero 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7894900010152", name: "Coca-Cola Original 600ml", category: "Bebidas", suggested_price: 7.00 },
  { sku: "7894900011609", name: "Coca-Cola Zero 600ml", category: "Bebidas", suggested_price: 7.00 },
  { sku: "7894900010015", name: "Coca-Cola Original 2L", category: "Bebidas", suggested_price: 12.00 },
  { sku: "7894900011715", name: "Coca-Cola Zero 2L", category: "Bebidas", suggested_price: 12.00 },
  { sku: "7894900092011", name: "Coca-Cola KS 290ml (Vidro)", category: "Bebidas", suggested_price: 4.50 },
  { sku: "7894900027013", name: "Coca-Cola Original 1.5L", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7894900020113", name: "Coca-Cola Original 200ml Mini", category: "Bebidas", suggested_price: 3.00 },
  { sku: "7894900020212", name: "Coca-Cola Zero 200ml Mini", category: "Bebidas", suggested_price: 3.00 },
  { sku: "7894900012552", name: "Coca-Cola Original 220ml Lata", category: "Bebidas", suggested_price: 3.50 },
  { sku: "7894900012651", name: "Coca-Cola Zero 220ml Lata", category: "Bebidas", suggested_price: 3.50 },
  { sku: "7894900012019", name: "Coca-Cola Original 2.5L", category: "Bebidas", suggested_price: 14.00 },
  { sku: "7894900010251", name: "Coca-Cola Original 1L", category: "Bebidas", suggested_price: 8.00 },

  // Fanta & Sprite & Kuat
  { sku: "7894900700077", name: "Fanta Laranja 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7894900700343", name: "Fanta Uva 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7894900709841", name: "Fanta Laranja 2L", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7894900709940", name: "Fanta Uva 2L", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7894900700244", name: "Sprite Original 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7894900701623", name: "Sprite Original 2L", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7894900030013", name: "Kuat Guaraná 2L", category: "Bebidas", suggested_price: 9.00 },
  { sku: "7894900031515", name: "Schweppes Citrus 350ml Lata", category: "Bebidas", suggested_price: 5.50 },
  { sku: "7894900031812", name: "Schweppes Tônica 350ml Lata", category: "Bebidas", suggested_price: 5.50 },

  // Guaraná Antarctica & Pepsi
  { sku: "7894900700046", name: "Guaraná Antarctica 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7891991001344", name: "Guaraná Antarctica Zero 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7891991001221", name: "Guaraná Antarctica 2L", category: "Bebidas", suggested_price: 11.00 },
  { sku: "7891991001429", name: "Guaraná Antarctica Zero 2L", category: "Bebidas", suggested_price: 11.00 },
  { sku: "7891991001306", name: "Guaraná Antarctica 600ml", category: "Bebidas", suggested_price: 6.50 },
  { sku: "7891991000675", name: "Pepsi Original 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7891991000668", name: "Pepsi Black 350ml Lata", category: "Bebidas", suggested_price: 5.00 },
  { sku: "7891991000729", name: "Pepsi Original 2L", category: "Bebidas", suggested_price: 11.00 },
  { sku: "7891991000767", name: "Pepsi Black 2L", category: "Bebidas", suggested_price: 11.00 },
  { sku: "7892840800101", name: "H2OH! Limão 500ml", category: "Bebidas", suggested_price: 6.00 },
  { sku: "7892840800118", name: "H2OH! Limão 1.5L", category: "Bebidas", suggested_price: 9.00 },
  { sku: "7892840800149", name: "H2OH! Limoneto 500ml", category: "Bebidas", suggested_price: 6.00 },

  // ==============================================================================
  // SALGADINHOS (ELMA CHIPS - VARIAÇÕES DE TAMANHO)
  // ==============================================================================
  // Lay's
  { sku: "7892840222835", name: "Batata Lays Clássica 45g", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7892840222828", name: "Batata Lays Clássica 30g", category: "Alimentos", suggested_price: 4.00 },
  { sku: "7892840222880", name: "Batata Lays Clássica 80g", category: "Alimentos", suggested_price: 10.00 },
  { sku: "7892840816928", name: "Batata Lays Clássica 140g", category: "Alimentos", suggested_price: 16.00 },
  { sku: "7892840222941", name: "Batata Lays Sour Cream 45g", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7892840222958", name: "Batata Lays Sour Cream 80g", category: "Alimentos", suggested_price: 10.00 },
  { sku: "7892840812975", name: "Batata Lays Sensações Frango Grelhado 45g", category: "Alimentos", suggested_price: 7.00 },

  // Doritos
  { sku: "7892840813354", name: "Doritos Queijo Nacho 45g", category: "Alimentos", suggested_price: 6.50 },
  { sku: "7892840813330", name: "Doritos Queijo Nacho 30g", category: "Alimentos", suggested_price: 4.50 },
  { sku: "7892840813293", name: "Doritos Queijo Nacho 84g", category: "Alimentos", suggested_price: 12.00 },
  { sku: "7892840813309", name: "Doritos Queijo Nacho 140g", category: "Alimentos", suggested_price: 18.00 },
  { sku: "7892840813262", name: "Doritos Queijo Nacho 300g (Mega)", category: "Alimentos", suggested_price: 25.00 },
  { sku: "7892840813361", name: "Doritos Sweet Chili 45g", category: "Alimentos", suggested_price: 6.50 },

  // Ruffles
  { sku: "7892840816027", name: "Ruffles Original 45g", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7892840816003", name: "Ruffles Original 85g", category: "Alimentos", suggested_price: 10.00 },
  { sku: "7892840816010", name: "Ruffles Original 145g", category: "Alimentos", suggested_price: 16.00 },
  { sku: "7892840816362", name: "Ruffles Cebola e Salsa 45g", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7892840816348", name: "Ruffles Cebola e Salsa 85g", category: "Alimentos", suggested_price: 10.00 },
  { sku: "7892840816065", name: "Ruffles Churrasco 45g", category: "Alimentos", suggested_price: 6.00 },

  // Cheetos
  { sku: "7892840813088", name: "Cheetos Requeijão 45g", category: "Alimentos", suggested_price: 5.00 },
  { sku: "7892840813040", name: "Cheetos Requeijão 85g", category: "Alimentos", suggested_price: 9.00 },
  { sku: "7892840813095", name: "Cheetos Requeijão 140g", category: "Alimentos", suggested_price: 15.00 },
  { sku: "7892840813132", name: "Cheetos Onda Requeijão 84g", category: "Alimentos", suggested_price: 9.00 },
  { sku: "7892840813156", name: "Cheetos Lua Parmesão 45g", category: "Alimentos", suggested_price: 5.00 },
  
  // Fandangos
  { sku: "7892840812067", name: "Fandangos Presunto 45g", category: "Alimentos", suggested_price: 5.00 },
  { sku: "7892840812036", name: "Fandangos Presunto 90g", category: "Alimentos", suggested_price: 9.00 },
  { sku: "7892840812043", name: "Fandangos Presunto 140g", category: "Alimentos", suggested_price: 15.00 },

  // ==============================================================================
  // CERVEJAS (AMBEV, HEINEKEN - LATA, LATÃO, LONG NECK)
  // ==============================================================================
  // Heineken
  { sku: "7891149103102", name: "Cerveja Heineken Long Neck 330ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "7896045504445", name: "Cerveja Heineken Lata 350ml", category: "Bebidas", suggested_price: 7.00 },
  { sku: "7896045505961", name: "Cerveja Heineken Lata 269ml", category: "Bebidas", suggested_price: 5.50 },
  { sku: "7896045506081", name: "Cerveja Heineken Zero Long Neck 330ml", category: "Bebidas", suggested_price: 9.00 },
  { sku: "8712000030588", name: "Cerveja Heineken Barril 5L", category: "Bebidas", suggested_price: 90.00 },

  // Budweiser
  { sku: "7891991010049", name: "Cerveja Budweiser Long Neck 330ml", category: "Bebidas", suggested_price: 8.00 },
  { sku: "7891991010063", name: "Cerveja Budweiser Lata 350ml", category: "Bebidas", suggested_price: 6.00 },
  { sku: "7891991010322", name: "Cerveja Budweiser Lata 269ml", category: "Bebidas", suggested_price: 4.50 },
  { sku: "7891991010537", name: "Cerveja Budweiser Latão 473ml", category: "Bebidas", suggested_price: 8.00 },

  // Outras Cervejas
  { sku: "7891991009142", name: "Cerveja Stella Artois Long Neck 330ml", category: "Bebidas", suggested_price: 8.00 },
  { sku: "7891991012678", name: "Cerveja Corona Extra Long Neck 330ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7891149200603", name: "Cerveja Brahma Chopp Lata 350ml", category: "Bebidas", suggested_price: 4.50 },
  { sku: "7891149105403", name: "Cerveja Brahma Chopp Latão 473ml", category: "Bebidas", suggested_price: 6.00 },
  { sku: "7891149200504", name: "Cerveja Brahma Chopp Lata 269ml", category: "Bebidas", suggested_price: 3.50 },
  { sku: "7891149000104", name: "Cerveja Skol Lata 350ml", category: "Bebidas", suggested_price: 4.50 },
  { sku: "7891149006601", name: "Cerveja Skol Latão 473ml", category: "Bebidas", suggested_price: 6.00 },
  { sku: "7891149000111", name: "Cerveja Skol Lata 269ml", category: "Bebidas", suggested_price: 3.50 },
  { sku: "7891991003010", name: "Cerveja Antarctica Original 600ml", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7891149010509", name: "Cerveja Skol 1L (Litrão)", category: "Bebidas", suggested_price: 10.00 },
  { sku: "7891149107100", name: "Cerveja Brahma 1L (Litrão)", category: "Bebidas", suggested_price: 10.00 },

  // ==============================================================================
  // MERCEARIA BÁSICA & HIGIENE (MERCADO DE BAIRRO)
  // ==============================================================================
  // Higiene Pessoal
  { sku: "7891150004504", name: "Creme Dental Colgate Tripla Ação 90g", category: "Higiene", suggested_price: 5.00 },
  { sku: "7891037746356", name: "Creme Dental Sorriso 90g", category: "Higiene", suggested_price: 3.50 },
  { sku: "7891150029514", name: "Sabonete Protex Erva Doce 85g", category: "Higiene", suggested_price: 4.50 },
  { sku: "7891022101344", name: "Sabonete Dove Original 90g", category: "Higiene", suggested_price: 4.50 },
  { sku: "7891035800234", name: "Papel Higiênico Neve (4 Rolos)", category: "Higiene", suggested_price: 12.00 },
  { sku: "7791293026604", name: "Desodorante Dove Aerosol Original 150ml", category: "Higiene", suggested_price: 18.00 },
  { sku: "7791293023801", name: "Desodorante Rexona Aerosol 150ml", category: "Higiene", suggested_price: 15.00 },
  { sku: "7891010573966", name: "Shampoo Seda Ceramidas 325ml", category: "Higiene", suggested_price: 12.00 },
  { sku: "7891010023829", name: "Condicionador Seda Ceramidas 325ml", category: "Higiene", suggested_price: 14.00 },

  // Limpeza
  { sku: "7891035900224", name: "Sabão em Pó Omo Lavagem Perfeita 800g", category: "Limpeza", suggested_price: 15.00 },
  { sku: "7896090700441", name: "Detergente Ypê Neutro 500ml", category: "Limpeza", suggested_price: 3.00 },
  { sku: "7896090701448", name: "Detergente Ypê Maçã 500ml", category: "Limpeza", suggested_price: 3.00 },
  { sku: "7896090701646", name: "Detergente Ypê Coco 500ml", category: "Limpeza", suggested_price: 3.00 },
  { sku: "7891022633005", name: "Esponja Scott Brite Multiuso (Unidade)", category: "Limpeza", suggested_price: 2.50 },
  { sku: "7891038000402", name: "Água Sanitária Ypê 1L", category: "Limpeza", suggested_price: 5.00 },
  { sku: "7896090704302", name: "Amaciante Ypê Azul 2L", category: "Limpeza", suggested_price: 12.00 },

  // Alimentos Básicos
  { sku: "7896006711113", name: "Arroz Tio João Tipo 1 1kg", category: "Alimentos", suggested_price: 8.00 },
  { sku: "7896006751119", name: "Arroz Tio João Tipo 1 5kg", category: "Alimentos", suggested_price: 35.00 },
  { sku: "7896012300216", name: "Feijão Carioca Camil 1kg", category: "Alimentos", suggested_price: 9.00 },
  { sku: "7896012306119", name: "Feijão Preto Camil 1kg", category: "Alimentos", suggested_price: 9.00 },
  { sku: "7891000366806", name: "Óleo de Soja Liza 900ml", category: "Alimentos", suggested_price: 7.00 },
  { sku: "7896005300066", name: "Açúcar Refinado União 1kg", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7891710004245", name: "Café Pilão Torrado e Moído 500g", category: "Alimentos", suggested_price: 20.00 },
  { sku: "7891710018891", name: "Café Melitta Tradicional 500g", category: "Alimentos", suggested_price: 20.00 },
  { sku: "7896004000134", name: "Macarrão Espaguete Adria 500g", category: "Alimentos", suggested_price: 5.00 },
  { sku: "7891048037004", name: "Molho de Tomate Pomarola Tradicional 340g", category: "Alimentos", suggested_price: 4.00 },
  { sku: "7896051111019", name: "Leite Condensado Moça Lata 395g", category: "Alimentos", suggested_price: 8.00 },
  { sku: "7896051113051", name: "Creme de Leite Nestlé Lata 300g", category: "Alimentos", suggested_price: 8.00 },
  { sku: "7891000070109", name: "Leite UHT Integral Ninho 1L", category: "Alimentos", suggested_price: 6.00 },
  { sku: "7898215152013", name: "Leite UHT Integral Piracanjuba 1L", category: "Alimentos", suggested_price: 5.00 },

  // --- CHOCOLATES & DOCES (EXTRAS) ---
  { sku: "7622300850630", name: "Chocolate Bis ao Leite (Caixa)", category: "Alimentos", suggested_price: 7.00 },
  { sku: "7622300850654", name: "Chocolate Bis Branco (Caixa)", category: "Alimentos", suggested_price: 7.00 },
  { sku: "7891000103302", name: "Kit Kat Ao Leite 41.5g", category: "Alimentos", suggested_price: 5.00 },
  { sku: "7891095011995", name: "Snickers Original 45g", category: "Alimentos", suggested_price: 5.00 },
  { sku: "7891008102024", name: "Bala Tic Tac Laranja", category: "Alimentos", suggested_price: 3.00 },
  { sku: "7891008102017", name: "Bala Tic Tac Menta", category: "Alimentos", suggested_price: 3.00 },
  { sku: "7622210595768", name: "Trident Hortelã 8g", category: "Alimentos", suggested_price: 3.00 },
  { sku: "7622210595805", name: "Trident Melancia 8g", category: "Alimentos", suggested_price: 3.00 },
  
  // Águas (Outras marcas)
  { sku: "7896050601337", name: "Água Mineral Bonafont 500ml", category: "Bebidas", suggested_price: 4.00 },
  { sku: "7898236370014", name: "Água Mineral Minalba Sem Gás 510ml", category: "Bebidas", suggested_price: 3.00 },
];

/** Resultado unificado de busca (Global SKU + Open Food Facts) */
export interface CatalogSearchResult {
  sku: string
  name: string
  category: string
  suggested_price?: number
  source: 'global' | 'openfoodfacts'
}

/** Normaliza texto para busca (remove acentos, hyphens, espaços extras) */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_\s]+/g, ' ')
    .trim()
}

/**
 * Busca SÍNCRONA apenas no catálogo local (GLOBAL_SKU_LIST).
 * Retorna imediatamente - use para feedback instantâneo ao digitar.
 * Aceita "coca cola", "coca-cola", "coca cola" etc.
 */
export function searchLocalCatalog(query: string): CatalogSearchResult[] {
  const q = query.trim()
  if (q.length < 2) return []

  const qNorm = normalizeForSearch(q)
  const qParts = qNorm.split(/\s+/).filter(Boolean)

  return GLOBAL_SKU_LIST.filter((p) => {
    const nameNorm = normalizeForSearch(p.name)
    const skuMatch = p.sku.includes(q)
    const nameContains = nameNorm.includes(qNorm)
    const allPartsMatch = qParts.every((part) => nameNorm.includes(part))
    return skuMatch || nameContains || allPartsMatch
  })
    .slice(0, 15)
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      suggested_price: p.suggested_price,
      source: 'global' as const,
    }))
}

/**
 * Busca produtos por nome: primeiro no catálogo local (GLOBAL_SKU_LIST),
 * depois no Open Food Facts. Retorna resultados unificados.
 * Use searchLocalCatalog para feedback instantâneo; esta função para busca completa.
 */
export async function searchCatalog(query: string): Promise<CatalogSearchResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const seen = new Set<string>()
  const results: CatalogSearchResult[] = []

  // 1. Catálogo local (instantâneo)
  const localMatches = searchLocalCatalog(query)
  for (const p of localMatches) {
    seen.add(p.sku)
    results.push(p)
  }

  // 2. Open Food Facts (API externa - pode demorar)
  const { searchOpenFoodFacts } = await import('@/lib/services/open-food-facts')
  const offResults = await searchOpenFoodFacts(query)
  for (const p of offResults) {
    if (!seen.has(p.sku)) {
      seen.add(p.sku)
      results.push({
        sku: p.sku,
        name: p.name,
        category: p.category,
        suggested_price: p.suggested_price,
        source: 'openfoodfacts',
      })
    }
  }

  return results.slice(0, 20)
}

/**
 * Obtém produto por código de barras: primeiro no catálogo local,
 * depois no Open Food Facts.
 */
export async function getProductByBarcodeFromCatalog(barcode: string): Promise<CatalogSearchResult | null> {
  const code = barcode.trim().replace(/\D/g, '')
  if (!code || code.length < 8) return null

  // 1. Busca local
  const local = GLOBAL_SKU_LIST.find((p) => p.sku === code)
  if (local) {
    return {
      sku: local.sku,
      name: local.name,
      category: local.category,
      suggested_price: local.suggested_price,
      source: 'global',
    }
  }

  // 2. Open Food Facts
  const { getProductByBarcode } = await import('@/lib/services/open-food-facts')
  const off = await getProductByBarcode(code)
  if (off) {
    return {
      sku: off.sku,
      name: off.name,
      category: off.category,
      suggested_price: off.suggested_price,
      source: 'openfoodfacts',
    }
  }

  return null
}
