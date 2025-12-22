import { useState, useEffect, useCallback } from 'react';
import {
  getLeases,
  getLease,
  createLease,
  updateLease
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';
import { mockLeases } from '../utils/mockData';
import { createLeaseByEmail, deleteLeaseById } from '../services/supabase/leases.service';

/**
 * Hook for managing leases
 * @param {Object} filters - Optional filters { status, propertyId }
 * @param {boolean} skipInitialFetch - If true, skip fetching on mount (for use with unified hooks)
 * @returns {Object} { leases, loading, error, refetch, create, update, delete }
 */
export const useLeases = (filters = {}, skipInitialFetch = false) => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);

  // Stringify filters to avoid object reference issues in dependencies
  const filtersKey = JSON.stringify(filters);

  const fetchLeases = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use mock data if Supabase is not configured
      setLeases(mockLeases);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getLeases(JSON.parse(filtersKey));

    if (fetchError) {
      setError(fetchError.message);
      setLeases([]);
    } else {
      setLeases(data || []);
    }

    setLoading(false);
  }, [filtersKey]);

  useEffect(() => {
    if (!skipInitialFetch) {
      fetchLeases();
    }
  }, [fetchLeases, skipInitialFetch]);

  const create = async (leaseData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: createError } = await createLeaseByEmail(leaseData);

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Refresh leases after creation
    await fetchLeases();
    return { success: true, data };
  };

  const update = async (leaseId, updates) => {
    const { data, error: updateError } = await updateLease(leaseId, updates);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Refresh leases after update
    await fetchLeases();
    return { success: true, data };
  };

  const remove = async (leaseId) => {
    const { data, error: deleteError } = await deleteLeaseById({ leaseId });

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Refresh leases after deletion
    await fetchLeases();
    return { success: true, data };
  };

  return {
    leases,
    loading,
    error,
    refetch: fetchLeases,
    create,
    update,
    delete: remove
  };
};

/**
 * Hook for getting a single lease
 * @param {string} leaseId - Lease UUID
 * @returns {Object} { lease, loading, error, refetch }
 */
export const useLease = (leaseId) => {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLease = useCallback(async () => {
    if (!leaseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      const mockLease = mockLeases.find(l => l.id === leaseId);
      setLease(mockLease || null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getLease(leaseId);

    if (fetchError) {
      setError(fetchError.message);
      setLease(null);
    } else {
      setLease(data);
    }

    setLoading(false);
  }, [leaseId]);

  useEffect(() => {
    fetchLease();
  }, [fetchLease]);

  return {
    lease,
    loading,
    error,
    refetch: fetchLease
  };
};
