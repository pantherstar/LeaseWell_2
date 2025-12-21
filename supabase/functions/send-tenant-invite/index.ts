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
    <div style="background:#0b1513;padding:40px 20px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
        <div style="padding:28px 28px 20px;text-align:center;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">LeaseWell</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Modern tools for modern rentals</p>
        </div>
        <div style="padding:28px;text-align:center;">
          <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">You&apos;ve been invited</h2>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">
            ${profile.full_name || 'Your landlord'} invited you to join:
          </p>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;font-weight:600;color:#0f172a;">${propertyLabel}</p>
            <p style="margin:6px 0 0;color:#64748b;">${property.city}, ${property.state} ${property.zip_code}</p>
          </div>
          <p style="margin:0 0 18px;color:#334155;font-size:15px;">
            Create your account to access leases, payments, and documents.
          </p>
          <a href="${joinUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="margin:18px 0 0;color:#64748b;font-size:12px;">
            If the button doesn&apos;t work, paste this link into your browser:
          </p>
          <p style="margin:6px 0 0;color:#0f172a;font-size:12px;word-break:break-all;">
            ${joinUrl}
          </p>
        </div>
      </div>
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
