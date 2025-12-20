import { supabase } from '../supabase/client';

export const recordOfflinePayment = async ({ leaseId, amount, method, paymentDate, notes }) => {
  try {
    const { data, error } = await supabase.functions.invoke('record-offline-payment', {
      body: {
        leaseId,
        amount,
        method,
        paymentDate,
        notes
      }
    });

    if (error) {
      return { success: false, error: error.message || error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message || 'Unable to record payment.' };
  }
};
