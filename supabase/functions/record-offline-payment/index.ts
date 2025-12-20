import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase service role is not configured.' }), {
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

  let payload: {
    leaseId?: string;
    amount?: number;
    method?: string;
    paymentDate?: string;
    notes?: string;
  } = {};

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { leaseId, amount, method, paymentDate, notes } = payload;
  if (!leaseId || !amount || !paymentDate || !method) {
    return new Response(JSON.stringify({ error: 'Missing payment details.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select('id, tenant_id, landlord_id')
    .eq('id', leaseId)
    .single();

  if (leaseError || !lease) {
    return new Response(JSON.stringify({ error: 'Lease not found.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (lease.tenant_id !== authData.user.id) {
    return new Response(JSON.stringify({ error: 'Only the tenant can record this payment.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const allowedMethods = ['bank_transfer', 'check', 'cash'];
  const paymentMethod = allowedMethods.includes(method) ? method : 'bank_transfer';

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([{
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      landlord_id: lease.landlord_id,
      amount,
      payment_date: paymentDate,
      due_date: paymentDate,
      status: 'pending',
      payment_method: paymentMethod,
      notes: notes || null
    }])
    .select()
    .single();

  if (paymentError) {
    return new Response(JSON.stringify({ error: paymentError.message || 'Unable to record payment.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ data: payment }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
