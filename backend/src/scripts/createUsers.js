const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const createUsers = async () => {
  try {
    console.log('👥 Creating initial users...\n');
    
    const users = [
      {
        email: 'admin@fraatlas.gov.in',
        password: 'admin123',
        role: 'admin',
        state: null,
        district: null
      },
      {
        email: 'state.mp@fraatlas.gov.in',
        password: 'state123',
        role: 'state_admin',
        state: 'Madhya Pradesh',
        district: null
      },
      {
        email: 'district.khargone@fraatlas.gov.in',
        password: 'district123',
        role: 'district_admin',
        state: 'Madhya Pradesh',
        district: 'Khargone'
      },
      {
        email: 'test@example.com',
        password: 'testpass123',
        role: 'user',
        state: 'Madhya Pradesh',
        district: 'Balaghat'
      }
    ];

    for (const user of users) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // Insert user
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, state, district)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          state = EXCLUDED.state,
          district = EXCLUDED.district
      `, [user.email.split('@')[0], user.email, hashedPassword, user.role, user.state, user.district]);
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    
    console.log('\n✅ All users created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await pool.end();
  }
};

createUsers();