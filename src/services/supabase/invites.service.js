import { supabase } from './client';

export const sendTenantInvite = async ({ propertyId, tenantEmail, tenantName, appUrl }) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-tenant-invite', {
      body: {
        propertyId,
        tenantEmail,
        tenantName,
        appUrl
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
