const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fra_user:fra_password@localhost:5432/fra_atlas',
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Test database connection with retry
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting database connection (${i + 1}/${retries})...`);
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log('⏳ Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  return false;
};

// Initialize database tables
const initializeTables = async () => {
  try {
    // Check if users table exists and has correct structure
    const usersTableCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    
    if (usersTableCheck.rows.length === 0) {
      // Create or alter users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // If table exists but missing password column, add it
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
      } catch (e) {
        // Column might already exist
      }
    }
    
    // Create FRA claims table (without foreign key constraints for now)
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
        submitted_by INTEGER,
        submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        approved_by INTEGER,
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