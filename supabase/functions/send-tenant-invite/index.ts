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

  if (!resendApiKey || !resendFromEmail) {
    return new Response(JSON.stringify({ error: 'Resend is not configured.' }), {
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

  let payload: { propertyId?: string; tenantEmail?: string; tenantName?: string; appUrl?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { propertyId, tenantEmail, tenantName, appUrl } = payload;
  if (!propertyId || !tenantEmail) {
    return new Response(JSON.stringify({ error: 'Property and tenant email are required.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Unable to load profile.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (profile.role !== 'landlord') {
    return new Response(JSON.stringify({ error: 'Only landlords can invite tenants.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, address, city, state, zip_code, unit_number, landlord_id')
    .eq('id', propertyId)
    .eq('landlord_id', authData.user.id)
    .single();

  if (propertyError || !property) {
    return new Response(JSON.stringify({ error: 'Property not found or unauthorized.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const inviteToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: invite, error: inviteError } = await supabase
    .from('tenant_invites')
    .insert([{
      property_id: property.id,
      landlord_id: authData.user.id,
      email: tenantEmail,
      full_name: tenantName || null,
      token: inviteToken,
      expires_at: expiresAt
    }])
    .select()
    .single();

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message || 'Failed to create invite.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const propertyLabel = `${property.address}${property.unit_number ? `, ${property.unit_number}` : ''}`;
  const joinUrl = `${appUrl || 'http://localhost:3001'}/login?invite=${inviteToken}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2>You have been invited to LeaseWell</h2>
      <p>${profile.full_name || 'Your landlord'} invited you to join the property:</p>
      <p><strong>${propertyLabel}</strong><br/>${property.city}, ${property.state} ${property.zip_code}</p>
      <p>Click below to create your account and access your lease documents:</p>
      <p><a href="${joinUrl}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;">Accept Invitation</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p>${joinUrl}</p>
    </div>
  `;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [tenantEmail],
      subject: `LeaseWell invitation for ${propertyLabel}`,
      html: emailHtml
    })
  });

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text();
    return new Response(JSON.stringify({ error: `Email failed: ${errorBody}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, invite }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
