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
    propertyId?: string;
    tenantEmail?: string;
    startDate?: string;
    endDate?: string;
    monthlyRent?: number;
    securityDeposit?: number | null;
    status?: string;
  } = {};

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const {
    propertyId,
    tenantEmail,
    startDate,
    endDate,
    monthlyRent,
    securityDeposit,
    status
  } = payload;

  if (!propertyId || !tenantEmail || !startDate || !endDate || !monthlyRent) {
    return new Response(JSON.stringify({ error: 'Missing required lease fields.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile || profile.role !== 'landlord') {
    return new Response(JSON.stringify({ error: 'Only landlords can create leases.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, landlord_id')
    .eq('id', propertyId)
    .eq('landlord_id', authData.user.id)
    .single();

  if (propertyError || !property) {
    return new Response(JSON.stringify({ error: 'Property not found or unauthorized.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: tenantProfile, error: tenantError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', tenantEmail)
    .single();

  if (tenantError || !tenantProfile) {
    return new Response(JSON.stringify({ error: 'Tenant not found. Invite them to sign up first.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (tenantProfile.role !== 'tenant') {
    return new Response(JSON.stringify({ error: 'User is not registered as a tenant.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .insert([{
      property_id: property.id,
      tenant_id: tenantProfile.id,
      landlord_id: authData.user.id,
      start_date: startDate,
      end_date: endDate,
      monthly_rent: monthlyRent,
      security_deposit: securityDeposit || null,
      status: status || 'active'
    }])
    .select(`
      *,
      property:properties(*),
      tenant:profiles!tenant_id(id, full_name, email)
    `)
    .single();

  if (leaseError) {
    return new Response(JSON.stringify({ error: leaseError.message || 'Unable to create lease.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ data: lease }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
