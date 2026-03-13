import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createPublicERPOrder } from '@/lib/actions/erp';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    return new NextResponse("Stripe is not configured", { status: 500 });
  }

  try {
    const body = await req.json();
    const { line_items, customerInfo, storeId, orderItems, totalAmount } = body;

    if (!line_items || !customerInfo || !storeId || !orderItems || !totalAmount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create ERP Order first to get ID
    const order = await createPublicERPOrder(storeId, {
      customer_name: `${customerInfo.name} (${customerInfo.phone})`,
      total_amount: totalAmount,
      items: orderItems,
    });

    if (!order) {
        return new NextResponse("Failed to create ERP order", { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/shop/${storeId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/shop/${storeId}?canceled=true`,
      metadata: {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        store_id: storeId,
        erp_order_id: order.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logger.error('Error creating checkout session:', error);
    return new NextResponse(`Error creating checkout session: ${error.message}`, { status: 500 });
  }
}
