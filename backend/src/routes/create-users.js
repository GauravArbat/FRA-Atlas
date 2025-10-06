const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

router.post('/now', async (req, res) => {
  try {
    console.log('Creating users...');

    // Create table
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
        username: 'state_mp',
        email: 'state@mp.gov.in',
        password: 'mp123',
        role: 'state_admin',
        state: 'Madhya Pradesh'
      },
      {
        id: '3',
        username: 'district_bhopal',
        email: 'tribal.bhopal@mp.gov.in',
        password: 'bhopal123',
        role: 'district_admin',
        state: 'Madhya Pradesh',
        district: 'Bhopal'
      }
    ];

    const created = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, district)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
        password_hash = $4, role = $5, state = $6, district = $7
      `, [user.id, user.username, user.email, hashedPassword, user.role, user.state || null, user.district || null]);
      
      created.push({
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district
      });
    }

    res.json({
      message: 'Users created successfully',
      users: created
    });

  } catch (error) {
    console.error('Error creating users:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;