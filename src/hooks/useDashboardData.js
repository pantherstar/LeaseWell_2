import { useState, useEffect, useCallback } from 'react';
import {
  getProfile,
  getProperties,
  getLeases,
  getMaintenanceRequests,
  getDocuments,
  getPayments,
  getNotifications,
  getTenantPropertyLinks
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';
import { supabase } from '../services/supabase/client';

/**
 * Unified hook for fetching all dashboard data in parallel
 * This significantly improves performance by batching requests
 * @returns {Object} Dashboard data with loading/error states
 */
export const useDashboardData = () => {
  const [data, setData] = useState({
    profile: null,
    properties: [],
    leases: [],
    maintenanceRequests: [],
    documents: [],
    payments: [],
    notifications: [],
    tenantLinks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const fetchAllData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user once and cache it
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError(userError || new Error('Not authenticated'));
        setLoading(false);
        return;
      }

      const currentUserId = user.id;
      setUserId(currentUserId);

      // Fetch profile first to get role (needed for properties query)
      const profilePromise = getProfile(currentUserId);
      
      // Start all other queries in parallel (they'll use cached user)
      const [
        profileResult,
        leasesResult,
        maintenanceResult,
        documentsResult,
        paymentsResult,
        notificationsResult,
        tenantLinksResult
      ] = await Promise.all([
        profilePromise,
        getLeases({}, currentUserId),
        getMaintenanceRequests({}, currentUserId),
        getDocuments({}, currentUserId),
        getPayments({}, currentUserId),
        getNotifications({}, currentUserId),
        getTenantPropertyLinks(currentUserId)
      ]);

      const profile = profileResult.data;
      const role = profile?.role;
      setUserRole(role);

      // Now fetch properties with role to avoid sequential dependency
      const propertiesResult = await getProperties(currentUserId, role);

      // Update state with all data
      setData({
        profile: profile || null,
        properties: propertiesResult.data || [],
        leases: leasesResult.data || [],
        maintenanceRequests: maintenanceResult.data || [],
        documents: documentsResult.data || [],
        payments: paymentsResult.data || [],
        notifications: notificationsResult.data || [],
        tenantLinks: tenantLinksResult.data || []
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...data,
    loading,
    error,
    userId,
    userRole,
    refetch
  };
};

