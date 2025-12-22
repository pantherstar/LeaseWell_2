import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

// Map maintenance categories to Google Places types
const CATEGORY_TO_PLACE_TYPE: Record<string, string> = {
  plumbing: 'plumber',
  electrical: 'electrician',
  hvac: 'hvac_contractor',
  appliance: 'appliance_repair',
  security: 'locksmith',
  exterior: 'general_contractor',
  general: 'general_contractor'
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

  let payload: { maintenanceRequestId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!payload.maintenanceRequestId) {
    return new Response(JSON.stringify({ error: 'Maintenance request ID is required.' }), {
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

  // Get maintenance request with property and user details
  const { data: maintenanceRequest, error: requestError } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      property:properties(*),
      tenant:profiles!tenant_id(id, full_name, email),
      landlord:profiles!landlord_id(id, full_name, email)
    `)
    .eq('id', payload.maintenanceRequestId)
    .single();

  if (requestError || !maintenanceRequest) {
    return new Response(JSON.stringify({ error: 'Maintenance request not found.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verify user is the landlord
  if (maintenanceRequest.landlord_id !== authData.user.id) {
    return new Response(JSON.stringify({ error: 'Only the landlord can deploy the agent.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Update agent status to shopping
  await supabase
    .from('maintenance_requests')
    .update({
      agent_status: 'shopping',
      agent_started_at: new Date().toISOString()
    })
    .eq('id', payload.maintenanceRequestId);

  // Send notification that agent started
  await supabase
    .from('notifications')
    .insert([{
      user_id: maintenanceRequest.landlord_id,
      title: 'Agent started',
      message: `The contractor shopping agent has started for: ${maintenanceRequest.title}`,
      type: 'maintenance',
      read: false,
      metadata: { maintenance_request_id: payload.maintenanceRequestId }
    }]);

  try {
    // Find local contractors
    const contractors = await findLocalContractors(
      maintenanceRequest.property,
      maintenanceRequest.category || 'general'
    );

    if (contractors.length === 0) {
      await supabase
        .from('maintenance_requests')
        .update({
          agent_status: 'completed',
          agent_completed_at: new Date().toISOString()
        })
        .eq('id', payload.maintenanceRequestId);

      await supabase
        .from('notifications')
        .insert([{
          user_id: maintenanceRequest.landlord_id,
          title: 'No contractors found',
          message: `The agent could not find any contractors for: ${maintenanceRequest.title}`,
          type: 'maintenance',
          read: false,
          metadata: { maintenance_request_id: payload.maintenanceRequestId }
        }]);

      return new Response(JSON.stringify({
        success: true,
        message: 'No contractors found in the area',
        quotesCount: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Collect quotes from contractors
    const quotes = [];
    for (const contractor of contractors.slice(0, 5)) { // Limit to 5 contractors
      try {
        // Generate negotiation message
        const messageResult = await generateNegotiationMessage(
          maintenanceRequest,
          contractor,
          maintenanceRequest.property
        );

        if (!messageResult.success) {
          console.error('Failed to generate message:', messageResult.error);
          continue;
        }

        // Collect quote (simulated)
        const quoteResult = await collectQuote(
          contractor,
          messageResult.message,
          maintenanceRequest
        );

        if (quoteResult.success && quoteResult.quote) {
          // Store quote in database
          const { data: quote, error: quoteError } = await supabase
            .from('contractor_quotes')
            .insert([{
              maintenance_request_id: payload.maintenanceRequestId,
              contractor_name: quoteResult.quote.contractorName,
              contractor_phone: quoteResult.quote.contractorPhone,
              contractor_email: quoteResult.quote.contractorEmail,
              contractor_address: quoteResult.quote.contractorAddress,
              contractor_rating: quoteResult.quote.contractorRating,
              contractor_review_count: quoteResult.quote.contractorReviewCount,
              quote_amount: quoteResult.quote.quoteAmount,
              quote_notes: quoteResult.quote.quoteNotes,
              availability: quoteResult.quote.availability,
              status: 'received',
              negotiation_messages: quoteResult.quote.negotiationMessages
            }])
            .select()
            .single();

          if (!quoteError && quote) {
            quotes.push(quote);
          }
        }
      } catch (error) {
        console.error(`Error processing contractor ${contractor.name}:`, error);
        continue;
      }
    }

    // Update agent status to completed
    await supabase
      .from('maintenance_requests')
      .update({
        agent_status: 'completed',
        agent_completed_at: new Date().toISOString()
      })
      .eq('id', payload.maintenanceRequestId);

    // Send notification with quotes
    await supabase
      .from('notifications')
      .insert([{
        user_id: maintenanceRequest.landlord_id,
        title: 'Quotes ready',
        message: `The agent collected ${quotes.length} quote${quotes.length !== 1 ? 's' : ''} for: ${maintenanceRequest.title}`,
        type: 'maintenance',
        read: false,
        metadata: {
          maintenance_request_id: payload.maintenanceRequestId,
          quotes_count: quotes.length
        }
      }]);

    return new Response(JSON.stringify({
      success: true,
      message: `Collected ${quotes.length} quotes`,
      quotesCount: quotes.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Agent error:', error);
    
    // Update agent status to failed
    await supabase
      .from('maintenance_requests')
      .update({
        agent_status: 'failed',
        agent_completed_at: new Date().toISOString()
      })
      .eq('id', payload.maintenanceRequestId);

    await supabase
      .from('notifications')
      .insert([{
        user_id: maintenanceRequest.landlord_id,
        title: 'Agent failed',
        message: `The contractor shopping agent encountered an error for: ${maintenanceRequest.title}`,
        type: 'maintenance',
        read: false,
        metadata: { maintenance_request_id: payload.maintenanceRequestId }
      }]);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Agent failed to collect quotes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Find local contractors using Google Places API
 */
async function findLocalContractors(property: any, category: string): Promise<any[]> {
  const placeType = CATEGORY_TO_PLACE_TYPE[category] || 'general_contractor';
  const locationQuery = `${property.address || ''}, ${property.city || ''}, ${property.state || ''} ${property.zip_code || ''}`.trim();
  
  if (!googlePlacesApiKey) {
    // Return mock contractors for development
    return generateMockContractors(property, category);
  }

  try {
    const searchQuery = `${placeType} near ${locationQuery}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=10000&key=${googlePlacesApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return [];
    }
    
    // Transform and fetch details
    const contractors = [];
    for (const place of data.results.slice(0, 5)) {
      try {
        // Fetch phone number
        let phone = null;
        if (place.place_id) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,international_phone_number&key=${googlePlacesApiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            phone = detailsData.result.formatted_phone_number || detailsData.result.international_phone_number || null;
          }
        }
        
        contractors.push({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || null,
          reviewCount: place.user_ratings_total || 0,
          phone,
          email: null,
          types: place.types || [],
          location: place.geometry?.location || null
        });
      } catch (error) {
        console.error('Error fetching contractor details:', error);
        continue;
      }
    }
    
    return contractors;
  } catch (error) {
    console.error('Error searching contractors:', error);
    return [];
  }
}

/**
 * Generate mock contractors for development
 */
function generateMockContractors(property: any, category: string): any[] {
  const categoryNames: Record<string, string[]> = {
    plumbing: ['ABC Plumbing', 'Quick Fix Plumbing', 'Pro Plumbers Inc', 'Reliable Plumbing Services', 'Emergency Plumbers'],
    electrical: ['Spark Electric', 'Bright Solutions', 'Master Electricians', 'Safe Wire Electric', 'Power Up Electrical'],
    hvac: ['Cool Air HVAC', 'Comfort Systems', 'Climate Control', 'Air Masters', 'Temp Solutions'],
    appliance: ['Appliance Pro', 'Fix It Fast', 'Home Appliance Repair', 'Quick Fix Appliances', 'Reliable Repairs'],
    security: ['Secure Locks', 'Lock Masters', 'Safe & Sound', 'Security Plus', 'Key Solutions'],
    exterior: ['Exterior Experts', 'Home Improvements Co', 'Outdoor Specialists', 'Property Care', 'Exterior Works'],
    general: ['Handyman Services', 'Fix It All', 'General Contractors Inc', 'Home Repair Pro', 'All Around Repairs']
  };
  
  const names = categoryNames[category] || categoryNames.general;
  const address = `${property.address || '123 Main St'}, ${property.city || 'City'}, ${property.state || 'ST'} ${property.zip_code || '12345'}`;
  
  return names.map((name, index) => ({
    placeId: `mock_place_${index}`,
    name,
    address,
    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 200) + 10,
    phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email: null,
    types: [category],
    location: null
  }));
}

/**
 * Generate negotiation message using AI
 */
async function generateNegotiationMessage(request: any, contractor: any, property: any): Promise<{ success: boolean; message: string | null; error: string | null }> {
  const propertyAddress = `${property.address || ''}${property.unit_number ? `, Unit ${property.unit_number}` : ''}, ${property.city || ''}, ${property.state || ''}`.trim();
  
  const prompt = `You are a property management assistant reaching out to a contractor for a maintenance request. Generate a professional, concise message to ${contractor.name} requesting a quote.

Maintenance Request Details:
- Issue: ${request.title}
- Description: ${request.description}
- Category: ${request.category || 'general'}
- Priority: ${request.priority || 'medium'}
- Property Address: ${propertyAddress}

Contractor Information:
- Name: ${contractor.name}
- Rating: ${contractor.rating || 'N/A'}
- Reviews: ${contractor.reviewCount || 0}

Generate a friendly, professional message (2-3 sentences) that:
1. Introduces the property management company
2. Briefly describes the maintenance issue
3. Requests a quote and availability
4. Mentions the property address
5. Asks for their best price

Keep it concise and professional. Do not include any greetings or signatures, just the message body.`;

  if (!openaiApiKey && !anthropicApiKey) {
    // Return mock message
    const templates = [
      `Hello ${contractor.name}, we have a ${request.category || 'general'} maintenance issue at ${propertyAddress}. ${request.title}. We're looking for a quote and availability. Could you provide your best price?`,
      `Hi ${contractor.name}, we need a quote for a ${request.priority || 'medium'} priority ${request.category || 'general'} repair at ${propertyAddress}. The issue: ${request.title}. Please let us know your availability and pricing.`,
      `Dear ${contractor.name}, we're seeking a contractor for a maintenance request at ${propertyAddress}. Issue: ${request.title} (${request.category || 'general'}). We'd appreciate a quote and your earliest availability.`
    ];
    return {
      success: true,
      message: templates[Math.floor(Math.random() * templates.length)],
      error: null
    };
  }

  try {
    if (openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional property management assistant. Generate concise, professional messages for contractor outreach.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const message = data.choices?.[0]?.message?.content?.trim();
      
      if (!message) {
        throw new Error('No message generated from OpenAI');
      }
      
      return { success: true, message, error: null };
    } else if (anthropicApiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          system: 'You are a professional property management assistant. Generate concise, professional messages for contractor outreach.'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      
      const data = await response.json();
      const message = data.content?.[0]?.text?.trim();
      
      if (!message) {
        throw new Error('No message generated from Anthropic');
      }
      
      return { success: true, message, error: null };
    }
  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to mock message
    const templates = [
      `Hello ${contractor.name}, we have a ${request.category || 'general'} maintenance issue at ${propertyAddress}. ${request.title}. We're looking for a quote and availability. Could you provide your best price?`
    ];
    return {
      success: true,
      message: templates[0],
      error: null
    };
  }

  return { success: false, message: null, error: 'No AI API configured' };
}

/**
 * Collect quote from contractor (simulated)
 */
async function collectQuote(contractor: any, message: string, request: any): Promise<{ success: boolean; quote: any | null; error: string | null }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate quote generation
  const basePrice: Record<string, number> = {
    plumbing: 250,
    electrical: 300,
    hvac: 400,
    appliance: 200,
    security: 150,
    exterior: 500,
    general: 300
  };
  
  const categoryPrice = basePrice[request.category || 'general'] || basePrice.general;
  const priorityMultiplier: Record<string, number> = {
    low: 0.9,
    medium: 1.0,
    high: 1.2,
    emergency: 1.5
  };
  
  const multiplier = priorityMultiplier[request.priority || 'medium'] || 1.0;
  const quoteAmount = Math.round((categoryPrice * multiplier) * (0.8 + Math.random() * 0.4));
  
  const daysUntilAvailable = Math.floor(Math.random() * 7) + 1;
  const availability = `Available in ${daysUntilAvailable} day${daysUntilAvailable > 1 ? 's' : ''}`;
  
  return {
    success: true,
    quote: {
      contractorName: contractor.name,
      contractorPhone: contractor.phone,
      contractorEmail: contractor.email || null,
      contractorAddress: contractor.address,
      contractorRating: contractor.rating,
      contractorReviewCount: contractor.reviewCount,
      quoteAmount,
      quoteNotes: `Quote for ${request.title}. ${availability}.`,
      availability,
      negotiationMessages: [
        {
          role: 'sent',
          message,
          timestamp: new Date().toISOString()
        },
        {
          role: 'received',
          message: `Thank you for reaching out. We can complete this work for $${quoteAmount}. ${availability}. Please let us know if you'd like to proceed.`,
          timestamp: new Date().toISOString()
        }
      ]
    },
    error: null
  };
}

