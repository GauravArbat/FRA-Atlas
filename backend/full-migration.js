const { Pool } = require('pg');
require('dotenv').config();

// Local database connection
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fra_atlas',
  user: 'fra_user',
  password: 'fra_password'
});

// Remote database connection (Render)
const remotePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateAllData() {
  try {
    console.log('🚀 Starting complete data migration from local to remote...');

    // Get all table names from local database
    const tablesResult = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    console.log('📋 Found tables:', tablesResult.rows.map(r => r.table_name));

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📦 Migrating table: ${tableName}`);

      try {
        // Get table structure
        const structureResult = await localPool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        // Create table in remote database
        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
        const columns = structureResult.rows.map(col => {
          let colDef = `${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') colDef += ' NOT NULL';
          if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
          return colDef;
        });
        createTableSQL += columns.join(', ') + ')';

        await remotePool.query(createTableSQL);
        console.log(`✅ Table ${tableName} created/verified`);

        // Get all data from local table
        const dataResult = await localPool.query(`SELECT * FROM ${tableName}`);
        console.log(`📊 Found ${dataResult.rows.length} records in ${tableName}`);

        if (dataResult.rows.length > 0) {
          // Clear existing data in remote table
          await remotePool.query(`DELETE FROM ${tableName}`);

          // Insert data in batches
          const columnNames = structureResult.rows.map(col => col.column_name);
          const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;

          for (const row of dataResult.rows) {
            const values = columnNames.map(col => row[col]);
            await remotePool.query(insertSQL, values);
          }

          console.log(`✅ Migrated ${dataResult.rows.length} records to ${tableName}`);
        }

      } catch (tableError) {
        console.error(`❌ Error migrating table ${tableName}:`, tableError.message);
      }
    }

    console.log('\n🎉 Complete data migration finished!');
    console.log('📊 Summary:');
    
    // Show summary of migrated data
    for (const table of tablesResult.rows) {
      try {
        const count = await remotePool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`   ${table.table_name}: ${count.rows[0].count} records`);
      } catch (e) {
        console.log(`   ${table.table_name}: Error counting records`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

// Run migration
migrateAllData();