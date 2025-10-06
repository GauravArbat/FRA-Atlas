const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Check if admin user exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@fraatlas.gov.in']);
    
    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['admin@fraatlas.gov.in', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created');
    }

    // Check if test user exists
    const testCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    
    if (testCheck.rows.length === 0) {
      // Create test user
      const hashedPassword = await bcrypt.hash('testpass123', 12);
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['test@example.com', hashedPassword, 'user']
      );
      console.log('✅ Test user created');
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
};

module.exports = { seedDatabase };