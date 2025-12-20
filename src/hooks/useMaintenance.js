import { useState, useEffect, useCallback } from 'react';
import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  subscribeToMaintenanceRequests
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';
import { mockMaintenanceRequests } from '../utils/mockData';

/**
 * Hook for managing maintenance requests
 * @param {Object} filters - Optional filters { status, priority, propertyId }
 * @returns {Object} { requests, loading, error, refetch, create, update, delete }
 */
export const useMaintenance = (filters = {}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify filters to avoid object reference issues in dependencies
  const filtersKey = JSON.stringify(filters);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use mock data if Supabase is not configured
      setRequests(mockMaintenanceRequests);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getMaintenanceRequests(JSON.parse(filtersKey));

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }, [filtersKey]);

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription if Supabase is configured
    if (isSupabaseConfigured()) {
      const subscription = subscribeToMaintenanceRequests(() => {
        // Refetch when changes occur
        fetchRequests();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchRequests]);

  const create = async (requestData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: createError } = await createMaintenanceRequest(requestData);

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Refresh requests after creation
    await fetchRequests();
    return { success: true, data };
  };

  const update = async (requestId, updates) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: updateError } = await updateMaintenanceRequest(requestId, updates);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Refresh requests after update
    await fetchRequests();
    return { success: true, data };
  };

  const remove = async (requestId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: deleteError } = await deleteMaintenanceRequest(requestId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Refresh requests after deletion
    await fetchRequests();
    return { success: true, data };
  };

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    create,
    update,
    delete: remove
  };
};

/**
 * Hook for getting a single maintenance request
 * @param {string} requestId - Maintenance request UUID
 * @returns {Object} { request, loading, error, refetch }
 */
export const useMaintenanceRequest = (requestId) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      const mockRequest = mockMaintenanceRequests.find(r => r.id === requestId);
      setRequest(mockRequest || null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getMaintenanceRequest(requestId);

    if (fetchError) {
      setError(fetchError.message);
      setRequest(null);
    } else {
      setRequest(data);
    }

    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    request,
    loading,
    error,
    refetch: fetchRequest
  };
};
