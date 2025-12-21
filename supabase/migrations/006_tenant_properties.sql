-- Tenant property access links for invite-based onboarding

CREATE TABLE tenant_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_id UUID REFERENCES tenant_invites(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX tenant_properties_unique ON tenant_properties(property_id, tenant_id);
CREATE INDEX idx_tenant_properties_tenant ON tenant_properties(tenant_id);
CREATE INDEX idx_tenant_properties_landlord ON tenant_properties(landlord_id);

ALTER TABLE tenant_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own property links"
  ON tenant_properties FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view property links"
  ON tenant_properties FOR SELECT
  USING (auth.uid() = landlord_id);

-- Allow tenants to view properties they were invited to
CREATE POLICY "Tenants can view invited properties"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_properties
      WHERE tenant_properties.property_id = properties.id
      AND tenant_properties.tenant_id = auth.uid()
      AND tenant_properties.status IN ('invited', 'active')
    )
  );

-- Allow tenants to view documents for invited properties
CREATE POLICY "Tenants can view documents for invited properties"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_properties tp
      WHERE tp.property_id = documents.property_id
      AND tp.tenant_id = auth.uid()
      AND tp.status IN ('invited', 'active')
    )
  );

-- Allow tenants to view storage documents for invited properties
CREATE POLICY "Tenants can view invited property documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM tenant_properties tp
      JOIN properties p ON tp.property_id = p.id
      WHERE tp.tenant_id = auth.uid()
      AND tp.status IN ('invited', 'active')
      AND (storage.foldername(name))[2] = p.id::text
    )
  );
