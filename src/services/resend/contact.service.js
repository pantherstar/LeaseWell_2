import { supabase } from '../supabase/client';

export const sendContactMessage = async ({ name, email, message }) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        name,
        email,
        message
      }
    });

    if (error) {
      return { success: false, error: error.message || error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message || 'Unable to send message.' };
  }
};
