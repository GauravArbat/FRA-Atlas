const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addUsers() {
  try {
    console.log('🚀 Adding users to online database...');

    const users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@fraatlas.gov.in',
        password: 'admin123',
        role: 'admin',
        state: null,
        district: null
      },
      {
        id: '2',
        username: 'state_mp',
        email: 'state@mp.gov.in',
        password: 'mp123',
        role: 'state_admin',
        state: 'Madhya Pradesh',
        district: null
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

    // Create users table
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

    // Add each user
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, district)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
        password_hash = $4, role = $5, state = $6, district = $7
      `, [user.id, user.username, user.email, hashedPassword, user.role, user.state, user.district]);
      
      console.log(`✅ User added: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 All users added successfully!');
    console.log('\n👥 Available users:');
    console.log('   admin@fraatlas.gov.in / admin123 (admin)');
    console.log('   state@mp.gov.in / mp123 (state_admin - Madhya Pradesh)');
    console.log('   tribal.bhopal@mp.gov.in / bhopal123 (district_admin - Bhopal, MP)');

  } catch (error) {
    console.error('❌ Failed to add users:', error);
  } finally {
    await pool.end();
  }
}

addUsers();