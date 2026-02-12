import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { updateERPOrderStatus } from '@/lib/actions/erp'; // Assumindo que esta função existe ou será criada


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
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = session.metadata;
      if (!metadata) {
        console.error("Metadata missing in checkout session", session);
        return new NextResponse("Metadata missing", { status: 400 });
      }

      const { store_id, customer_name, customer_email, customer_phone, erp_order_id } = metadata;

      if (!erp_order_id) {
        console.error("ERP Order ID missing in metadata", session);
        return new NextResponse("ERP Order ID missing", { status: 400 });
      }

      console.log("Checkout session completed for order:", session.id);
      console.log("Customer:", customer_name, customer_email, customer_phone);
      console.log("Store ID:", store_id);
      console.log("ERP Order ID:", erp_order_id);

      await updateERPOrderStatus(store_id, erp_order_id, 'paid');

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse("ok", { status: 200 });
}
