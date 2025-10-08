const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Check table structure first
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const hasPasswordColumn = tableInfo.rows.some(row => row.column_name === 'password');
    
    if (!hasPasswordColumn) {
      console.log('⚠️ Users table exists but missing password column, skipping seeding');
      return;
    }

    // Check if admin user exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@fraatlas.gov.in']);
    
    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['admin@fraatlas.gov.in', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if test user exists
    const testCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    
    if (testCheck.rows.length === 0) {
      // Create test user
      const hashedPassword = await bcrypt.hash('testpass123', 12);
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['test@example.com', hashedPassword, 'user']
      );
      console.log('✅ Test user created');
    } else {
      console.log('ℹ️ Test user already exists');
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    // Don't throw error, just log it
  }
};

module.exports = { seedDatabase };