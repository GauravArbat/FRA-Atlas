const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fra_user:fra_password@localhost:5432/fra_atlas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create FRA claims table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fra_claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(100) UNIQUE NOT NULL,
        claim_type VARCHAR(10) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_id VARCHAR(100),
        village VARCHAR(255) NOT NULL,
        block VARCHAR(255),
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        area DECIMAL(10,4),
        coordinates JSONB,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'submitted',
        submitted_by INTEGER REFERENCES users(id),
        submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        verification_status TEXT
      )
    `);
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error.message);
  }
};

module.exports = { pool, testConnection, initializeTables };
module.exports.default = pool;