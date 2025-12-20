import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL');
const contactEmail = Deno.env.get('CONTACT_EMAIL') || 'leasewell@protonmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!resendApiKey || !resendFromEmail) {
    return new Response(JSON.stringify({ error: 'Resend is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let payload: { name?: string; email?: string; message?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { name, email, message } = payload;
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>LeaseWell Contact Form</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br />')}</p>
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
      to: [contactEmail],
      reply_to: email,
      subject: `LeaseWell Contact: ${name}`,
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

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
