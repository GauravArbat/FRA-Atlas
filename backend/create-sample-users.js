const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

const sampleUsers = [
  // Madhya Pradesh
  { username: 'mp_state_admin', email: 'state.admin@mp.gov.in', password: 'mp123', role: 'state_admin', state: 'Madhya Pradesh', district: null },
  { username: 'bhopal_district', email: 'district.bhopal@mp.gov.in', password: 'bhopal123', role: 'district_admin', state: 'Madhya Pradesh', district: 'Bhopal' },
  { username: 'indore_district', email: 'district.indore@mp.gov.in', password: 'indore123', role: 'district_admin', state: 'Madhya Pradesh', district: 'Indore' },
  { username: 'jabalpur_district', email: 'district.jabalpur@mp.gov.in', password: 'jabalpur123', role: 'district_admin', state: 'Madhya Pradesh', district: 'Jabalpur' },
  { username: 'mp_field_officer1', email: 'field1@mp.gov.in', password: 'field123', role: 'user', state: 'Madhya Pradesh', district: 'Bhopal' },
  { username: 'mp_field_officer2', email: 'field2@mp.gov.in', password: 'field123', role: 'user', state: 'Madhya Pradesh', district: 'Indore' },

  // Tripura
  { username: 'tripura_state_admin', email: 'state.admin@tripura.gov.in', password: 'tripura123', role: 'state_admin', state: 'Tripura', district: null },
  { username: 'west_tripura_district', email: 'district.west@tripura.gov.in', password: 'west123', role: 'district_admin', state: 'Tripura', district: 'West Tripura' },
  { username: 'south_tripura_district', email: 'district.south@tripura.gov.in', password: 'south123', role: 'district_admin', state: 'Tripura', district: 'South Tripura' },
  { username: 'tripura_field_officer1', email: 'field1@tripura.gov.in', password: 'field123', role: 'user', state: 'Tripura', district: 'West Tripura' },

  // Odisha
  { username: 'odisha_state_admin', email: 'state.admin@odisha.gov.in', password: 'odisha123', role: 'state_admin', state: 'Odisha', district: null },
  { username: 'bhubaneswar_district', email: 'district.bhubaneswar@odisha.gov.in', password: 'bbsr123', role: 'district_admin', state: 'Odisha', district: 'Khordha' },
  { username: 'cuttack_district', email: 'district.cuttack@odisha.gov.in', password: 'cuttack123', role: 'district_admin', state: 'Odisha', district: 'Cuttack' },
  { username: 'mayurbhanj_district', email: 'district.mayurbhanj@odisha.gov.in', password: 'mayur123', role: 'district_admin', state: 'Odisha', district: 'Mayurbhanj' },
  { username: 'odisha_field_officer1', email: 'field1@odisha.gov.in', password: 'field123', role: 'user', state: 'Odisha', district: 'Khordha' },
  { username: 'odisha_field_officer2', email: 'field2@odisha.gov.in', password: 'field123', role: 'user', state: 'Odisha', district: 'Mayurbhanj' },

  // Telangana
  { username: 'telangana_state_admin', email: 'state.admin@telangana.gov.in', password: 'telangana123', role: 'state_admin', state: 'Telangana', district: null },
  { username: 'hyderabad_district', email: 'district.hyderabad@telangana.gov.in', password: 'hyd123', role: 'district_admin', state: 'Telangana', district: 'Hyderabad' },
  { username: 'warangal_district', email: 'district.warangal@telangana.gov.in', password: 'warangal123', role: 'district_admin', state: 'Telangana', district: 'Warangal' },
  { username: 'adilabad_district', email: 'district.adilabad@telangana.gov.in', password: 'adilabad123', role: 'district_admin', state: 'Telangana', district: 'Adilabad' },
  { username: 'telangana_field_officer1', email: 'field1@telangana.gov.in', password: 'field123', role: 'user', state: 'Telangana', district: 'Hyderabad' },
  { username: 'telangana_field_officer2', email: 'field2@telangana.gov.in', password: 'field123', role: 'user', state: 'Telangana', district: 'Warangal' }
];

const createUsers = async () => {
  try {
    console.log('🔄 Creating sample users...');
    
    for (const user of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        // Insert user with generated ID
        const userId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        await pool.query(`
          INSERT INTO users (id, username, email, password_hash, role, created_at) 
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [userId, user.username, user.email, hashedPassword, user.role]);
        
        console.log(`✅ Created user: ${user.username} (${user.email}) - ${user.role} - ${user.state}${user.district ? ', ' + user.district : ''}`);
        
      } catch (userError) {
        console.error(`❌ Failed to create user ${user.email}:`, userError.message);
      }
    }
    
    console.log('🎉 Sample users creation completed!');
    
    // Show summary
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users in database: ${totalUsers.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await pool.end();
  }
};

createUsers();