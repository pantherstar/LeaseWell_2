import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL');

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

  let payload: { propertyId?: string; message?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!payload.propertyId) {
    return new Response(JSON.stringify({ error: 'Property is required.' }), {
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

  const { data: tenantProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !tenantProfile || tenantProfile.role !== 'tenant') {
    return new Response(JSON.stringify({ error: 'Only tenants can request leases.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, address, city, state, zip_code, unit_number, landlord_id')
    .eq('id', payload.propertyId)
    .single();

  if (propertyError || !property) {
    return new Response(JSON.stringify({ error: 'Property not found.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const propertyLabel = `${property.address}${property.unit_number ? `, ${property.unit_number}` : ''}`;
  const tenantName = tenantProfile.full_name || tenantProfile.email || 'Tenant';
  const message = payload.message?.trim();

  await supabase
    .from('notifications')
    .insert([
      {
        user_id: property.landlord_id,
        title: 'Lease requested',
        message: `${tenantName} requested a lease for ${propertyLabel}.`,
        type: 'lease',
        read: false,
        metadata: { property_id: property.id, tenant_id: tenantProfile.id, note: message || null }
      },
      {
        user_id: tenantProfile.id,
        title: 'Lease request sent',
        message: `We notified your landlord about ${propertyLabel}.`,
        type: 'lease',
        read: false,
        metadata: { property_id: property.id }
      }
    ]);

  if (resendApiKey && resendFromEmail) {
    const { data: landlordProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', property.landlord_id)
      .single();

    if (landlordProfile?.email) {
      const emailHtml = `
        <div style="background:#0b1513;padding:40px 20px;font-family:Arial,sans-serif;color:#0f172a;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
            <div style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;">
              <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">LeaseWell</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Lease request</p>
            </div>
            <div style="padding:28px;text-align:center;">
              <h2 style="margin:0 0 10px;font-size:18px;color:#0f172a;">Lease requested</h2>
              <p style="margin:0 0 12px;color:#334155;font-size:15px;">
                ${tenantName} requested a lease for ${propertyLabel}.
              </p>
              ${message ? `<p style="margin:0;color:#64748b;font-size:13px;">Note: ${message}</p>` : ''}
            </div>
          </div>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [landlordProfile.email],
          subject: `Lease request for ${propertyLabel}`,
          html: emailHtml
        })
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
