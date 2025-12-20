import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return new Response(JSON.stringify({ error: 'Stripe or Supabase is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authorization token.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let payload: { leaseId?: string; currency?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { leaseId, currency = 'usd' } = payload;
  if (!leaseId) {
    return new Response(JSON.stringify({ error: 'Lease is required.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select('id, tenant_id, landlord_id, monthly_rent, landlord:profiles!landlord_id(id, stripe_account_id)')
    .eq('id', leaseId)
    .single();

  if (leaseError || !lease) {
    return new Response(JSON.stringify({ error: 'Lease not found.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (lease.tenant_id !== authData.user.id) {
    return new Response(JSON.stringify({ error: 'Only the tenant can pay this lease.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const destinationAccount = lease.landlord?.stripe_account_id;
  if (!destinationAccount) {
    return new Response(JSON.stringify({ error: 'Landlord has not connected Stripe yet.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const amountDollars = Number(lease.monthly_rent) || 0;
  const amountCents = Math.round(amountDollars * 100);
  if (amountCents <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid rent amount.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    payment_method_types: ['card', 'us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method']
        }
      }
    },
    transfer_data: {
      destination: destinationAccount
    },
    metadata: {
      lease_id: lease.id,
      tenant_id: lease.tenant_id
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  const { error: paymentError } = await supabase
    .from('payments')
    .insert([{
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      landlord_id: lease.landlord_id,
      amount: amountDollars,
      payment_date: today,
      due_date: today,
      status: 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: paymentIntent.id
    }]);

  if (paymentError) {
    return new Response(JSON.stringify({ error: paymentError.message || 'Unable to create payment.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
