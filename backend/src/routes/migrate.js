const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Remote database connection (Render)
const remotePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Migration endpoint - accepts local data and imports to remote database
router.post('/import', async (req, res) => {
  try {
    console.log('🚀 Starting data import to remote database...');
    const { tables } = req.body;

    if (!tables) {
      return res.status(400).json({ error: 'No tables data provided' });
    }

    const results = {};

    // Process each table
    for (const [tableName, tableData] of Object.entries(tables)) {
      try {
        console.log(`📦 Processing table: ${tableName}`);
        
        if (!tableData.structure || !tableData.data) {
          console.log(`⚠️ Skipping ${tableName} - missing structure or data`);
          continue;
        }

        // Create table structure
        const columns = tableData.structure.map(col => {
          let colDef = `${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') colDef += ' NOT NULL';
          if (col.column_default && !col.column_default.includes('nextval')) {
            colDef += ` DEFAULT ${col.column_default}`;
          }
          return colDef;
        });

        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
        await remotePool.query(createTableSQL);
        console.log(`✅ Table ${tableName} created/verified`);

        // Clear existing data
        await remotePool.query(`DELETE FROM ${tableName}`);

        // Insert data
        if (tableData.data.length > 0) {
          const columnNames = tableData.structure.map(col => col.column_name);
          const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;

          let insertedCount = 0;
          for (const row of tableData.data) {
            try {
              const values = columnNames.map(col => row[col] || null);
              await remotePool.query(insertSQL, values);
              insertedCount++;
            } catch (rowError) {
              console.log(`⚠️ Error inserting row in ${tableName}:`, rowError.message);
            }
          }

          results[tableName] = {
            created: true,
            imported: insertedCount,
            total: tableData.data.length
          };
          console.log(`✅ Imported ${insertedCount}/${tableData.data.length} records to ${tableName}`);
        } else {
          results[tableName] = { created: true, imported: 0, total: 0 };
        }

      } catch (tableError) {
        console.error(`❌ Error processing table ${tableName}:`, tableError.message);
        results[tableName] = { error: tableError.message };
      }
    }

    console.log('🎉 Data import completed!');
    res.json({
      message: 'Data import completed',
      results
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    res.status(500).json({ error: 'Import failed', details: error.message });
  }
});

// Export local data endpoint (for testing)
router.get('/export-sample', async (req, res) => {
  try {
    // Sample data structure for testing
    const sampleData = {
      users: {
        structure: [
          { column_name: 'id', data_type: 'VARCHAR(255)', is_nullable: 'NO' },
          { column_name: 'username', data_type: 'VARCHAR(255)', is_nullable: 'NO' },
          { column_name: 'email', data_type: 'VARCHAR(255)', is_nullable: 'NO' },
          { column_name: 'password_hash', data_type: 'VARCHAR(255)', is_nullable: 'NO' },
          { column_name: 'role', data_type: 'VARCHAR(50)', is_nullable: 'NO' },
          { column_name: 'state', data_type: 'VARCHAR(255)', is_nullable: 'YES' },
          { column_name: 'district', data_type: 'VARCHAR(255)', is_nullable: 'YES' },
          { column_name: 'created_at', data_type: 'TIMESTAMP', is_nullable: 'YES' }
        ],
        data: [
          {
            id: '1',
            username: 'admin',
            email: 'admin@fraatlas.gov.in',
            password_hash: await bcrypt.hash('admin123', 12),
            role: 'admin',
            state: null,
            district: null,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            username: 'testuser',
            email: 'test@example.com',
            password_hash: await bcrypt.hash('testpass123', 12),
            role: 'user',
            state: null,
            district: null,
            created_at: new Date().toISOString()
          }
        ]
      }
    };

    res.json({
      message: 'Sample data structure',
      tables: sampleData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;