import { useState, useEffect, useCallback } from 'react';
import {
  getDocuments,
  uploadDocument,
  getDocumentUrl,
  deleteDocument
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';
import { mockDocuments } from '../utils/mockData';

/**
 * Hook for managing documents
 * @param {Object} filters - Optional filters { propertyId, leaseId, documentType }
 * @returns {Object} { documents, loading, error, refetch, upload, download, delete }
 */
export const useDocuments = (filters = {}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Stringify filters to avoid object reference issues in dependencies
  const filtersKey = JSON.stringify(filters);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use mock data if Supabase is not configured
      setDocuments(mockDocuments);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getDocuments(JSON.parse(filtersKey));

    if (fetchError) {
      setError(fetchError.message);
      setDocuments([]);
    } else {
      setDocuments(data || []);
    }

    setLoading(false);
  }, [filtersKey]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = async (file, metadata) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    setUploadProgress(0);

    const { data, error: uploadError } = await uploadDocument(file, metadata);

    if (uploadError) {
      setUploadProgress(0);
      return { success: false, error: uploadError.message };
    }

    setUploadProgress(100);

    // Refresh documents after upload
    await fetchDocuments();

    setTimeout(() => setUploadProgress(0), 1000);
    return { success: true, data };
  };

  const download = async (filePath) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: downloadError } = await getDocumentUrl(filePath);

    if (downloadError) {
      return { success: false, error: downloadError.message };
    }

    return { success: true, url: data.signedUrl };
  };

  const remove = async (documentId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: deleteError } = await deleteDocument(documentId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Refresh documents after deletion
    await fetchDocuments();
    return { success: true, data };
  };

  return {
    documents,
    loading,
    error,
    uploadProgress,
    refetch: fetchDocuments,
    upload,
    download,
    delete: remove
  };
};
