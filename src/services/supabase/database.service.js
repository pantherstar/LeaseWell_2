import { supabase } from './client';

/**
 * Database service for all CRUD operations
 * All functions return { data, error } for consistent error handling
 */

// =====================================================
// PROFILES
// =====================================================

/**
 * Get current user's profile
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getProperties = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data: profile } = await getProfile();

    if (profile?.role === 'tenant') {
      const { data, error } = await supabase
        .from('tenant_properties')
        .select(`
          status,
          property:properties(
            *,
            landlord:profiles!landlord_id(id, full_name, email, phone)
          )
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      const properties = (data || [])
        .map((entry) => entry.property)
        .filter(Boolean);

      return { data: properties, error: null };
    }

    let query = supabase
      .from('properties')
      .select(`
        *,
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (profile?.role === 'landlord') {
      query = query.eq('landlord_id', user.id);
    }

    const { data, error } = await query;
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
        *,
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
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createProperty = async (property) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        ...property,
        landlord_id: user.id
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getLeases = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('leases')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getMaintenanceRequests = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenant_id(id, full_name, email, phone),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

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
        status: request.status || 'pending'
      }])
      .select(`
        *,
        property:properties(*),
        landlord:profiles!landlord_id(id, full_name, email, phone)
      `)
      .single();

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

// =====================================================
// PAYMENTS
// =====================================================

/**
 * Get all payments for current user
 * @param {Object} filters - Optional filters { status, leaseId }
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getPayments = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('payments')
      .select(`
        *,
        lease:leases(*, property:properties(*)),
        tenant:profiles!tenant_id(id, full_name, email),
        landlord:profiles!landlord_id(id, full_name, email)
      `)
      .order('due_date', { ascending: false });

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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getDocuments = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('documents')
      .select(`
        *,
        property:properties(*),
        lease:leases(*),
        uploader:profiles!uploaded_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

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

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${metadata.propertyId || 'general'}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) return { data: null, error: uploadError };

    // Create database record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert([{
        property_id: metadata.propertyId || null,
        lease_id: metadata.leaseId || null,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        document_type: metadata.documentType,
        description: metadata.description || null
      }])
      .select()
      .single();

    if (documentError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('documents').remove([uploadData.path]);
      return { data: null, error: documentError };
    }

    return { data: documentData, error: null };
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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getNotifications = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    let query = supabase
      .from('notifications')
      .select('*')
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
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getTenantPropertyLinks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

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
      .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);

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
