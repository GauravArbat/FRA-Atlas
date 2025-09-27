const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'fra_atlas',
  user: 'postgres',
  password: 'Islethe1459PGA',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connected successfully', { timestamp: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Initialize database tables
const initializeTables = async () => {
  const client = await pool.connect();
  try {
    // Try to enable PostGIS extension (optional)
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      logger.info('PostGIS extension enabled');
    } catch (postgisError) {
      logger.warn('PostGIS not available, using basic geometry storage:', postgisError.message);
    }
    
    // Create users table with enhanced role-based fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'beneficiary' CHECK (role IN ('admin', 'mota_technical', 'state_authority', 'district_tribal_welfare', 'beneficiary')),
        state VARCHAR(100),
        district VARCHAR(100),
        block VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    // Create role_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        actions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, resource)
      );
    `);

    // Create land_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS land_records (
        id SERIAL PRIMARY KEY,
        khasra_number VARCHAR(50) NOT NULL,
        survey_number VARCHAR(50),
        area DECIMAL(10,4),
        area_unit VARCHAR(20) DEFAULT 'hectares',
        classification VARCHAR(100),
        owner_name VARCHAR(255) NOT NULL,
        father_name VARCHAR(255),
        village VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        fra_status VARCHAR(50) DEFAULT 'Not Applied',
        boundaries JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create mutation_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mutation_history (
        id SERIAL PRIMARY KEY,
        land_record_id INTEGER REFERENCES land_records(id) ON DELETE CASCADE,
        mutation_date DATE NOT NULL,
        mutation_type VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create fra_claims table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fra_claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(100) UNIQUE NOT NULL,
        claim_type VARCHAR(20) NOT NULL CHECK (claim_type IN ('IFR', 'CFR', 'CR')),
        status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'digitized', 'approved', 'rejected', 'pending_gis_validation')),
        applicant_name VARCHAR(255) NOT NULL,
        applicant_id VARCHAR(50),
        village VARCHAR(100) NOT NULL,
        block VARCHAR(100),
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL CHECK (state IN ('Madhya Pradesh', 'Tripura', 'Odisha', 'Telangana')),
        area DECIMAL(10,4),
        coordinates JSONB,
        submitted_date DATE DEFAULT CURRENT_DATE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        documents JSONB,
        verification_status VARCHAR(50) DEFAULT 'pending',
        ocr_processed BOOLEAN DEFAULT false,
        ner_processed BOOLEAN DEFAULT false,
        gis_validated BOOLEAN DEFAULT false,
        ai_analysis JSONB,
        submitted_by VARCHAR(36) REFERENCES users(id),
        reviewed_by VARCHAR(36) REFERENCES users(id),
        approved_by VARCHAR(36) REFERENCES users(id)
      );
    `);

    // Create legacy_records table for district uploads
    await client.query(`
      CREATE TABLE IF NOT EXISTS legacy_records (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        uploaded_by VARCHAR(36) REFERENCES users(id),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_status VARCHAR(50) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'ocr_processing', 'ner_processing', 'completed', 'failed')),
        ocr_result JSONB,
        ner_result JSONB,
        extracted_claims JSONB,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL
      );
    `);

    // Create ai_analysis table for satellite mapping
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES fra_claims(id),
        analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('land_use_classification', 'encroachment_detection', 'forest_cover_analysis')),
        satellite_data JSONB,
        model_results JSONB,
        confidence_score DECIMAL(5,4),
        processed_by VARCHAR(36) REFERENCES users(id),
        processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected'))
      );
    `);

    // Create scheme_integration table for cross-linking
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheme_integration (
        id SERIAL PRIMARY KEY,
        beneficiary_id VARCHAR(36) REFERENCES users(id),
        claim_id INTEGER REFERENCES fra_claims(id),
        pm_kisan_id VARCHAR(50),
        jal_jeevan_id VARCHAR(50),
        mgnrega_id VARCHAR(50),
        integration_status VARCHAR(50) DEFAULT 'pending',
        last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_land_records_district ON land_records(district);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_land_records_village ON land_records(village);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_land_records_owner ON land_records(owner_name);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_land_records_khasra ON land_records(khasra_number);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fra_claims_district ON fra_claims(district);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fra_claims_status ON fra_claims(status);');

    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  testConnection,
  initializeTables
};



