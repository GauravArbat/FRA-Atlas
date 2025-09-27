const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

const testUsers = [
  { email: 'admin@fraatlas.gov.in', password: 'admin123', role: 'admin' },
  { email: 'maharashtra@fraatlas.gov.in', password: 'mh123', role: 'state_admin' },
  { email: 'pune@fraatlas.gov.in', password: 'pune123', role: 'district_admin' },
  { email: 'haveli@fraatlas.gov.in', password: 'haveli123', role: 'block_admin' },
  { email: 'user@fraatlas.gov.in', password: 'user123', role: 'user' }
];

const testRBAC = async () => {
  console.log('🧪 Testing Role-Based Access Control\n');

  for (const user of testUsers) {
    try {
      console.log(`\n👤 Testing ${user.role.toUpperCase()} (${user.email})`);
      
      // Login
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      // Get permissions
      const permissionsResponse = await axios.get(`${API_BASE}/rbac/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📋 Permissions:', JSON.stringify(permissionsResponse.data, null, 2));
      
      // Test data access
      try {
        const dataResponse = await axios.get(`${API_BASE}/rbac/data/fra_claims`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`📊 Data access: ${dataResponse.data.count} records accessible`);
        console.log('🔍 Applied filters:', JSON.stringify(dataResponse.data.appliedFilters, null, 2));
      } catch (dataError) {
        console.log('❌ Data access denied:', dataError.response?.data?.error);
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
    
    console.log('─'.repeat(50));
  }
};

testRBAC().catch(console.error);