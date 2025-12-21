import { supabase } from './client';

const withTimeout = (promise, timeoutMs = 12000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs))
]);

export const createLeaseByEmail = async ({
  propertyId,
  tenantEmail,
  startDate,
  endDate,
  monthlyRent,
  securityDeposit,
  status
}) => {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('create-lease', {
        body: {
          propertyId,
          tenantEmail,
          startDate,
          endDate,
          monthlyRent,
          securityDeposit,
          status
        }
      })
    );

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const requestLease = async ({ propertyId, message }) => {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('request-lease', {
        body: {
          propertyId,
          message
        }
      })
    );

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
