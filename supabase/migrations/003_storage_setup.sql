-- LeaseWell Storage Buckets Setup
-- This migration creates storage buckets and policies for file uploads

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Documents bucket (private) - for lease agreements, receipts, etc.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Maintenance photos bucket (private) - for maintenance request photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-photos',
  'maintenance-photos',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- Avatars bucket (public) - for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- =====================================================
-- STORAGE POLICIES FOR DOCUMENTS BUCKET
-- =====================================================

-- Users can upload documents to their own folder
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view documents in their own folder
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Landlords can view documents for their properties
CREATE POLICY "Landlords can view property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.landlord_id = auth.uid()
    AND (storage.foldername(name))[2] = properties.id::text
  )
);

-- Tenants can view documents for properties they lease
CREATE POLICY "Tenants can view lease documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM leases
    JOIN properties ON leases.property_id = properties.id
    WHERE leases.tenant_id = auth.uid()
    AND leases.status = 'active'
    AND (storage.foldername(name))[2] = properties.id::text
  )
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES FOR MAINTENANCE-PHOTOS BUCKET
-- =====================================================

-- Users can upload maintenance photos
CREATE POLICY "Users can upload maintenance photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance-photos' AND
  auth.role() = 'authenticated'
);

-- Users can view maintenance photos for their requests
CREATE POLICY "Users can view maintenance photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance-photos' AND
  auth.role() = 'authenticated' AND
  (
    -- Uploader can view
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Landlord can view photos for their properties
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      JOIN properties p ON mr.property_id = p.id
      WHERE p.landlord_id = auth.uid()
      AND (storage.foldername(name))[2] = mr.id::text
    ) OR
    -- Tenant can view photos for their requests
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.tenant_id = auth.uid()
      AND (storage.foldername(name))[2] = mr.id::text
    )
  )
);

-- Users can delete photos they uploaded
CREATE POLICY "Users can delete own maintenance photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES FOR AVATARS BUCKET (PUBLIC)
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to generate file path for documents
CREATE OR REPLACE FUNCTION generate_document_path(
  user_id UUID,
  property_id UUID,
  file_name TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || property_id::text || '/' || file_name;
END;
$$ LANGUAGE plpgsql;

-- Function to generate file path for maintenance photos
CREATE OR REPLACE FUNCTION generate_maintenance_photo_path(
  user_id UUID,
  request_id UUID,
  file_name TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || request_id::text || '/' || file_name;
END;
$$ LANGUAGE plpgsql;

-- Function to generate file path for avatars
CREATE OR REPLACE FUNCTION generate_avatar_path(
  user_id UUID,
  file_name TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || file_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION generate_document_path IS 'Generates standardized file path for document storage';
COMMENT ON FUNCTION generate_maintenance_photo_path IS 'Generates standardized file path for maintenance photos';
COMMENT ON FUNCTION generate_avatar_path IS 'Generates standardized file path for user avatars';
