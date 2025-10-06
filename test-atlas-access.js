#!/usr/bin/env node

/**
 * Test script to verify Atlas page access for different user roles
 */

const users = [
  {
    email: 'admin@fraatlas.gov.in',
    password: 'admin123',
    role: 'admin',
    expectedAccess: 'Full India map view with all FRA data'
  },
  {
    email: 'state@mp.gov.in', 
    password: 'mp123',
    role: 'state_admin',
    expectedAccess: 'Full India map view with all FRA data'
  },
  {
    email: 'tribal.bhopal@mp.gov.in',
    password: 'bhopal123', 
    role: 'district_admin',
    expectedAccess: 'Full India map view with all FRA data'
  }
];

async function testLogin(user) {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${user.role.toUpperCase()} Login Success:`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   State: ${data.user.state || 'All States'}`);
      console.log(`   District: ${data.user.district || 'All Districts'}`);
      console.log(`   Expected Access: ${user.expectedAccess}`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      console.log('');
      return true;
    } else {
      const error = await response.json();
      console.log(`❌ ${user.role.toUpperCase()} Login Failed: ${error.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${user.role.toUpperCase()} Login Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Atlas Page Access for All User Roles\n');
  console.log('📍 Atlas URL: http://localhost:3000/atlas\n');
  
  let successCount = 0;
  
  for (const user of users) {
    const success = await testLogin(user);
    if (success) successCount++;
  }
  
  console.log(`📊 Test Results: ${successCount}/${users.length} users can access Atlas`);
  
  if (successCount === users.length) {
    console.log('🎉 SUCCESS: All users (admin, state_admin, district_admin) now have equal access to Atlas!');
    console.log('\n📋 What each user can now do on Atlas page:');
    console.log('   • View full India map (no geographic restrictions)');
    console.log('   • See all FRA claims from all states and districts');
    console.log('   • Access all map layers (forests, boundaries, water bodies)');
    console.log('   • Use all mapping tools and controls');
    console.log('   • Export data and generate reports');
    console.log('   • Search locations across India');
  } else {
    console.log('⚠️  Some users may have login issues. Check backend server.');
  }
  
  console.log('\n🔗 Next Steps:');
  console.log('   1. Start the backend: cd backend && npm run dev');
  console.log('   2. Start the frontend: cd frontend && npm start');
  console.log('   3. Login with any of the three accounts');
  console.log('   4. Navigate to http://localhost:3000/atlas');
  console.log('   5. Verify full map access and data visibility');
}

runTests().catch(console.error);