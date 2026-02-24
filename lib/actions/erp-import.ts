'use server';

import { supabase } from '@/lib/supabase'; // Using the client from lib/supabase
import { guardModule } from '@/lib/modules-server';
import { InvoiceParser } from '@/lib/erp/xml-parser';
import { revalidatePath } from 'next/cache';
import logger from '@/lib/logger';

export async function processXmlInvoice(formData: FormData) {
  try {
    // 1. Authentication & Authorization
    const { studioId } = await guardModule('financial'); // Or 'erp' if available in config, user said 'Importação Inteligente' which sounds like ERP/Financial. Let's use 'financial' as default or fallback.
    // Actually, let's use 'financial' as it is more standard in the provided list in schema (enabled_modules JSON).
    
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('Nenhum arquivo enviado.');
    }

    const xmlContent = await file.text();
    const parser = new InvoiceParser();
    const invoice = parser.parse(xmlContent);

    // 2. Process Supplier
    let supplierId: string;
    
    // Check if supplier exists by CNPJ
    const { data: existingSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('studio_id', studioId)
      .eq('cnpj', invoice.supplier.cnpj)
      .single();

    if (supplierError && supplierError.code !== 'PGRST116') {
      logger.error('Error fetching supplier:', supplierError);
      throw new Error('Erro ao verificar fornecedor.');
    }

    if (existingSupplier) {
      supplierId = existingSupplier.id;
    } else {
      // Create new supplier
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({
          studio_id: studioId,
          name: invoice.supplier.name,
          cnpj: invoice.supplier.cnpj,
          address: invoice.supplier.address,
          contact_info: 'Importado via XML'
        })
        .select('id')
        .single();

      if (createError) {
        logger.error('Error creating supplier:', createError);
        throw new Error('Erro ao cadastrar fornecedor.');
      }
      supplierId = newSupplier.id;
    }

    // 3. Check for Duplicate Invoice (Prevent double import)
    // We check accounts_payable for this invoice number from this supplier
    const { data: duplicateInvoice } = await supabase
        .from('accounts_payable')
        .select('id')
        .eq('studio_id', studioId)
        .eq('supplier_id', supplierId)
        .eq('invoice_number', invoice.number)
        .maybeSingle();

    if (duplicateInvoice) {
        return { success: false, message: `A Nota Fiscal ${invoice.number} já foi importada anteriormente.` };
    }


    // 4. Process Products & Stock
    const processedProducts = [];
    
    for (const item of invoice.items) {
      // Try to find product by Barcode (EAN) or SKU (Code)
      let productId: string | null = null;
      let currentStock = 0;
      let averageCost = 0;

      // Search query
      // Tentamos buscar com suporte a ambos os esquemas (novo/erp e antigo/inventory)
      const { data: existingProduct, error: searchError } = await supabase
        .from('products')
        .select('id, current_stock, quantity, cost_price')
        .eq('studio_id', studioId)
        .or(`barcode.eq.${item.ean},sku.eq.${item.code}`)
        .maybeSingle();

      if (searchError) {
        logger.error('Error searching product:', searchError);
      }

      if (existingProduct) {
        productId = existingProduct.id;
        // Resilience: uses current_stock if available, otherwise quantity
        currentStock = (existingProduct.current_stock !== undefined && existingProduct.current_stock !== null) 
          ? existingProduct.current_stock 
          : (existingProduct.quantity || 0);
        averageCost = Number(existingProduct.cost_price) || 0;

        // Calculate Weighted Average Cost
        const newTotalValue = (currentStock * averageCost) + item.totalPrice;
        const newTotalQty = currentStock + item.quantity;
        const newAverageCost = newTotalQty > 0 ? newTotalValue / newTotalQty : item.unitPrice;

        // Update Product
        const updateData: any = {
          cost_price: newAverageCost,
          updated_at: new Date().toISOString()
        };

        // Resilience: update both columns if they exist
        if (existingProduct.current_stock !== undefined) updateData.current_stock = newTotalQty;
        if (existingProduct.quantity !== undefined) updateData.quantity = newTotalQty;

        await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

      } else {
        // Create Product
        const insertData: any = {
          studio_id: studioId,
          name: item.name,
          barcode: item.ean || null,
          sku: item.code, // Use supplier code as SKU initially
          description: `Importado de NFe ${invoice.number}`,
          cost_price: item.unitPrice, // Initial cost
          unit: item.unit
        };

        // Insert into both columns to ensure compatibility
        insertData.price = item.unitPrice * 1.5;
        insertData.selling_price = item.unitPrice * 1.5;
        insertData.current_stock = item.quantity;
        insertData.quantity = item.quantity;

        const { data: newProduct, error: createProdError } = await supabase
          .from('products')
          .insert(insertData)
          .select('id')
          .single();

        if (createProdError) {
          logger.error(`Error creating product ${item.name}:`, createProdError);
          continue; // Skip failed product but continue invoice? Or throw? Better to log and continue/throw.
          // For now, let's log and continue to avoid full failure on one product.
        } else {
            productId = newProduct.id;
        }
      }

      if (productId) {
        // Register Stock Movement
        await supabase.from('stock_movements').insert({
          studio_id: studioId,
          product_id: productId,
          type: 'entry',
          quantity: item.quantity,
          reason: `Importação NFe ${invoice.number}`,
          reference_id: null // Could link to invoice ID if we had a dedicated invoices table, currently linking via text
        });
        
        processedProducts.push({ name: item.name, status: 'processed' });
      }
    }

    // 5. Process Finance (Accounts Payable)
    // If no installments (duplicatas), assume single payment due today or on issue date?
    // NFe usually has duplicates. If not, use total value.
    
    if (invoice.installments && invoice.installments.length > 0) {
      for (const inst of invoice.installments) {
        await supabase.from('accounts_payable').insert({
          studio_id: studioId,
          supplier_id: supplierId,
          description: `NFe ${invoice.number} - Parc ${inst.number}`,
          amount: inst.amount,
          due_date: inst.dueDate,
          status: 'pending',
          invoice_number: invoice.number
        });
      }
    } else {
      // Single entry
       await supabase.from('accounts_payable').insert({
          studio_id: studioId,
          supplier_id: supplierId,
          description: `NFe ${invoice.number} - À Vista/Única`,
          amount: invoice.totalValue,
          due_date: invoice.issueDate ? invoice.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'pending',
          invoice_number: invoice.number
        });
    }

    revalidatePath('/dashboard/erp');
    revalidatePath('/dashboard/financial');

    return { 
      success: true, 
      data: {
        supplier: invoice.supplier.name,
        productsCount: processedProducts.length,
        totalValue: invoice.totalValue
      }
    };

  } catch (error: any) {
    console.error('Process XML Error:', error);
    return { success: false, message: error.message || 'Erro desconhecido ao processar XML.' };
  }
}
