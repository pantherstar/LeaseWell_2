import { supabase, isSupabaseConfigured } from './client';

// Helper function to add timeout to async operations
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

export const authService = {
  // Sign up new user
  async signUp({ email, password, fullName, role }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }

    let data;
    let error;
    try {
      const result = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role, // 'landlord' or 'tenant'
            },
          },
        })
      );
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      return { user: null, error: timeoutError };
    }

    if (error) {
      return { user: null, error };
    }

    // The database trigger 'on_auth_user_created' will automatically create the profile
    // No need to manually insert into profiles table

    return { user: data.user, session: data.session, error: null };
  },

  // Sign in
  async signIn({ email, password }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }

    let data;
    let error;
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      return { user: null, session: null, error: timeoutError };
    }

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    try {
      let userResult;
      try {
        userResult = await withTimeout(supabase.auth.getUser(), 5000);
      } catch (timeoutError) {
        console.error('getUser timed out:', timeoutError);
        return null;
      }

      const { data: { user }, error: userError } = userResult;

      if (userError) {
        console.error('Error getting user:', userError);
        return null;
      }

      if (!user) {
        console.log('No user found');
        return null;
      }

      if (isSupabaseConfigured()) {
        console.log('Fetching profile for user:', user.id);
        try {
          const { data: profile, error: profileError } = await withTimeout(
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single(),
            5000 // 5 second timeout
          );

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Return user without profile if profile fetch fails
            return { ...user, profile: null };
          }

          console.log('Profile fetched successfully:', profile);
          return { ...user, profile };
        } catch (timeoutError) {
          console.error('Profile fetch timed out:', timeoutError);
          return { ...user, profile: null };
        }
      }

      return user;
    } catch (error) {
      console.error('Unexpected error in getCurrentUser:', error);
      return null;
    }
  },

  // Get current session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Reset password
  async resetPassword(email) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }

    let error;
    try {
      const result = await withTimeout(
        supabase.auth.updateUser({
          password: newPassword
        }),
        10000
      );
      error = result.error;
    } catch (timeoutError) {
      throw new Error('Password update timed out. Please try again.');
    }

    if (error) throw error;
  },

  // OAuth sign in with Google
  async signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
