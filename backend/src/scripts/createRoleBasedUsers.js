const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const defaultUsers = [
  {
    username: 'superadmin',
    email: 'admin@fraatlas.gov.in',
    password: 'admin123',
    role: 'admin',
    state: null,
    district: null,
    block: null
  },
  {
    username: 'maharashtra_admin',
    email: 'maharashtra@fraatlas.gov.in',
    password: 'mh123',
    role: 'state_admin',
    state: 'Maharashtra',
    district: null,
    block: null
  },
  {
    username: 'pune_admin',
    email: 'pune@fraatlas.gov.in',
    password: 'pune123',
    role: 'district_admin',
    state: 'Maharashtra',
    district: 'Pune',
    block: null
  },
  {
    username: 'haveli_admin',
    email: 'haveli@fraatlas.gov.in',
    password: 'haveli123',
    role: 'block_admin',
    state: 'Maharashtra',
    district: 'Pune',
    block: 'Haveli'
  },
  {
    username: 'field_user',
    email: 'user@fraatlas.gov.in',
    password: 'user123',
    role: 'user',
    state: 'Maharashtra',
    district: 'Pune',
    block: 'Haveli'
  }
];

const rolePermissions = [
  {
    role: 'admin',
    resource: 'all',
    actions: ['create', 'read', 'update', 'delete', 'manage']
  },
  {
    role: 'state_admin',
    resource: 'state_data',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    role: 'district_admin',
    resource: 'district_data',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'block_admin',
    resource: 'block_data',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'user',
    resource: 'basic_data',
    actions: ['read']
  }
];

const createRoleBasedUsers = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data
    await client.query('DELETE FROM role_permissions');
    await client.query('DELETE FROM users');
    
    // Insert role permissions
    for (const perm of rolePermissions) {
      await client.query(
        'INSERT INTO role_permissions (role, resource, actions) VALUES ($1, $2, $3)',
        [perm.role, perm.resource, JSON.stringify(perm.actions)]
      );
    }
    
    // Create users
    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await client.query(
        `INSERT INTO users (id, username, email, password_hash, role, state, district, block, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())`,
        [
          uuidv4(),
          user.username,
          user.email,
          hashedPassword,
          user.role,
          user.state,
          user.district,
          user.block
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log('✅ Role-based users created successfully');
    
    // Display created users
    console.log('\n📋 Created Users:');
    defaultUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating users:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

createRoleBasedUsers();