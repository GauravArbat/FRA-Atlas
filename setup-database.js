const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fra_user:fra_password@localhost:5432/fra_atlas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  try {
    console.log('🌳 Setting up FRA Atlas Database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if PostGIS extension exists
    const postgisCheck = await client.query(
      "SELECT 1 FROM pg_extension WHERE extname = 'postgis'"
    );
    
    if (postgisCheck.rows.length === 0) {
      console.log('📦 Installing PostGIS extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ PostGIS extension installed');
    } else {
      console.log('✅ PostGIS extension already exists');
    }
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating database tables...');
      
      // Create users table
      await client.query(`
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
      `);
      
      // Create FRA claims table
      await client.query(`
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
      `);
      
      // Create documents table
      await client.query(`
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
      `);
      
      // Create CSS integration table
      await client.query(`
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
      `);
      
      // Create audit trail table
      await client.query(`
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
      `);
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_fra_claims_coordinates ON fra_claims USING GIST (coordinates);
        CREATE INDEX idx_fra_claims_boundary ON fra_claims USING GIST (boundary_geometry);
        CREATE INDEX idx_fra_claims_location ON fra_claims (state, district, block, village);
        CREATE INDEX idx_fra_claims_status ON fra_claims (status, verification_status);
      `);
      
      console.log('✅ Database tables created');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    // Check if admin user exists
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = 'admin@fraatlas.gov.in'"
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creating default admin user...');
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [uuidv4(), 'admin', 'admin@fraatlas.gov.in', hashedPassword, 'admin', 'All India']);
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@fraatlas.gov.in');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Insert sample data if not exists
    const sampleCheck = await client.query('SELECT COUNT(*) FROM fra_claims');
    if (parseInt(sampleCheck.rows[0].count) === 0) {
      console.log('📊 Inserting sample data...');
      
      await client.query(`
        INSERT INTO fra_claims (claim_number, claim_type, status, applicant_name, village, block, district, state, area_hectares, coordinates, submitted_date) VALUES
        ('FRA/2024/001', 'IFR', 'approved', 'Rajesh Kumar', 'Village A', 'Block A', 'District A', 'Maharashtra', 2.5, ST_SetSRID(ST_MakePoint(73.8567, 19.0760), 4326), '2024-01-15'),
        ('FRA/2024/002', 'CR', 'pending', 'Sita Devi', 'Village B', 'Block B', 'District B', 'Maharashtra', 1.8, ST_SetSRID(ST_MakePoint(73.8567, 19.0760), 4326), '2024-01-20'),
        ('FRA/2024/003', 'CFR', 'under_review', 'Community Group', 'Village C', 'Block C', 'District C', 'Maharashtra', 5.2, ST_SetSRID(ST_MakePoint(73.8567, 19.0760), 4326), '2024-01-25');
      `);
      
      console.log('✅ Sample data inserted');
    } else {
      console.log('✅ Sample data already exists');
    }
    
    client.release();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
