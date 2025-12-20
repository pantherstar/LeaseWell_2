import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(async () => {
      try {
        await authService.signOut();
      } catch {
        // ignore sign out errors on inactivity timeout
      } finally {
        setUser(null);
        setUserType(null);
        setSession(null);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

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

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

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

  const signIn = async ({ email, password }) => {
    try {
      console.log('Starting sign in...');
      const { user, session, error } = await authService.signIn({ email, password });

      if (error) {
        console.error('Sign in error:', error);
        return { user: null, error: error.message || 'Login failed' };
      }

      if (!user || !session) {
        console.error('No user or session returned from signIn');
        return { user: null, error: 'Authentication failed' };
      }

      console.log('Sign in successful, user:', user.email);
      setSession(session);
      setUser(user);
      setUserType(user?.user_metadata?.role || null);

      authService.getCurrentUser().then((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setUserType(currentUser?.profile?.role || currentUser?.user_metadata?.role || null);
        }
      });

      return { user, error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { user: null, error: error.message || 'Login failed' };
    }
  };

  const signUp = async ({ email, password, fullName, role }) => {
    try {
      const { user, error } = await authService.signUp({ email, password, fullName, role });

      if (error) {
        return { user: null, error: error.message || 'Signup failed' };
      }

      // After signup, automatically sign in
      const signInResult = await signIn({ email, password });
      return signInResult;
    } catch (error) {
      return { user: null, error: error.message || 'Signup failed' };
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
