import { useState, useEffect, useCallback } from 'react';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';
import { mockPayments } from '../utils/mockData';

/**
 * Hook for managing payments
 * @param {Object} filters - Optional filters { status, leaseId }
 * @returns {Object} { payments, loading, error, refetch, create, update }
 */
export const usePayments = (filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use mock data if Supabase is not configured
      setPayments(mockPayments);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getPayments(filters);

    if (fetchError) {
      setError(fetchError.message);
      setPayments([]);
    } else {
      setPayments(data || []);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const create = async (paymentData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: createError } = await createPayment(paymentData);

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Refresh payments after creation
    await fetchPayments();
    return { success: true, data };
  };

  const update = async (paymentId, updates) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: updateError } = await updatePayment(paymentId, updates);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Refresh payments after update
    await fetchPayments();
    return { success: true, data };
  };

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    create,
    update
  };
};

/**
 * Hook for getting a single payment
 * @param {string} paymentId - Payment UUID
 * @returns {Object} { payment, loading, error, refetch }
 */
export const usePayment = (paymentId) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayment = useCallback(async () => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      const mockPayment = mockPayments.find(p => p.id === paymentId);
      setPayment(mockPayment || null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getPayment(paymentId);

    if (fetchError) {
      setError(fetchError.message);
      setPayment(null);
    } else {
      setPayment(data);
    }

    setLoading(false);
  }, [paymentId]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  return {
    payment,
    loading,
    error,
    refetch: fetchPayment
  };
};

/**
 * Hook for calculating payment statistics
 * @param {Array} payments - Array of payment objects
 * @returns {Object} { totalPaid, totalPending, totalLate, overdueAmount }
 */
export const usePaymentStats = (payments) => {
  const stats = {
    totalPaid: 0,
    totalPending: 0,
    totalLate: 0,
    overdueAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    lateCount: 0
  };

  payments.forEach(payment => {
    const amount = parseFloat(payment.amount) || 0;

    switch (payment.status) {
      case 'paid':
        stats.totalPaid += amount;
        stats.paidCount += 1;
        break;
      case 'pending':
        stats.totalPending += amount;
        stats.pendingCount += 1;
        break;
      case 'late':
        stats.totalLate += amount;
        stats.lateCount += 1;
        stats.overdueAmount += amount + (parseFloat(payment.late_fee) || 0);
        break;
      default:
        break;
    }
  });

  return stats;
};
