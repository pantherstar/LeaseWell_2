/**
 * AI Negotiation Service
 * Generates personalized messages for contractor outreach using AI
 */

/**
 * Generate a negotiation message for contacting a contractor
 * @param {Object} request - Maintenance request details
 * @param {Object} contractor - Contractor information
 * @param {Object} property - Property information
 * @returns {Promise<{success: boolean, message: string|null, error: string|null}>}
 */
export const generateNegotiationMessage = async (request, contractor, property) => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY;
    const useOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      // Return a mock message for development
      return {
        success: true,
        message: generateMockMessage(request, contractor, property),
        error: null
      };
    }
    
    const prompt = buildPrompt(request, contractor, property);
    
    if (useOpenAI) {
      return await generateWithOpenAI(prompt, apiKey);
    } else {
      return await generateWithAnthropic(prompt, apiKey);
    }
  } catch (error) {
    console.error('Error generating negotiation message:', error);
    return {
      success: false,
      message: null,
      error: error.message || 'Failed to generate negotiation message'
    };
  }
};

/**
 * Build the prompt for AI message generation
 */
function buildPrompt(request, contractor, property) {
  const propertyAddress = `${property.address || ''}${property.unit_number ? `, Unit ${property.unit_number}` : ''}, ${property.city || ''}, ${property.state || ''}`.trim();
  
  return `You are a property management assistant reaching out to a contractor for a maintenance request. Generate a professional, concise message to ${contractor.name} requesting a quote.

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
}

/**
 * Generate message using OpenAI API
 */
async function generateWithOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const message = data.choices?.[0]?.message?.content?.trim();
  
  if (!message) {
    throw new Error('No message generated from OpenAI');
  }
  
  return {
    success: true,
    message,
    error: null
  };
}

/**
 * Generate message using Anthropic API
 */
async function generateWithAnthropic(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  const message = data.content?.[0]?.text?.trim();
  
  if (!message) {
    throw new Error('No message generated from Anthropic');
  }
  
  return {
    success: true,
    message,
    error: null
  };
}

/**
 * Generate a mock message for development/testing
 */
function generateMockMessage(request, contractor, property) {
  const propertyAddress = `${property.address || ''}${property.unit_number ? `, Unit ${property.unit_number}` : ''}, ${property.city || ''}`.trim();
  
  const templates = [
    `Hello ${contractor.name}, we have a ${request.category || 'general'} maintenance issue at ${propertyAddress}. ${request.title}. We're looking for a quote and availability. Could you provide your best price?`,
    `Hi ${contractor.name}, we need a quote for a ${request.priority || 'medium'} priority ${request.category || 'general'} repair at ${propertyAddress}. The issue: ${request.title}. Please let us know your availability and pricing.`,
    `Dear ${contractor.name}, we're seeking a contractor for a maintenance request at ${propertyAddress}. Issue: ${request.title} (${request.category || 'general'}). We'd appreciate a quote and your earliest availability.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Simulate quote collection (for development)
 * In production, this would integrate with contractor APIs or email/SMS systems
 * @param {Object} contractor - Contractor information
 * @param {string} message - Negotiation message sent
 * @param {Object} request - Maintenance request
 * @returns {Promise<{success: boolean, quote: Object|null, error: string|null}>}
 */
export const collectQuote = async (contractor, message, request) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate quote generation based on request details
    const basePrice = getBasePriceForCategory(request.category || 'general');
    const priorityMultiplier = {
      low: 0.9,
      medium: 1.0,
      high: 1.2,
      emergency: 1.5
    }[request.priority || 'medium'] || 1.0;
    
    const quoteAmount = Math.round((basePrice * priorityMultiplier) * (0.8 + Math.random() * 0.4));
    
    // Simulate availability
    const daysUntilAvailable = Math.floor(Math.random() * 7) + 1;
    const availability = `Available in ${daysUntilAvailable} day${daysUntilAvailable > 1 ? 's' : ''}`;
    
    const quote = {
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
    };
    
    return {
      success: true,
      quote,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      quote: null,
      error: error.message || 'Failed to collect quote'
    };
  }
};

/**
 * Get base price estimate for maintenance category
 */
function getBasePriceForCategory(category) {
  const prices = {
    plumbing: 250,
    electrical: 300,
    hvac: 400,
    appliance: 200,
    security: 150,
    exterior: 500,
    general: 300
  };
  
  return prices[category] || prices.general;
}

