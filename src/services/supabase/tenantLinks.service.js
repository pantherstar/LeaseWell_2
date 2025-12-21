import { supabase } from './client';

export const revokeTenantAccess = async ({ propertyId, tenantId }) => {
  try {
    const { data, error } = await supabase.functions.invoke('revoke-tenant-access', {
      body: {
        propertyId,
        tenantId
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
