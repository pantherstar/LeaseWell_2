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

  return new Response(JSON.stringify({ success: true, link }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
