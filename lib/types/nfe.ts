export interface NFeData {
  nfeProc: {
    NFe: {
      infNFe: {
        ide: {
          nNF: string; // Número da Nota
          dhEmi: string; // Data de Emissão
        };
        emit: {
          CNPJ: string;
          xNome: string; // Razão Social
          enderEmit: {
            xLgr: string;
            nro: string;
            xBairro: string;
            xMun: string;
            UF: string;
            CEP: string;
          };
          email?: string; // Às vezes presente
        };
        det: Array<{
          prod: {
            cProd: string; // Código do Produto
            cEAN: string; // EAN
            xProd: string; // Nome
            NCM: string;
            CFOP: string;
            uCom: string; // Unidade Comercial
            qCom: number; // Quantidade
            vUnCom: number; // Valor Unitário
            vProd: number; // Valor Total
          };
        }> | { // Caso seja apenas um item, pode não ser array dependendo do parser
          prod: {
            cProd: string;
            cEAN: string;
            xProd: string;
            NCM: string;
            CFOP: string;
            uCom: string;
            qCom: number;
            vUnCom: number;
            vProd: number;
          };
        };
        cobr?: {
          dup: Array<{
            nDup: string;
            dVenc: string;
            vDup: number;
          }> | {
            nDup: string;
            dVenc: string;
            vDup: number;
          };
        };
        total: {
            ICMSTot: {
                vNF: number; // Valor Total da Nota
            }
        }
      };
    };
  };
}

export interface ParsedInvoice {
  number: string;
  issueDate: string;
  totalValue: number;
  supplier: {
    name: string;
    cnpj: string;
    address: string;
  };
  items: Array<{
    code: string;
    ean: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
  }>;
  installments: Array<{
    number: string;
    dueDate: string;
    amount: number;
  }>;
}
