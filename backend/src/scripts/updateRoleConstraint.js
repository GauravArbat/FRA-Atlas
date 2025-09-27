const { pool } = require('../config/database');

const updateRoleConstraint = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop the existing constraint
    await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    
    // Add new constraint with FRA roles
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'mota_technical', 'state_authority', 'district_tribal_welfare', 'beneficiary'))
    `);
    
    await client.query('COMMIT');
    console.log('✅ Role constraint updated successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating constraint:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

updateRoleConstraint();