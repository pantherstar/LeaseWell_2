import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ensureBucket = async (supabase: ReturnType<typeof createClient>) => {
  const { data: bucket } = await supabase.storage.getBucket('documents');
  if (bucket) return;

  await supabase.storage.createBucket('documents', {
    public: false,
    fileSizeLimit: 52428800,
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  });
};

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

  let payload: {
    fileName?: string;
    fileType?: string;
    fileBase64?: string;
    propertyId?: string;
    leaseId?: string;
    documentType?: string;
    description?: string;
  } = {};

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!payload.fileName || !payload.fileBase64 || !payload.documentType) {
    return new Response(JSON.stringify({ error: 'File name, content, and document type are required.' }), {
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

  await ensureBucket(supabase);

  const fileExt = payload.fileName.split('.').pop() || 'file';
  const safeName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${authData.user.id}/${payload.propertyId || 'general'}/${crypto.randomUUID()}-${safeName}`;
  const fileBytes = Uint8Array.from(atob(payload.fileBase64), (c) => c.charCodeAt(0));

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, fileBytes, {
      contentType: payload.fileType || `application/${fileExt}`,
      upsert: false
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message || 'Upload failed.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: documentData, error: documentError } = await supabase
    .from('documents')
    .insert([{
      property_id: payload.propertyId || null,
      lease_id: payload.leaseId || null,
      uploaded_by: authData.user.id,
      file_name: payload.fileName,
      file_path: uploadData?.path || filePath,
      file_size: fileBytes.length,
      mime_type: payload.fileType || null,
      document_type: payload.documentType,
      description: payload.description || null
    }])
    .select()
    .single();

  if (documentError) {
    await supabase.storage.from('documents').remove([uploadData?.path || filePath]);
    return new Response(JSON.stringify({ error: documentError.message || 'Unable to save document.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ data: documentData }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
