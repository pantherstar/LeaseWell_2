import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !webhookSecret) {
    return new Response('Missing configuration', { status: 500 });
  }

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        payment_date: today,
        stripe_charge_id: intent.latest_charge as string
      })
      .eq('stripe_payment_intent_id', intent.id);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from('payments')
      .update({
        status: 'failed'
      })
      .eq('stripe_payment_intent_id', intent.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
