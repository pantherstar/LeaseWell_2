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

  let payload: { propertyId?: string; tenantId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!payload.propertyId || !payload.tenantId) {
    return new Response(JSON.stringify({ error: 'Property and tenant are required.' }), {
      status: 400,
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', authData.user.id)
    .single();

  if (!profile || profile.role !== 'landlord') {
    return new Response(JSON.stringify({ error: 'Only landlords can remove tenants.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, address, unit_number, landlord_id')
    .eq('id', payload.propertyId)
    .eq('landlord_id', authData.user.id)
    .single();

  if (!property) {
    return new Response(JSON.stringify({ error: 'Property not found or unauthorized.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: link, error: linkError } = await supabase
    .from('tenant_properties')
    .update({ status: 'removed' })
    .eq('property_id', payload.propertyId)
    .eq('tenant_id', payload.tenantId)
    .select()
    .single();

  if (linkError || !link) {
    return new Response(JSON.stringify({ error: 'Unable to remove tenant.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const propertyLabel = `${property.address}${property.unit_number ? `, ${property.unit_number}` : ''}`;
  const { data: tenantProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', payload.tenantId)
    .single();

  const tenantName = tenantProfile?.full_name || tenantProfile?.email || 'Tenant';

  await supabase
    .from('notifications')
    .insert([
      {
        user_id: authData.user.id,
        title: 'Tenant removed',
        message: `${tenantName} was removed from ${propertyLabel}.`,
        type: 'lease',
        read: false,
        metadata: { property_id: property.id, tenant_id: payload.tenantId }
      },
      {
        user_id: payload.tenantId,
        title: 'Access removed',
        message: `Your access to ${propertyLabel} has been removed by the landlord.`,
        type: 'lease',
        read: false,
        metadata: { property_id: property.id }
      }
    ]);

  return new Response(JSON.stringify({ success: true, link }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
