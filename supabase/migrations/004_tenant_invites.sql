-- Tenant invites for emailing tenants to join properties

CREATE TABLE tenant_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tenant_invites_landlord ON tenant_invites(landlord_id);
CREATE INDEX idx_tenant_invites_property ON tenant_invites(property_id);
CREATE INDEX idx_tenant_invites_email ON tenant_invites(email);

ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own tenant invites"
  ON tenant_invites FOR ALL
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);
