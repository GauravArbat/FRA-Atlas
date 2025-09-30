-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'state_admin', 'district_admin', 'block_admin', 'user')),
    state VARCHAR(100),
    district VARCHAR(100),
    block VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- FRA Claims table
CREATE TABLE fra_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_type VARCHAR(10) NOT NULL CHECK (claim_type IN ('IFR', 'CR', 'CFR')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    applicant_name VARCHAR(255) NOT NULL,
    applicant_contact VARCHAR(20),
    applicant_email VARCHAR(255),
    village VARCHAR(100) NOT NULL,
    block VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    area_hectares DECIMAL(10,2) NOT NULL,
    coordinates GEOMETRY(POINT, 4326),
    boundary_geometry GEOMETRY(POLYGON, 4326),
    submitted_date DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
    verification_notes TEXT,
    created_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES fra_claims(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT
);

-- CSS Integration table (Central Sector Schemes)
CREATE TABLE css_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES fra_claims(id) ON DELETE CASCADE,
    scheme_name VARCHAR(100) NOT NULL,
    scheme_type VARCHAR(50) NOT NULL,
    beneficiary_id VARCHAR(100),
    scheme_status VARCHAR(20) DEFAULT 'pending',
    amount_allocated DECIMAL(12,2),
    amount_disbursed DECIMAL(12,2),
    integration_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Spatial indexes
CREATE INDEX idx_fra_claims_coordinates ON fra_claims USING GIST (coordinates);
CREATE INDEX idx_fra_claims_boundary ON fra_claims USING GIST (boundary_geometry);
CREATE INDEX idx_fra_claims_location ON fra_claims (state, district, block, village);
CREATE INDEX idx_fra_claims_status ON fra_claims (status, verification_status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fra_claims_updated_at BEFORE UPDATE ON fra_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_integration_updated_at BEFORE UPDATE ON css_integration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_trail (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_trail (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER audit_fra_claims AFTER INSERT OR UPDATE OR DELETE ON fra_claims
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Sample data insertion
INSERT INTO users (username, email, password_hash, role, state) VALUES
('admin', 'admin@fraatlas.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iGm', 'admin', 'All India'),
('state_admin', 'state@fraatlas.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iGm', 'state_admin', 'Madhya Pradesh');

-- Patta Holders table
CREATE TABLE patta_holders (
    id VARCHAR(100) PRIMARY KEY,
    owner_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    village VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode INTEGER,
    full_address TEXT,
    survey_no VARCHAR(50),
    khasra VARCHAR(50),
    area_hectares DECIMAL(10,4),
    area_acres DECIMAL(10,4),
    area_square_meters DECIMAL(12,2),
    classification VARCHAR(100),
    fra_status VARCHAR(50),
    coordinates JSONB,
    geometry GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
);

-- Create spatial index for patta holders
CREATE INDEX idx_patta_holders_geometry ON patta_holders USING GIST (geometry);
CREATE INDEX idx_patta_holders_location ON patta_holders (state, district, village);
CREATE INDEX idx_patta_holders_fra_status ON patta_holders (fra_status);

-- Sample FRA claims
INSERT INTO fra_claims (claim_number, claim_type, status, applicant_name, village, block, district, state, area_hectares, coordinates, submitted_date) VALUES
('FRA/2024/001', 'IFR', 'approved', 'Rajesh Kumar', 'Khairlanji', 'Bhopal Block', 'Bhopal', 'Madhya Pradesh', 2.5, ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), '2024-01-15'),
('FRA/2024/002', 'CR', 'pending', 'Sita Devi', 'Gandacherra', 'West Tripura Block', 'West Tripura', 'Tripura', 1.8, ST_SetSRID(ST_MakePoint(91.2868, 23.8315), 4326), '2024-01-20'),
('FRA/2024/003', 'CFR', 'under_review', 'Community Group', 'Baripada', 'Cuttack Block', 'Cuttack', 'Odisha', 5.2, ST_SetSRID(ST_MakePoint(85.8781, 20.4625), 4326), '2024-01-25');



