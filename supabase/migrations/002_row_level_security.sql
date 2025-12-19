-- LeaseWell Row Level Security (RLS) Policies
-- This migration enables RLS and creates security policies for all tables

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- Users can view and update their own profile
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- PROPERTIES POLICIES
-- Landlords can manage their own properties
-- =====================================================
CREATE POLICY "Landlords can view own properties"
  ON properties FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = landlord_id);

-- Tenants can view properties they lease
CREATE POLICY "Tenants can view their leased properties"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases
      WHERE leases.property_id = properties.id
      AND leases.tenant_id = auth.uid()
      AND leases.status = 'active'
    )
  );

-- =====================================================
-- LEASES POLICIES
-- Both landlords and tenants can view their leases
-- Landlords can manage leases
-- =====================================================
CREATE POLICY "Users can view their leases"
  ON leases FOR SELECT
  USING (
    auth.uid() = tenant_id OR
    auth.uid() = landlord_id
  );

CREATE POLICY "Landlords can insert leases"
  ON leases FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their leases"
  ON leases FOR UPDATE
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete their leases"
  ON leases FOR DELETE
  USING (auth.uid() = landlord_id);

-- =====================================================
-- MAINTENANCE REQUESTS POLICIES
-- Tenants create, landlords manage
-- =====================================================
CREATE POLICY "Users can view related maintenance requests"
  ON maintenance_requests FOR SELECT
  USING (
    auth.uid() = tenant_id OR
    auth.uid() = landlord_id
  );

CREATE POLICY "Tenants can create maintenance requests"
  ON maintenance_requests FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update own requests"
  ON maintenance_requests FOR UPDATE
  USING (auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update maintenance requests"
  ON maintenance_requests FOR UPDATE
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete maintenance requests"
  ON maintenance_requests FOR DELETE
  USING (auth.uid() = landlord_id);

-- =====================================================
-- PAYMENTS POLICIES
-- Tenants and landlords can view payments
-- System creates payments (via service role)
-- =====================================================
CREATE POLICY "Users can view their payments"
  ON payments FOR SELECT
  USING (
    auth.uid() = tenant_id OR
    auth.uid() = landlord_id
  );

-- Note: Payment creation is handled by Stripe webhooks using service role
-- No direct INSERT policy for regular users

CREATE POLICY "Landlords can update payment notes"
  ON payments FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- =====================================================
-- DOCUMENTS POLICIES
-- Users can access documents related to their properties/leases
-- =====================================================
CREATE POLICY "Users can view related documents"
  ON documents FOR SELECT
  USING (
    -- Uploader can view
    auth.uid() = uploaded_by OR
    -- Landlord can view documents for their properties
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = documents.property_id
      AND p.landlord_id = auth.uid()
    ) OR
    -- Tenant can view documents for properties they lease
    EXISTS (
      SELECT 1 FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE (l.id = documents.lease_id OR p.id = documents.property_id)
      AND l.tenant_id = auth.uid()
      AND l.status = 'active'
    )
  );

CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = uploaded_by);

-- =====================================================
-- MESSAGES POLICIES
-- Users can view and send messages to/from themselves
-- =====================================================
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- Users can view and manage their own notifications
-- =====================================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Note: System creates notifications via service role

-- =====================================================
-- TENANT SCREENINGS POLICIES
-- Landlords can view/manage screenings for their properties
-- Tenants can view their own screenings
-- =====================================================
CREATE POLICY "Landlords can view screenings for their properties"
  ON tenant_screenings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = tenant_screenings.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view own screenings"
  ON tenant_screenings FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can manage screenings"
  ON tenant_screenings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = tenant_screenings.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- =====================================================
-- TRANSACTIONS POLICIES
-- Landlords can manage their own transactions
-- =====================================================
CREATE POLICY "Landlords can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = landlord_id);

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is landlord for a property
CREATE OR REPLACE FUNCTION is_property_landlord(property_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM properties
    WHERE id = property_uuid
    AND landlord_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant for a lease
CREATE OR REPLACE FUNCTION is_lease_tenant(lease_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM leases
    WHERE id = lease_uuid
    AND tenant_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can only see their own profile data';
COMMENT ON POLICY "Landlords can view own properties" ON properties IS 'Landlords can only see properties they own';
COMMENT ON POLICY "Users can view their leases" ON leases IS 'Both tenants and landlords can view their leases';
COMMENT ON POLICY "Users can view related maintenance requests" ON maintenance_requests IS 'Users can view maintenance requests they are involved in';
COMMENT ON POLICY "Users can view their payments" ON payments IS 'Users can view payments related to their leases';
