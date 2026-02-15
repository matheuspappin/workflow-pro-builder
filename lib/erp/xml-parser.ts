import { XMLParser } from 'fast-xml-parser';
import { ParsedInvoice } from '@/lib/types/nfe';

export class InvoiceParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      isArray: (name, jpath, isLeafNode, isAttribute) => { 
        // Force these fields to be arrays even if single item
        if( name === 'det') return true;
        if( name === 'dup') return true;
        return false;
      }
    });
  }

  parse(xmlContent: string): ParsedInvoice {
    try {
      const jsonObj = this.parser.parse(xmlContent);
      
      // Access the nested structure safely
      // NFe structure can vary slightly, usually inside nfeProc -> NFe -> infNFe
      const nfeProc = jsonObj.nfeProc || jsonObj.NFe; // Handle both wrapped and unwrapped
      const infNFe = nfeProc?.NFe?.infNFe || nfeProc?.infNFe;

      if (!infNFe) {
        throw new Error('Estrutura de NFe inválida: tag infNFe não encontrada.');
      }

      const ide = infNFe.ide;
      const emit = infNFe.emit;
      const det = infNFe.det; // Array thanks to isArray option
      const cobr = infNFe.cobr;
      const total = infNFe.total;

      // Map Supplier
      const supplier = {
        name: emit.xNome,
        cnpj: emit.CNPJ,
        address: `${emit.enderEmit.xLgr}, ${emit.enderEmit.nro} - ${emit.enderEmit.xBairro}, ${emit.enderEmit.xMun} - ${emit.enderEmit.UF}`
      };

      // Map Items
      const items = det.map((item: any) => ({
        code: item.prod.cProd,
        ean: item.prod.cEAN !== "SEM GTIN" ? item.prod.cEAN : "", // Handle cases with no EAN
        name: item.prod.xProd,
        quantity: parseFloat(item.prod.qCom),
        unitPrice: parseFloat(item.prod.vUnCom),
        totalPrice: parseFloat(item.prod.vProd),
        unit: item.prod.uCom
      }));

      // Map Installments (Duplicatas)
      let installments: any[] = [];
      if (cobr && cobr.dup) {
        installments = cobr.dup.map((dup: any) => ({
          number: dup.nDup,
          dueDate: dup.dVenc, // Format is usually YYYY-MM-DD
          amount: parseFloat(dup.vDup)
        }));
      }

      return {
        number: ide.nNF,
        issueDate: ide.dhEmi,
        totalValue: parseFloat(total.ICMSTot.vNF),
        supplier,
        items,
        installments
      };

    } catch (error) {
      console.error('Error parsing XML:', error);
      throw new Error('Falha ao processar o arquivo XML. Verifique se é uma NFe válida.');
    }
  }
}
