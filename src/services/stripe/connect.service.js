import { supabase } from '../supabase/client';

export const createConnectAccountLink = async ({ refreshUrl, returnUrl }) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: {
        refreshUrl,
        returnUrl
      }
    });

    if (error) {
      return { url: null, error: error.message || error };
    }

    return { url: data?.url, error: null };
  } catch (error) {
    return { url: null, error: error.message || 'Unable to start Stripe onboarding.' };
  }
};
