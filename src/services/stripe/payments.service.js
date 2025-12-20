import { supabase } from '../supabase/client';

export const createPaymentIntent = async ({ leaseId, currency = 'usd' }) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        leaseId,
        currency
      }
    });

    if (error) {
      return { clientSecret: null, error: error.message || error };
    }

    return { clientSecret: data?.clientSecret, error: null };
  } catch (error) {
    return { clientSecret: null, error: error.message || 'Failed to start payment.' };
  }
};
