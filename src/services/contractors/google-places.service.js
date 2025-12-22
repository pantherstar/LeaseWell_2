/**
 * Google Places API service for finding local contractors
 * Maps maintenance categories to Google Places business types
 */

// Map maintenance categories to Google Places types
const CATEGORY_TO_PLACE_TYPE = {
  plumbing: 'plumber',
  electrical: 'electrician',
  hvac: 'hvac_contractor',
  appliance: 'appliance_repair',
  security: 'locksmith',
  exterior: 'general_contractor',
  general: 'general_contractor'
};

/**
 * Search for local contractors using Google Places API
 * @param {Object} location - Property location { address, city, state, zip_code }
 * @param {string} category - Maintenance category
 * @param {number} radius - Search radius in meters (default: 10000 = 10km)
 * @returns {Promise<{success: boolean, data: Array|null, error: string|null}>}
 */
export const searchContractors = async (location, category = 'general', radius = 10000) => {
  try {
    // Get API key from environment (will be set in edge function)
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      // In development, return mock data
      return {
        success: true,
        data: generateMockContractors(location, category),
        error: null
      };
    }

    const placeType = CATEGORY_TO_PLACE_TYPE[category] || 'general_contractor';
    const locationQuery = `${location.address || ''}, ${location.city || ''}, ${location.state || ''} ${location.zip_code || ''}`.trim();
    
    // Use Text Search API to find contractors
    const searchQuery = `${placeType} near ${locationQuery}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=${radius}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return {
        success: false,
        error: `Google Places API error: ${data.status}`,
        data: null
      };
    }
    
    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      return {
        success: true,
        data: [],
        error: null
      };
    }
    
    // Transform Google Places results to our format
    const contractors = data.results.map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || 0,
      phone: null, // Will need to fetch details for phone
      email: null, // Not available from Places API
      types: place.types || [],
      location: place.geometry?.location || null
    }));
    
    // Fetch detailed information including phone numbers for top results
    const detailedContractors = await Promise.all(
      contractors.slice(0, 5).map(async (contractor) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${contractor.placeId}&fields=formatted_phone_number,international_phone_number&key=${apiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            contractor.phone = detailsData.result.formatted_phone_number || detailsData.result.international_phone_number || null;
          }
        } catch (error) {
          console.error('Error fetching contractor details:', error);
        }
        return contractor;
      })
    );
    
    return {
      success: true,
      data: detailedContractors,
      error: null
    };
  } catch (error) {
    console.error('Error searching contractors:', error);
    return {
      success: false,
      error: error.message || 'Failed to search contractors',
      data: null
    };
  }
};

/**
 * Generate mock contractors for development/testing
 * @param {Object} location - Property location
 * @param {string} category - Maintenance category
 * @returns {Array} Mock contractor data
 */
function generateMockContractors(location, category) {
  const categoryNames = {
    plumbing: ['ABC Plumbing', 'Quick Fix Plumbing', 'Pro Plumbers Inc', 'Reliable Plumbing Services', 'Emergency Plumbers'],
    electrical: ['Spark Electric', 'Bright Solutions', 'Master Electricians', 'Safe Wire Electric', 'Power Up Electrical'],
    hvac: ['Cool Air HVAC', 'Comfort Systems', 'Climate Control', 'Air Masters', 'Temp Solutions'],
    appliance: ['Appliance Pro', 'Fix It Fast', 'Home Appliance Repair', 'Quick Fix Appliances', 'Reliable Repairs'],
    security: ['Secure Locks', 'Lock Masters', 'Safe & Sound', 'Security Plus', 'Key Solutions'],
    exterior: ['Exterior Experts', 'Home Improvements Co', 'Outdoor Specialists', 'Property Care', 'Exterior Works'],
    general: ['Handyman Services', 'Fix It All', 'General Contractors Inc', 'Home Repair Pro', 'All Around Repairs']
  };
  
  const names = categoryNames[category] || categoryNames.general;
  
  return names.map((name, index) => ({
    placeId: `mock_place_${index}`,
    name,
    address: `${location.address || '123 Main St'}, ${location.city || 'City'}, ${location.state || 'ST'} ${location.zip_code || '12345'}`,
    rating: (4.0 + Math.random() * 1.0).toFixed(1),
    reviewCount: Math.floor(Math.random() * 200) + 10,
    phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email: null,
    types: [category],
    location: null
  }));
}

/**
 * Get contractor details by place ID
 * @param {string} placeId - Google Places place ID
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getContractorDetails = async (placeId) => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Places API key not configured',
        data: null
      };
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,rating,user_ratings_total,website&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Google Places API error: ${data.status}`,
        data: null
      };
    }
    
    return {
      success: true,
      data: data.result,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to get contractor details',
      data: null
    };
  }
};

