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

export const acceptTenantInvite = async ({ token }) => {
  try {
    const { data, error } = await supabase.functions.invoke('accept-tenant-invite', {
      body: {
        token
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
