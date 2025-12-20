import { useCallback, useEffect, useState } from 'react';
import { getProfile } from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getProfile();
    if (fetchError) {
      setError(fetchError.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  };
};
