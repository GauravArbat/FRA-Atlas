const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection and data...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Database Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check land_records data
    const landRecordsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT state) as states,
        COUNT(DISTINCT district) as districts,
        COUNT(DISTINCT village) as villages
      FROM land_records;
    `;
    
    const landRecordsResult = await client.query(landRecordsQuery);
    const stats = landRecordsResult.rows[0];
    
    console.log('\n🗺️ Land Records Statistics:');
    console.log(`  - Total Records: ${stats.total_records}`);
    console.log(`  - States: ${stats.states}`);
    console.log(`  - Districts: ${stats.districts}`);
    console.log(`  - Villages: ${stats.villages}`);
    
    // Show sample data
    const sampleQuery = `
      SELECT 
        khasra_number,
        owner_name,
        village,
        district,
        state,
        fra_status,
        area
      FROM land_records 
      ORDER BY state, district, village
      LIMIT 10;
    `;
    
    const sampleResult = await client.query(sampleQuery);
    console.log('\n📊 Sample Land Records:');
    console.log('Khasra | Owner Name | Village | District | State | FRA Status | Area');
    console.log('-------|------------|---------|----------|-------|------------|------');
    
    sampleResult.rows.forEach(row => {
      console.log(`${row.khasra_number} | ${row.owner_name} | ${row.village} | ${row.district} | ${row.state} | ${row.fra_status} | ${row.area}`);
    });
    
    // Check mutation history
    const mutationQuery = `
      SELECT COUNT(*) as total_mutations
      FROM mutation_history;
    `;
    
    const mutationResult = await client.query(mutationQuery);
    console.log(`\n📝 Mutation History Records: ${mutationResult.rows[0].total_mutations}`);
    
    // Check users table
    const usersQuery = `
      SELECT COUNT(*) as total_users
      FROM users;
    `;
    
    const usersResult = await client.query(usersQuery);
    console.log(`👥 User Records: ${usersResult.rows[0].total_users}`);
    
    // Check fra_claims table
    const claimsQuery = `
      SELECT COUNT(*) as total_claims
      FROM fra_claims;
    `;
    
    const claimsResult = await client.query(claimsQuery);
    console.log(`📋 FRA Claims: ${claimsResult.rows[0].total_claims}`);
    
    // Test API endpoints
    console.log('\n🔗 Testing API Endpoints:');
    
    // Test search by khasra
    const khasraTest = await client.query(`
      SELECT * FROM land_records 
      WHERE district = 'Balaghat' AND village = 'Khairlanji' AND khasra_number = '45/2'
    `);
    console.log(`  - Khasra Search: ${khasraTest.rows.length > 0 ? '✅ Working' : '❌ Failed'}`);
    
    // Test search by owner
    const ownerTest = await client.query(`
      SELECT * FROM land_records 
      WHERE district = 'Balaghat' AND owner_name ILIKE '%Ramsingh%'
    `);
    console.log(`  - Owner Search: ${ownerTest.rows.length > 0 ? '✅ Working' : '❌ Failed'}`);
    
    // Test boundaries data
    const boundariesTest = await client.query(`
      SELECT COUNT(*) as records_with_boundaries
      FROM land_records 
      WHERE boundaries IS NOT NULL
    `);
    console.log(`  - Boundaries Data: ${boundariesTest.rows[0].records_with_boundaries} records have geometry`);
    
    client.release();
    console.log('\n✅ Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await pool.end();
  }
};

// Run the check
checkDatabase();