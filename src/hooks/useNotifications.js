import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';

/**
 * Hook for managing notifications
 * @param {Object} filters - Optional filters { unreadOnly, type }
 * @param {boolean} skipInitialFetch - If true, skip fetching on mount (for use with unified hooks)
 * @returns {Object} { notifications, unreadCount, loading, error, refetch, markAsRead, markAllAsRead, delete }
 */
export const useNotifications = (filters = {}, skipInitialFetch = false) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Return empty array if Supabase is not configured
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getNotifications(filters);

    if (fetchError) {
      setError(fetchError.message);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (!skipInitialFetch) {
      fetchNotifications();
    }

    // Set up real-time subscription if Supabase is configured (always subscribe for updates)
    if (isSupabaseConfigured()) {
      const subscription = subscribeToNotifications(() => {
        // Refetch when new notifications arrive
        fetchNotifications();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchNotifications, skipInitialFetch]);

  const markAsRead = async (notificationId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: markError } = await markNotificationAsRead(notificationId);

    if (markError) {
      return { success: false, error: markError.message };
    }

    // Update local state without full refetch
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    return { success: true, data };
  };

  const markAllAsRead = async () => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: markError } = await markAllNotificationsAsRead();

    if (markError) {
      return { success: false, error: markError.message };
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );

    return { success: true, data };
  };

  const remove = async (notificationId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: deleteError } = await deleteNotification(notificationId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Remove from local state without full refetch
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );

    return { success: true, data };
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    delete: remove
  };
};

/**
 * Hook for getting notifications grouped by type
 * @returns {Object} Notifications grouped by type
 */
export const useNotificationsByType = () => {
  const { notifications, loading, error } = useNotifications();
  const [groupedNotifications, setGroupedNotifications] = useState({
    payment: [],
    maintenance: [],
    lease: [],
    message: [],
    system: []
  });

  useEffect(() => {
    const grouped = {
      payment: [],
      maintenance: [],
      lease: [],
      message: [],
      system: []
    };

    notifications.forEach(notification => {
      if (grouped[notification.type]) {
        grouped[notification.type].push(notification);
      }
    });

    setGroupedNotifications(grouped);
  }, [notifications]);

  return {
    groupedNotifications,
    loading,
    error
  };
};
