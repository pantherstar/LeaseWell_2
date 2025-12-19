import { useState, useEffect, useCallback } from 'react';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';

/**
 * Hook for managing properties
 * @returns {Object} { properties, loading, error, refetch, create, update, delete }
 */
export const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Return empty array if Supabase is not configured
      setProperties([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getProperties();

    if (fetchError) {
      setError(fetchError.message);
      setProperties([]);
    } else {
      setProperties(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const create = async (propertyData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: createError } = await createProperty(propertyData);

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Refresh properties after creation
    await fetchProperties();
    return { success: true, data };
  };

  const update = async (propertyId, updates) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: updateError } = await updateProperty(propertyId, updates);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Refresh properties after update
    await fetchProperties();
    return { success: true, data };
  };

  const remove = async (propertyId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: deleteError } = await deleteProperty(propertyId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Refresh properties after deletion
    await fetchProperties();
    return { success: true, data };
  };

  return {
    properties,
    loading,
    error,
    refetch: fetchProperties,
    create,
    update,
    delete: remove
  };
};

/**
 * Hook for getting a single property
 * @param {string} propertyId - Property UUID
 * @returns {Object} { property, loading, error, refetch }
 */
export const useProperty = (propertyId) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setProperty(null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getProperty(propertyId);

    if (fetchError) {
      setError(fetchError.message);
      setProperty(null);
    } else {
      setProperty(data);
    }

    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    loading,
    error,
    refetch: fetchProperty
  };
};
