const { pool } = require('../config/database');

const migrateUsersTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop existing users table and recreate with new structure
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    // Create new users table
    await client.query(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'state_admin', 'district_admin', 'block_admin', 'user')),
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
    
    await client.query('COMMIT');
    console.log('✅ Users table migrated successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateUsersTable();