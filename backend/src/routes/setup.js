const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Setup database endpoint
router.post('/database', async (req, res) => {
  try {
    console.log('🚀 Setting up database...');

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
      },
      {
        id: '3',
        username: 'state_mp',
        email: 'state@mp.gov.in',
        password: 'mp123',
        role: 'state_admin',
        state: 'Madhya Pradesh'
      },
      {
        id: '4',
        username: 'district_bhopal',
        email: 'tribal.bhopal@mp.gov.in',
        password: 'bhopal123',
        role: 'district_admin',
        state: 'Madhya Pradesh',
        district: 'Bhopal'
      }
    ];

    const createdUsers = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, district)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
        password_hash = $4, role = $5, state = $6, district = $7
      `, [user.id, user.username, user.email, hashedPassword, user.role, user.state, user.district]);
      
      createdUsers.push({
        email: user.email,
        role: user.role
      });
    }

    // 3. Create other tables
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

    res.json({
      message: 'Database setup completed successfully',
      users: createdUsers,
      tables: ['users', 'patta_holders', 'fra_claims']
    });

  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ error: 'Database setup failed', details: error.message });
  }
});

module.exports = router;