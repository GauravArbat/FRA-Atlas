const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Remote database connection (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupRemoteDatabase() {
  try {
    console.log('🚀 Setting up remote database...');

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
    console.log('✅ Users table created');

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

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, district)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
        password_hash = $4, role = $5, state = $6, district = $7
      `, [user.id, user.username, user.email, hashedPassword, user.role, user.state, user.district]);
      
      console.log(`✅ User created: ${user.email} (${user.role})`);
    }

    // 3. Create other essential tables
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
    console.log('✅ Patta holders table created');

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
    console.log('✅ FRA claims table created');

    // 4. Insert sample data
    await pool.query(`
      INSERT INTO patta_holders (name, village, district, state, survey_number, area_hectares)
      VALUES 
      ('Ramesh Kumar', 'Khargone', 'Khargone', 'Madhya Pradesh', 'SN001', 2.5),
      ('Sunita Devi', 'Barwani', 'Barwani', 'Madhya Pradesh', 'SN002', 1.8),
      ('Mohan Singh', 'Dhar', 'Dhar', 'Madhya Pradesh', 'SN003', 3.2)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample patta holders inserted');

    console.log('\n🎉 Remote database setup completed!');
    console.log('\n👥 Available users:');
    console.log('   admin@fraatlas.gov.in / admin123 (admin)');
    console.log('   test@example.com / testpass123 (user)');
    console.log('   state@mp.gov.in / mp123 (state_admin)');
    console.log('   tribal.bhopal@mp.gov.in / bhopal123 (district_admin)');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupRemoteDatabase();