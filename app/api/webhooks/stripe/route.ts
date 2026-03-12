import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';
import { emitNfeForPackagePurchase } from '@/lib/actions/nfe-emit-package-purchase';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return new NextResponse("Stripe or Webhook secret not configured", { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse("No Stripe signature in headers", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;
      
      if (!metadata) {
        logger.error("Metadata missing in checkout session", session.id);
        return new NextResponse("Metadata missing", { status: 400 });
      }

      const { invoice_id, type, studio_id, student_id, plan_id, verticalization_plan_id } = metadata;

      if (type === 'system_plan' || type === 'verticalization_plan') {
          logger.info(`✅ Pagamento de plano concluído: estúdio ${studio_id}, plano ${plan_id} (${type})`);
          const rpcParams: Record<string, string> = {
            p_invoice_id: invoice_id,
            p_plan_id: plan_id,
            p_studio_id: studio_id,
          };
          if (verticalization_plan_id) {
            rpcParams.p_verticalization_plan_id = verticalization_plan_id;
          }
          const { error: rpcError } = await supabaseAdmin.rpc('mark_studio_invoice_as_paid', rpcParams);
          if (rpcError) {
            logger.error(`Erro ao processar pagamento de plano via webhook:`, rpcError);
          }
      }
      else if (type === 'service_order') {
          logger.info(`✅ Pagamento de OS concluído: ${invoice_id}`);
          
          // 1. Atualizar o Pagamento no banco
          const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .update({ 
                status: 'paid', 
                payment_date: new Date().toISOString(),
                payment_method: 'stripe_card'
            })
            .eq('service_order_id', invoice_id);

          if (paymentError) logger.error("Erro ao atualizar pagamento da OS:", paymentError);

          // 2. Atualizar a Ordem de Serviço
          const { error: osError } = await supabaseAdmin
            .from('service_orders')
            .update({ payment_status: 'paid' })
            .eq('id', invoice_id);
          
          if (osError) logger.error("Erro ao atualizar status de pagamento na OS:", osError);
          
          // 3. Garantir que o student_id está vinculado ao pagamento se não estiver
          if (student_id) {
              await supabaseAdmin
                .from('payments')
                .update({ student_id: student_id })
                .eq('service_order_id', invoice_id)
                .is('student_id', null);
          }
      } 
      else if (type === 'package') {
          logger.info(`✅ Pagamento de Pacote concluído para o aluno: ${student_id}`);
          const sessionId = session.id;

          // Idempotência ATÔMICA: INSERT primeiro. Só quem conseguir inserir credita.
          // Evita race entre webhook + confirm-credit + retentativas do Stripe.
          const { error: insertError } = await supabaseAdmin
            .from('stripe_package_credits')
            .insert({ session_id: sessionId });

          if (insertError) {
            if (insertError.code === '23505') {
              logger.info(`[WEBHOOK] Sessão ${sessionId} já creditada (duplicata ignorada)`);
            } else {
              logger.error(`[WEBHOOK] Erro ao inserir idempotência:`, insertError);
            }
            break;
          }

          const { data: pkg } = await supabaseAdmin
            .from('lesson_packages')
            .select('lessons_count, name')
            .eq('id', invoice_id)
            .single();

          if (pkg) {
              const { error: creditError } = await supabaseAdmin.rpc('adjust_student_credits', {
                  p_student_id: student_id,
                  p_studio_id: studio_id,
                  p_amount: pkg.lessons_count
              });
              if (creditError) {
                logger.error("Erro ao adicionar créditos via webhook:", creditError);
                await supabaseAdmin.from('stripe_package_credits').delete().eq('session_id', sessionId);
              } else {
                // Registrar cobrança no financeiro (compra de pacote)
                const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
                const today = new Date().toISOString().split('T')[0];
                const refMonth = new Date().toISOString().slice(0, 7);
                const { data: payment, error: payInsertErr } = await supabaseAdmin
                  .from('payments')
                  .insert({
                    studio_id: studio_id,
                    student_id: student_id,
                    amount: amountPaid,
                    due_date: today,
                    payment_date: today,
                    status: 'paid',
                    payment_method: 'stripe_card',
                    reference_month: refMonth,
                    description: `Pacote: ${pkg.name} (${pkg.lessons_count} créditos)`,
                    payment_source: 'package_purchase',
                    reference_id: invoice_id,
                  })
                  .select('id')
                  .single();

                if (payInsertErr) {
                  logger.error('[WEBHOOK] Erro ao inserir payment:', payInsertErr);
                } else if (payment?.id) {
                  // Emissão automática de NF-e (não falha o webhook se der erro)
                  try {
                    const nfeResult = await emitNfeForPackagePurchase(payment.id, studio_id);
                    if (!nfeResult.success) {
                      logger.warn(`[WEBHOOK] NF-e não emitida automaticamente: ${nfeResult.error}. Item ficará pendente no Emissor Fiscal.`);
                    } else {
                      logger.info(`[WEBHOOK] NF-e emitida automaticamente: ${nfeResult.invoiceNumber}`);
                    }
                  } catch (nfeErr: unknown) {
                    logger.error('[WEBHOOK] Erro ao emitir NF-e (item ficará pendente):', nfeErr);
                  }
                }
              }
          }
      }
      else if (type === 'pos_sale') {
          logger.info(`✅ Venda de PDV concluída: ${studio_id}`);
          const items = JSON.parse(metadata.items_json || '[]');
          const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
          const method = metadata.payment_method || 'stripe_card';

          // 1. Criar o registro de pagamento
          const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                studio_id,
                student_id: student_id || null,
                amount: totalAmount,
                status: 'paid',
                payment_date: new Date().toISOString(),
                payment_method: method,
                description: `PDV: ${items.map((i: any) => i.name).join(', ')}`,
                reference_month: new Date().toISOString().slice(0, 7)
            })
            .select()
            .single();

          if (paymentError) logger.error("Erro ao criar pagamento de PDV via webhook:", paymentError);

          // 2. Se houver OS, atualizar status
          const serviceOrderItems = items.filter((i: any) => i.type === 'service_order');
          if (serviceOrderItems.length > 0) {
              const osIds = serviceOrderItems.map((i: any) => i.id);
              await supabaseAdmin
                .from('service_orders')
                .update({ payment_status: 'paid' })
                .in('id', osIds);
              
              // Se tiver apenas uma OS, vincula o pagamento a ela
              if (serviceOrderItems.length === 1 && payment) {
                  await supabaseAdmin
                    .from('payments')
                    .update({ service_order_id: serviceOrderItems[0].id })
                    .eq('id', payment.id);
              }
          }

          // 3. Atualizar estoque para produtos vendidos
          for (const item of items) {
              if (item.type === 'product') {
                  // Buscar saldo atual
                  const { data: prod } = await supabaseAdmin
                    .from('products')
                    .select('quantity')
                    .eq('id', item.id)
                    .single();
                  
                  if (prod) {
                      await supabaseAdmin
                        .from('products')
                        .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
                        .eq('id', item.id);
                      
                      // Registrar transação de estoque
                      await supabaseAdmin.from('inventory_transactions').insert({
                          studio_id,
                          product_id: item.id,
                          type: 'sale',
                          quantity: item.quantity,
                          reason: 'Venda PDV (Stripe)',
                          unit_price: item.price
                      });
                  }
              }
          }
      }
      else {
          // Lógica padrão para mensalidades (student_payment)
          logger.info(`✅ Pagamento de mensalidade concluído: ${invoice_id}`);
          await supabaseAdmin
            .from('payments')
            .update({ 
                status: 'paid', 
                payment_date: new Date().toISOString(),
                payment_method: 'stripe_card'
            })
            .eq('id', invoice_id);
      }

      break;
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  return new NextResponse("ok", { status: 200 });
}
