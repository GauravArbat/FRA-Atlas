const { Pool } = require('pg');
const fs = require('fs');

// Local database connection
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fra_atlas',
  user: 'fra_user',
  password: 'fra_password'
});

async function exportLocalData() {
  try {
    console.log('🚀 Exporting local database data...');

    // Get all tables
    const tablesResult = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const exportData = {};

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`📦 Exporting table: ${tableName}`);

      try {
        // Get table structure
        const structureResult = await localPool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        // Get table data
        const dataResult = await localPool.query(`SELECT * FROM ${tableName}`);

        exportData[tableName] = {
          structure: structureResult.rows,
          data: dataResult.rows
        };

        console.log(`✅ Exported ${dataResult.rows.length} records from ${tableName}`);

      } catch (tableError) {
        console.error(`❌ Error exporting table ${tableName}:`, tableError.message);
      }
    }

    // Save to file
    fs.writeFileSync('local-data-export.json', JSON.stringify(exportData, null, 2));
    console.log('💾 Data saved to local-data-export.json');

    console.log('\n🎉 Export completed!');
    console.log('📊 Summary:');
    for (const [tableName, tableData] of Object.entries(exportData)) {
      console.log(`   ${tableName}: ${tableData.data.length} records`);
    }

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await localPool.end();
  }
}

exportLocalData();