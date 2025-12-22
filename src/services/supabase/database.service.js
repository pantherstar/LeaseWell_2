import { supabase, isSupabaseConfigured } from './client';

/**
 * Database service for all CRUD operations
 * All functions return { data, error } for consistent error handling
 */

// =====================================================
// USER CACHING - Performance optimization
// =====================================================

// Cache for current user during request lifecycle
let _currentUserCache = null;
let _currentUserCacheTime = 0;
const USER_CACHE_TTL = 5000; // 5 seconds

/**
 * Get current user with caching to avoid repeated calls
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
const getCurrentUserCached = async (userId = null) => {
  try {
    // If userId provided, use it directly
    if (userId) {
      return { user: { id: userId }, error: null };
    }

    // Check cache
    const now = Date.now();
    if (_currentUserCache && (now - _currentUserCacheTime) < USER_CACHE_TTL) {
      return { user: _currentUserCache, error: null };
    }

    // Check if Supabase is configured before making auth calls
    if (!isSupabaseConfigured()) {
      _currentUserCache = null;
      return { user: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        _currentUserCache = null;
        return { user: null, error: error || new Error('Not authenticated') };
      }

      // Update cache
      _currentUserCache = user;
      _currentUserCacheTime = now;
      return { user, error: null };
    } catch (error) {
      _currentUserCache = null;
      console.error('Error getting user from Supabase:', error);
      return { user: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  } catch (error) {
    _currentUserCache = null;
    console.error('Unexpected error in getCurrentUserCached:', error);
    return { user: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

/**
 * Clear user cache (call after sign out or user changes)
 */
export const clearUserCache = () => {
  _currentUserCache = null;
  _currentUserCacheTime = 0;
};

// =====================================================
// PROFILES
// =====================================================

/**
 * Get current user's profile
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getProfile = async (userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update current user's profile
 * @param {Object} updates - Profile fields to update
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateProfile = async (updates, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, phone, role, avatar_url, created_at, updated_at')
      .single();

    // Clear cache after update
    if (!error) {
      clearUserCache();
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// PROPERTIES
// =====================================================

/**
 * Get all properties for current user
 * Landlords see their properties, tenants see leased properties
 * @param {string} userId - Optional userId to skip getUser call
 * @param {string} userRole - Optional user role to skip profile fetch
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getProperties = async (userId = null, userRole = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    // Fetch profile and properties in parallel if role not provided
    let profilePromise;
    if (!userRole) {
      profilePromise = getProfile(user.id);
    } else {
      profilePromise = Promise.resolve({ data: { role: userRole } });
    }

    // Start properties query for landlords (most common case)
    const landlordQuery = supabase
      .from('properties')
      .select(`
        id, address, city, state, zip_code, unit_number, property_type,
        bedrooms, bathrooms, square_feet, description, amenities,
        landlord_id, created_at, updated_at,
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Start tenant query
    const tenantQuery = supabase
      .from('tenant_properties')
      .select(`
        status,
        property:properties(
          id, address, city, state, zip_code, unit_number, property_type,
          bedrooms, bathrooms, square_feet, description, amenities,
          landlord_id, created_at, updated_at,
          landlord:profiles!landlord_id(id, full_name, email, phone)
        )
      `)
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get profile to determine role
    const { data: profile } = await profilePromise;

    if (profile?.role === 'tenant') {
      const { data, error } = await tenantQuery;

      if (error) {
        return { data: null, error };
      }

      const properties = (data || [])
        .map((entry) => entry.property)
        .filter(Boolean);

      return { data: properties, error: null };
    }

    // Landlord or admin - use landlord query
    const { data, error } = await landlordQuery;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get a single property by ID
 * @param {string} propertyId - Property UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getProperty = async (propertyId) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id, address, city, state, zip_code, unit_number, property_type,
        bedrooms, bathrooms, square_feet, description, amenities,
        landlord_id, created_at, updated_at,
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .eq('id', propertyId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Create a new property (landlords only)
 * @param {Object} property - Property details
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createProperty = async (property, userId = null) => {
  try {
    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured. Please check your environment variables.') };
    }

    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') };
    }

    // Validate property data
    if (!property || typeof property !== 'object') {
      return { data: null, error: new Error('Invalid property data') };
    }

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        ...property,
        landlord_id: user.id
      }])
      .select('id, address, city, state, zip_code, unit_number, property_type, bedrooms, bathrooms, square_feet, description, amenities, landlord_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error creating property:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in createProperty:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

/**
 * Update a property
 * @param {string} propertyId - Property UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateProperty = async (propertyId, updates) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteProperty = async (propertyId) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// LEASES
// =====================================================

/**
 * Get all leases for current user
 * @param {Object} filters - Optional filters { status, propertyId }
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getLeases = async (filters = {}, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    let query = supabase
      .from('leases')
      .select(`
        id, property_id, tenant_id, landlord_id, start_date, end_date,
        monthly_rent, security_deposit, status, lease_document_url,
        terms, created_at, updated_at,
        property:properties(id, address, city, state, zip_code, unit_number),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.propertyId) {
      query = query.eq('property_id', filters.propertyId);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get a single lease by ID
 * @param {string} leaseId - Lease UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getLease = async (leaseId) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .eq('id', leaseId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Create a new lease (landlords only)
 * @param {Object} lease - Lease details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createLease = async (lease) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('leases')
      .insert([{
        ...lease,
        landlord_id: user.id
      }])
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone)
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update a lease
 * @param {string} leaseId - Lease UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateLease = async (leaseId, updates) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .update(updates)
      .eq('id', leaseId)
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone)
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a lease
 * @param {string} leaseId - Lease UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteLease = async (leaseId) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .delete()
      .eq('id', leaseId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// MAINTENANCE REQUESTS
// =====================================================

/**
 * Get all maintenance requests for current user
 * @param {Object} filters - Optional filters { status, priority, propertyId }
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getMaintenanceRequests = async (filters = {}, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    let query = supabase
      .from('maintenance_requests')
      .select(`
        id, property_id, tenant_id, landlord_id, title, description,
        priority, status, category, photos, assigned_to,
        estimated_cost, actual_cost, scheduled_date, completed_date,
        agent_status, agent_started_at, agent_completed_at,
        created_at, updated_at,
        property:properties(id, address, city, state, zip_code, unit_number),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.propertyId) {
      query = query.eq('property_id', filters.propertyId);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get a single maintenance request by ID
 * @param {string} requestId - Maintenance request UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getMaintenanceRequest = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .eq('id', requestId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Create a new maintenance request (tenants)
 * @param {Object} request - Maintenance request details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createMaintenanceRequest = async (request) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Get landlord_id from the property
    const { data: property } = await getProperty(request.property_id);
    if (!property) return { data: null, error: new Error('Property not found') };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([{
        ...request,
        tenant_id: user.id,
        landlord_id: property.landlord_id,
        status: request.status || 'pending',
        agent_status: 'pending'
      }])
      .select(`
        *,
        property:properties(*),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Send notification to landlord
    if (data) {
      const propertyLabel = `${property.address || ''}${property.unit_number ? `, ${property.unit_number}` : ''}`.trim();
      await supabase
        .from('notifications')
        .insert([{
          user_id: property.landlord_id,
          title: 'New maintenance request',
          message: `New maintenance request: ${request.title} at ${propertyLabel}`,
          type: 'maintenance',
          read: false,
          metadata: { maintenance_request_id: data.id }
        }]);
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update a maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateMaintenanceRequest = async (requestId, updates) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
      .eq('id', requestId)
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone)
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteMaintenanceRequest = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', requestId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Deploy the contractor shopping agent for a maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deployMaintenanceAgent = async (requestId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase.functions.invoke('shop-for-contractors', {
      body: { maintenanceRequestId: requestId }
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get contractor quotes for a maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getContractorQuotes = async (requestId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('contractor_quotes')
      .select('*')
      .eq('maintenance_request_id', requestId)
      .order('quote_amount', { ascending: true });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Select a contractor quote and update the maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @param {string} quoteId - Contractor quote UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const selectContractor = async (requestId, quoteId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Get the quote details
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('maintenance_request_id', requestId)
      .single();

    if (quoteError || !quote) {
      return { data: null, error: new Error('Quote not found') };
    }

    // Update the quote status to accepted
    await supabase
      .from('contractor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    // Reject all other quotes for this request
    await supabase
      .from('contractor_quotes')
      .update({ status: 'rejected' })
      .eq('maintenance_request_id', requestId)
      .neq('id', quoteId);

    // Update the maintenance request with contractor info
    const { data: updatedRequest, error: updateError } = await supabase
      .from('maintenance_requests')
      .update({
        assigned_to: quote.contractor_name,
        estimated_cost: quote.quote_amount
      })
      .eq('id', requestId)
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .single();

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Get tenant info for notification
    const { data: maintenanceRequest } = await supabase
      .from('maintenance_requests')
      .select('tenant_id, title')
      .eq('id', requestId)
      .single();

    if (maintenanceRequest) {
      // Send notification to tenant
      await supabase
        .from('notifications')
        .insert([{
          user_id: maintenanceRequest.tenant_id,
          title: 'Contractor selected',
          message: `Your landlord selected ${quote.contractor_name} for: ${maintenanceRequest.title}`,
          type: 'maintenance',
          read: false,
          metadata: { maintenance_request_id: requestId, quote_id: quoteId }
        }]);
    }

    return { data: updatedRequest, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update maintenance request agent status
 * @param {string} requestId - Maintenance request UUID
 * @param {string} status - Agent status (pending, shopping, completed, failed)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateMaintenanceAgentStatus = async (requestId, status) => {
  try {
    const updates = { agent_status: status };
    
    if (status === 'shopping') {
      updates.agent_started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.agent_completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
      .eq('id', requestId)
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// PAYMENTS
// =====================================================

/**
 * Get all payments for current user
 * @param {Object} filters - Optional filters { status, leaseId }
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getPayments = async (filters = {}, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    let query = supabase
      .from('payments')
      .select(`
        id, lease_id, tenant_id, landlord_id, amount, status,
        payment_date, due_date, payment_method, late_fee,
        stripe_payment_intent_id, created_at, updated_at,
        lease:leases(id, property_id, monthly_rent, status, property:properties(id, address)),
        tenant:profiles!tenant_id(id, full_name, email),
        landlord:profiles!landlord_id(id, full_name, email)
      `)
      .order('due_date', { ascending: false })
      .limit(100);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.leaseId) {
      query = query.eq('lease_id', filters.leaseId);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get a single payment by ID
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPayment = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        lease:leases(*, property:properties(*)),
        tenant:profiles!tenant_id(id, full_name, email),
        landlord:profiles!landlord_id(id, full_name, email)
      `)
      .eq('id', paymentId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Create a new payment record
 * Note: Typically called by backend/webhooks, not directly by users
 * @param {Object} payment - Payment details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createPayment = async (payment) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select(`
        *,
        lease:leases(*, property:properties(*))
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update a payment
 * @param {string} paymentId - Payment UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updatePayment = async (paymentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select(`
        *,
        lease:leases(*, property:properties(*))
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// DOCUMENTS
// =====================================================

/**
 * Get all documents for current user
 * @param {Object} filters - Optional filters { propertyId, leaseId, documentType }
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getDocuments = async (filters = {}, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    let query = supabase
      .from('documents')
      .select(`
        id, property_id, lease_id, document_type, file_name, file_path,
        file_size, description, uploaded_by, created_at, updated_at,
        property:properties(id, address, city, state),
        lease:leases(id, start_date, end_date),
        uploader:profiles!uploaded_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters.propertyId) {
      query = query.eq('property_id', filters.propertyId);
    }

    if (filters.leaseId) {
      query = query.eq('lease_id', filters.leaseId);
    }

    if (filters.documentType) {
      query = query.eq('document_type', filters.documentType);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Upload a document to storage and create database record
 * @param {File} file - File to upload
 * @param {Object} metadata - Document metadata { propertyId, leaseId, documentType, description }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const uploadDocument = async (file, metadata) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const readAsBase64 = (fileToRead) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Unable to read file'));
          return;
        }
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(fileToRead);
    });

    const fileBase64 = await readAsBase64(file);
    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-document', {
      body: {
        fileName: file.name,
        fileType: file.type,
        fileBase64,
        propertyId: metadata.propertyId || null,
        leaseId: metadata.leaseId || null,
        documentType: metadata.documentType,
        description: metadata.description || null
      }
    });

    if (uploadError) return { data: null, error: uploadError };

    return { data: uploadData?.data || uploadData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Download/get signed URL for a document
 * @param {string} filePath - File path in storage
 * @param {number} expiresIn - URL expiry time in seconds (default 3600)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getDocumentUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a document
 * @param {string} documentId - Document UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteDocument = async (documentId) => {
  try {
    // Get document to find file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) return { data: null, error: storageError };

    // Delete database record
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// MESSAGES
// =====================================================

/**
 * Get all messages for current user
 * @param {Object} filters - Optional filters { leaseId, unreadOnly }
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getMessages = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, email, avatar_url),
        recipient:profiles!recipient_id(id, full_name, email, avatar_url),
        lease:leases(*, property:properties(*))
      `)
      .order('created_at', { ascending: false });

    if (filters.leaseId) {
      query = query.eq('lease_id', filters.leaseId);
    }

    if (filters.unreadOnly) {
      query = query.eq('read', false).eq('recipient_id', user.id);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Send a message
 * @param {Object} message - Message details { recipientId, leaseId, subject, body }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const sendMessage = async (message) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        recipient_id: message.recipientId,
        lease_id: message.leaseId || null,
        subject: message.subject || null,
        body: message.body,
        read: false
      }])
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, email),
        recipient:profiles!recipient_id(id, full_name, email)
      `)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - Message UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// NOTIFICATIONS
// =====================================================

/**
 * Get all notifications for current user
 * @param {Object} filters - Optional filters { unreadOnly, type }
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getNotifications = async (filters = {}, userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    let query = supabase
      .from('notifications')
      .select('id, user_id, title, message, type, read, action_url, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filters.unreadOnly) {
      query = query.eq('read', false);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .select();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// TENANT PROPERTY LINKS
// =====================================================

/**
 * Get tenant property links for the current user (landlord or tenant)
 * @param {string} userId - Optional userId to skip getUser call
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getTenantPropertyLinks = async (userId = null) => {
  try {
    const { user, error: userError } = await getCurrentUserCached(userId);
    if (userError || !user) return { data: null, error: userError || new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('tenant_properties')
      .select(`
        id,
        property_id,
        tenant_id,
        landlord_id,
        status,
        created_at,
        tenant:profiles!tenant_id(id, full_name, email)
      `)
      .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .limit(100);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// STORAGE - MAINTENANCE PHOTOS
// =====================================================

/**
 * Upload maintenance photo
 * @param {File} file - Image file
 * @param {string} requestId - Maintenance request UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const uploadMaintenancePhoto = async (file, requestId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${requestId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('maintenance-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) return { data: null, error };

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance-photos')
      .getPublicUrl(data.path);

    return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Upload avatar
 * @param {File} file - Image file
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const uploadAvatar = async (file) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace existing avatar
      });

    if (error) return { data: null, error };

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    // Update profile with new avatar URL
    await updateProfile({ avatar_url: urlData.publicUrl });

    return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to maintenance request updates
 * @param {Function} callback - Function called when updates occur
 * @returns {Object} Subscription object with unsubscribe method
 */
export const subscribeToMaintenanceRequests = (callback) => {
  const subscription = supabase
    .channel('maintenance_requests_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'maintenance_requests'
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to new messages
 * @param {Function} callback - Function called when new messages arrive
 * @returns {Object} Subscription object with unsubscribe method
 */
export const subscribeToMessages = (callback) => {
  const subscription = supabase
    .channel('messages_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to notifications
 * @param {Function} callback - Function called when new notifications arrive
 * @returns {Object} Subscription object with unsubscribe method
 */
export const subscribeToNotifications = (callback) => {
  const subscription = supabase
    .channel('notifications_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      callback
    )
    .subscribe();

  return subscription;
};
