-- Drop existing table and enum
DROP TABLE IF EXISTS invitations;
DROP TYPE IF EXISTS invitation_status;

-- Create invitations table with VARCHAR status
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    landlord_id UUID NOT NULL REFERENCES profiles(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    monthly_rent VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMP
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
