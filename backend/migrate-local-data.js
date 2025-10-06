const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fra_user:fra_password@localhost:5432/fra_atlas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...');

    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        state VARCHAR(255),
        district VARCHAR(255),
        block VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);

    // 2. Insert demo users
    const users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@fraatlas.gov.in',
        password: 'admin123',
        role: 'admin'
      },
      {
        id: '2',
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123',
        role: 'user'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
        password_hash = $4, role = $5
      `, [user.id, user.username, user.email, hashedPassword, user.role]);
      
      console.log(`✅ User created: ${user.email}`);
    }

    // 3. Create patta_holders table and migrate data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patta_holders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        village VARCHAR(255),
        district VARCHAR(255),
        state VARCHAR(255),
        survey_number VARCHAR(255),
        area_hectares DECIMAL(10,4),
        geometry JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Check for local patta data
    const pattaDataPath = path.join(__dirname, 'data', 'patta-holders.json');
    if (fs.existsSync(pattaDataPath)) {
      const pattaData = JSON.parse(fs.readFileSync(pattaDataPath, 'utf8'));
      
      for (const patta of pattaData) {
        await pool.query(`
          INSERT INTO patta_holders (name, village, district, state, survey_number, area_hectares, geometry)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          patta.name,
          patta.village,
          patta.district,
          patta.state,
          patta.survey_number,
          patta.area_hectares,
          JSON.stringify(patta.geometry)
        ]);
      }
      console.log(`✅ Migrated ${pattaData.length} patta records`);
    }

    // 4. Create FRA claims table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fra_claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(255) UNIQUE,
        claimant_name VARCHAR(255) NOT NULL,
        village VARCHAR(255),
        district VARCHAR(255),
        state VARCHAR(255),
        claim_type VARCHAR(50),
        area_claimed DECIMAL(10,4),
        status VARCHAR(50) DEFAULT 'pending',
        geometry JSONB,
        documents JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateData();