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
        INSERT INTO users (email, password, role, state, district)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          state = EXCLUDED.state,
          district = EXCLUDED.district
      `, [user.email, hashedPassword, user.role, user.state, user.district]);
      
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