-- =====================================================
-- CONTRACTOR AGENT SYSTEM
-- Adds agent tracking and contractor quotes for maintenance requests
-- =====================================================

-- Add agent tracking fields to maintenance_requests
ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS agent_status TEXT CHECK (agent_status IN ('pending', 'shopping', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS agent_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS agent_completed_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- CONTRACTOR QUOTES TABLE
-- Stores quotes from contractors for maintenance requests
-- =====================================================
CREATE TABLE contractor_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE NOT NULL,
  contractor_name TEXT NOT NULL,
  contractor_phone TEXT,
  contractor_email TEXT,
  contractor_address TEXT,
  contractor_rating DECIMAL(3,2),
  contractor_review_count INTEGER,
  quote_amount DECIMAL(10,2) NOT NULL,
  quote_notes TEXT,
  availability TEXT,
  status TEXT CHECK (status IN ('pending', 'received', 'accepted', 'rejected')) DEFAULT 'received',
  negotiation_messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contractor_quotes
CREATE INDEX idx_contractor_quotes_maintenance_request ON contractor_quotes(maintenance_request_id);
CREATE INDEX idx_contractor_quotes_status ON contractor_quotes(status);
CREATE INDEX idx_maintenance_agent_status ON maintenance_requests(agent_status);

-- Enable RLS on contractor_quotes
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_quotes
CREATE POLICY "Users can view quotes for their maintenance requests"
  ON contractor_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = contractor_quotes.maintenance_request_id
      AND (auth.uid() = mr.tenant_id OR auth.uid() = mr.landlord_id)
    )
  );

CREATE POLICY "Landlords can update quotes"
  ON contractor_quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = contractor_quotes.maintenance_request_id
      AND auth.uid() = mr.landlord_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contractor_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractor_quotes_updated_at
  BEFORE UPDATE ON contractor_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_quotes_updated_at();

-- Comments
COMMENT ON TABLE contractor_quotes IS 'Contractor quotes collected by the maintenance agent';
COMMENT ON COLUMN maintenance_requests.agent_status IS 'Status of the contractor shopping agent: pending, shopping, completed, or failed';
COMMENT ON COLUMN contractor_quotes.negotiation_messages IS 'Array of messages exchanged during negotiation';

