import { supabase } from './client';

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
    const { data, error } = await supabase.functions.invoke('create-lease', {
      body: {
        propertyId,
        tenantEmail,
        startDate,
        endDate,
        monthlyRent,
        securityDeposit,
        status
      }
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
