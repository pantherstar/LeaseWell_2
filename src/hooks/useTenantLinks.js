import { useCallback, useEffect, useState } from 'react';
import { getTenantPropertyLinks } from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';

export const useTenantLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getTenantPropertyLinks();

    if (fetchError) {
      setError(fetchError.message);
      setLinks([]);
    } else {
      setLinks(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    error,
    refetch: fetchLinks
  };
};
