const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const states = [
  { name: 'Madhya Pradesh', code: 'MP', districts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'] },
  { name: 'Tripura', code: 'TR', districts: ['West Tripura', 'South Tripura', 'North Tripura', 'Dhalai'] },
  { name: 'Odisha', code: 'OD', districts: ['Khordha', 'Cuttack', 'Puri', 'Mayurbhanj'] },
  { name: 'Telangana', code: 'TG', districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'] }
];

const comprehensiveUsers = [
  // Admin
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
    username: 'mota_technical_head',
    email: 'tech.head@mota.gov.in',
    password: 'mota123',
    role: 'mota_technical',
    state: null,
    district: null,
    block: null
  },
  {
    username: 'mota_ai_specialist',
    email: 'ai.specialist@mota.gov.in',
    password: 'mota123',
    role: 'mota_technical',
    state: null,
    district: null,
    block: null
  },
  {
    username: 'mota_gis_analyst',
    email: 'gis.analyst@mota.gov.in',
    password: 'mota123',
    role: 'mota_technical',
    state: null,
    district: null,
    block: null
  }
];

// Generate State Authorities
states.forEach(state => {
  comprehensiveUsers.push({
    username: `${state.code.toLowerCase()}_state_authority`,
    email: `state@${state.code.toLowerCase()}.gov.in`,
    password: `${state.code.toLowerCase()}123`,
    role: 'state_authority',
    state: state.name,
    district: null,
    block: null
  });
});

// Generate District Tribal Welfare Departments
states.forEach(state => {
  state.districts.forEach(district => {
    comprehensiveUsers.push({
      username: `${state.code.toLowerCase()}_${district.toLowerCase().replace(/\s+/g, '_')}_tribal`,
      email: `tribal.${district.toLowerCase().replace(/\s+/g, '')}@${state.code.toLowerCase()}.gov.in`,
      password: `${district.toLowerCase().replace(/\s+/g, '')}123`,
      role: 'district_tribal_welfare',
      state: state.name,
      district: district,
      block: null
    });
  });
});

// Generate Beneficiaries (2 per district)
states.forEach(state => {
  state.districts.forEach((district, districtIndex) => {
    for (let i = 1; i <= 2; i++) {
      comprehensiveUsers.push({
        username: `beneficiary_${state.code.toLowerCase()}_${district.toLowerCase().replace(/\s+/g, '_')}_${i}`,
        email: `beneficiary${i}.${district.toLowerCase().replace(/\s+/g, '')}@${state.code.toLowerCase()}.com`,
        password: 'beneficiary123',
        role: 'beneficiary',
        state: state.name,
        district: district,
        block: `Block_${i}`
      });
    }
  });
});

const rolePermissions = [
  {
    role: 'admin',
    resource: 'all',
    actions: ['create', 'read', 'update', 'delete', 'manage', 'monitor', 'analyze']
  },
  {
    role: 'mota_technical',
    resource: 'ai_analysis',
    actions: ['create', 'read', 'update', 'validate', 'satellite_mapping', 'land_classification', 'cross_validation']
  },
  {
    role: 'state_authority',
    resource: 'state_oversight',
    actions: ['read', 'update', 'approve', 'gis_validate', 'compliance_check', 'policy_monitor']
  },
  {
    role: 'district_tribal_welfare',
    resource: 'district_operations',
    actions: ['create', 'read', 'update', 'upload_legacy', 'ocr_process', 'ner_process', 'digitize', 'approve_reject']
  },
  {
    role: 'beneficiary',
    resource: 'personal_claims',
    actions: ['create', 'read', 'track', 'submit_documents']
  }
];

const createComprehensiveFRAUsers = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data
    await client.query('DELETE FROM role_permissions');
    await client.query('DELETE FROM users');
    
    console.log('🗑️ Cleared existing users and permissions');
    
    // Insert role permissions
    for (const perm of rolePermissions) {
      await client.query(
        'INSERT INTO role_permissions (role, resource, actions) VALUES ($1, $2, $3)',
        [perm.role, perm.resource, JSON.stringify(perm.actions)]
      );
    }
    
    console.log('✅ Role permissions created');
    
    // Create users
    let userCount = 0;
    for (const user of comprehensiveUsers) {
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
      userCount++;
    }
    
    await client.query('COMMIT');
    console.log(`✅ ${userCount} FRA users created successfully`);
    
    // Display summary
    console.log('\n📊 User Summary:');
    console.log(`👑 Admin: 1 user`);
    console.log(`🤖 MoTA Technical: 3 users`);
    console.log(`🏛️ State Authorities: ${states.length} users`);
    console.log(`🏢 District Tribal Welfare: ${states.reduce((sum, state) => sum + state.districts.length, 0)} users`);
    console.log(`👥 Beneficiaries: ${states.reduce((sum, state) => sum + (state.districts.length * 2), 0)} users`);
    console.log(`📈 Total: ${userCount} users`);
    
    console.log('\n🔑 Key Login Credentials:');
    console.log('ADMIN: admin@fraatlas.gov.in / admin123');
    console.log('MOTA TECH: tech.head@mota.gov.in / mota123');
    console.log('MP STATE: state@mp.gov.in / mp123');
    console.log('BHOPAL DISTRICT: tribal.bhopal@mp.gov.in / bhopal123');
    console.log('BENEFICIARY: beneficiary1.bhopal@mp.com / beneficiary123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating users:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

createComprehensiveFRAUsers();