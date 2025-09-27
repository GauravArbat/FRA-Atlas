const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const fraUsers = [
  {
    username: 'admin',
    email: 'admin@fraatlas.gov.in',
    password: 'admin123',
    role: 'admin',
    state: null,
    district: null,
    block: null
  },
  // MoTA Technical Team
  {
    username: 'mota_tech',
    email: 'tech@mota.gov.in',
    password: 'mota123',
    role: 'mota_technical',
    state: null,
    district: null,
    block: null
  },
  // State Authorities
  {
    username: 'mp_state',
    email: 'state@mp.gov.in',
    password: 'mp123',
    role: 'state_authority',
    state: 'Madhya Pradesh',
    district: null,
    block: null
  },
  {
    username: 'tripura_state',
    email: 'state@tripura.gov.in',
    password: 'tripura123',
    role: 'state_authority',
    state: 'Tripura',
    district: null,
    block: null
  },
  {
    username: 'odisha_state',
    email: 'state@odisha.gov.in',
    password: 'odisha123',
    role: 'state_authority',
    state: 'Odisha',
    district: null,
    block: null
  },
  {
    username: 'telangana_state',
    email: 'state@telangana.gov.in',
    password: 'telangana123',
    role: 'state_authority',
    state: 'Telangana',
    district: null,
    block: null
  },
  // District Tribal Welfare Departments
  {
    username: 'bhopal_district',
    email: 'tribal@bhopal.gov.in',
    password: 'bhopal123',
    role: 'district_tribal_welfare',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    block: null
  },
  {
    username: 'west_tripura_district',
    email: 'tribal@westtripura.gov.in',
    password: 'westtripura123',
    role: 'district_tribal_welfare',
    state: 'Tripura',
    district: 'West Tripura',
    block: null
  },
  {
    username: 'khordha_district',
    email: 'tribal@khordha.gov.in',
    password: 'khordha123',
    role: 'district_tribal_welfare',
    state: 'Odisha',
    district: 'Khordha',
    block: null
  },
  {
    username: 'hyderabad_district',
    email: 'tribal@hyderabad.gov.in',
    password: 'hyderabad123',
    role: 'district_tribal_welfare',
    state: 'Telangana',
    district: 'Hyderabad',
    block: null
  },
  // Beneficiaries
  {
    username: 'beneficiary1',
    email: 'beneficiary1@example.com',
    password: 'beneficiary123',
    role: 'beneficiary',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    block: 'Berasia'
  },
  {
    username: 'beneficiary2',
    email: 'beneficiary2@example.com',
    password: 'beneficiary123',
    role: 'beneficiary',
    state: 'Tripura',
    district: 'West Tripura',
    block: 'Agartala'
  }
];

const rolePermissions = [
  {
    role: 'admin',
    resource: 'all',
    actions: ['create', 'read', 'update', 'delete', 'manage']
  },
  {
    role: 'mota_technical',
    resource: 'ai_analysis',
    actions: ['create', 'read', 'update', 'validate']
  },
  {
    role: 'state_authority',
    resource: 'state_claims',
    actions: ['read', 'update', 'approve', 'gis_validate']
  },
  {
    role: 'district_tribal_welfare',
    resource: 'district_claims',
    actions: ['create', 'read', 'update', 'upload_legacy', 'digitize']
  },
  {
    role: 'beneficiary',
    resource: 'own_claims',
    actions: ['create', 'read', 'track']
  }
];

const createFRAUsers = async () => {
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
    for (const user of fraUsers) {
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
    console.log('✅ FRA users created successfully');
    
    // Display created users
    console.log('\n📋 Created FRA System Users:');
    fraUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password} (${user.state || 'National'})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating users:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

createFRAUsers();