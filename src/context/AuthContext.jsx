import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/supabase/auth.service';
import { isSupabaseConfigured } from '../services/supabase/client';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();

    // Subscribe to auth state changes
    const { data: authListener } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setUserType(currentUser?.profile?.role);
        } else {
          setUser(null);
          setUserType(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // If Supabase is not configured, use mock authentication
        setLoading(false);
        return;
      }

      const session = await authService.getSession();
      setSession(session);

      if (session?.user) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setUserType(currentUser?.profile?.role);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { user, session } = await authService.signIn({ email, password });
      setSession(session);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setUserType(currentUser?.profile?.role);
      return { user: currentUser, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signUp = async (email, password, fullName, role) => {
    try {
      const { user } = await authService.signUp({ email, password, fullName, role });
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserType(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await authService.signInWithGoogle();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Mock login for when Supabase is not configured
  const mockLogin = (type) => {
    setUser({ email: 'demo@leasewell.com', profile: { role: type } });
    setUserType(type);
  };

  const value = {
    user,
    userType,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    mockLogin, // For demo purposes when Supabase is not configured
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
