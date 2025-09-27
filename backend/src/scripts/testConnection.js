const { pool } = require('../config/database');

const testConnection = async () => {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test current user and database
    const userResult = await client.query('SELECT current_user, current_database()');
    console.log(`👤 Connected as: ${userResult.rows[0].current_user}`);
    console.log(`🗄️ Database: ${userResult.rows[0].current_database}`);
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available Tables:');
    if (tablesResult.rows.length === 0) {
      console.log('  ❌ No tables found');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // Test land_records table specifically
    try {
      const landRecordsResult = await client.query('SELECT COUNT(*) as count FROM land_records');
      console.log(`\n🗺️ Land Records: ${landRecordsResult.rows[0].count} records found`);
      
      // Show sample data
      const sampleResult = await client.query(`
        SELECT khasra_number, owner_name, village, district, state 
        FROM land_records 
        LIMIT 3
      `);
      
      console.log('\n📊 Sample Data:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.owner_name} - Khasra: ${row.khasra_number}`);
        console.log(`     📍 ${row.village}, ${row.district}, ${row.state}`);
      });
      
    } catch (tableError) {
      console.log('\n❌ land_records table not found or empty');
      console.log('   Error:', tableError.message);
    }
    
    client.release();
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Check your .env file:');
    console.log('   DATABASE_URL should be: postgresql://postgres:Islethe1459PGA@localhost:5432/fra_atlas');
  } finally {
    await pool.end();
  }
};

testConnection();