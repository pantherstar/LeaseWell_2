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

  let payload: { token?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!payload.token) {
    return new Response(JSON.stringify({ error: 'Invite token is required.' }), {
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Unable to load profile.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (profile.role !== 'tenant') {
    return new Response(JSON.stringify({ error: 'Only tenants can accept invites.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: invite, error: inviteError } = await supabase
    .from('tenant_invites')
    .select('id, property_id, landlord_id, email, status, expires_at')
    .eq('token', payload.token)
    .single();

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: 'Invite not found.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (invite.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Invite is no longer available.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    await supabase
      .from('tenant_invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);

    return new Response(JSON.stringify({ error: 'Invite has expired.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if ((invite.email || '').toLowerCase() !== (profile.email || '').toLowerCase()) {
    return new Response(JSON.stringify({ error: 'Invite email does not match your account.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: existingLink } = await supabase
    .from('tenant_properties')
    .select('id')
    .eq('property_id', invite.property_id)
    .eq('tenant_id', profile.id)
    .maybeSingle();

  let link = existingLink;
  if (!existingLink) {
    const { data: createdLink, error: linkError } = await supabase
      .from('tenant_properties')
      .insert([{
        property_id: invite.property_id,
        tenant_id: profile.id,
        landlord_id: invite.landlord_id,
        invite_id: invite.id,
        status: 'active'
      }])
      .select()
      .single();

    if (linkError) {
      return new Response(JSON.stringify({ error: linkError.message || 'Unable to link tenant to property.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    link = createdLink;
  }

  await supabase
    .from('tenant_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);

  const { data: property } = await supabase
    .from('properties')
    .select('address, city, state, zip_code, unit_number')
    .eq('id', invite.property_id)
    .single();

  const propertyLabel = property
    ? `${property.address}${property.unit_number ? `, ${property.unit_number}` : ''}`
    : 'your property';

  const { data: landlordProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', invite.landlord_id)
    .single();

  const tenantName = profile.full_name || profile.email || 'Tenant';

  await supabase
    .from('notifications')
    .insert([
      {
        user_id: invite.landlord_id,
        title: 'Tenant accepted invite',
        message: `${tenantName} accepted the invitation for ${propertyLabel}.`,
        type: 'lease',
        read: false,
        metadata: { property_id: invite.property_id, tenant_id: profile.id }
      },
      {
        user_id: profile.id,
        title: 'Invite accepted',
        message: `You are now connected to ${propertyLabel}. Your landlord will share the lease soon.`,
        type: 'lease',
        read: false,
        metadata: { property_id: invite.property_id }
      }
    ]);

  if (resendApiKey && resendFromEmail && landlordProfile?.email) {
    const emailHtml = `
      <div style="background:#0b1513;padding:40px 20px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
          <div style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;">
            <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">LeaseWell</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Tenant invite accepted</p>
          </div>
          <div style="padding:28px;text-align:center;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0f172a;">Invite accepted</h2>
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              ${tenantName} accepted the invitation to join ${propertyLabel}.
            </p>
            <p style="margin:0;color:#64748b;font-size:13px;">
              You can now create a lease and share documents in LeaseWell.
            </p>
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
        subject: `LeaseWell invite accepted for ${propertyLabel}`,
        html: emailHtml
      })
    });
  }

  return new Response(JSON.stringify({ success: true, link }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
