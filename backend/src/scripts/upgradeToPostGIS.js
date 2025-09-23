const { pool } = require('../config/database');

const upgradeToPostGIS = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Upgrading database to use PostGIS...');
    
    // Check if PostGIS is available
    try {
      const result = await client.query('SELECT PostGIS_Version()');
      console.log('✅ PostGIS version:', result.rows[0].postgis_version);
    } catch (error) {
      console.log('❌ PostGIS not available. Install PostGIS first.');
      return;
    }
    
    // Add PostGIS geometry column
    await client.query('ALTER TABLE land_records ADD COLUMN IF NOT EXISTS boundaries_geom GEOMETRY(POLYGON, 4326)');
    console.log('✅ Added PostGIS geometry column');
    
    // Convert JSONB to PostGIS geometry
    const updateQuery = `
      UPDATE land_records 
      SET boundaries_geom = ST_GeomFromGeoJSON(boundaries::text)
      WHERE boundaries IS NOT NULL AND boundaries_geom IS NULL
    `;
    const result = await client.query(updateQuery);
    console.log(`✅ Converted ${result.rowCount} records to PostGIS geometry`);
    
    // Create spatial index
    await client.query('CREATE INDEX IF NOT EXISTS idx_land_records_geom ON land_records USING GIST(boundaries_geom)');
    console.log('✅ Created spatial index');
    
    // Test spatial queries
    const spatialTest = await client.query(`
      SELECT 
        owner_name,
        ST_Area(boundaries_geom::geography) / 10000 as area_hectares,
        ST_AsText(ST_Centroid(boundaries_geom)) as centroid
      FROM land_records 
      WHERE boundaries_geom IS NOT NULL
      LIMIT 3
    `);
    
    console.log('\n🗺️ PostGIS Spatial Query Results:');
    spatialTest.rows.forEach(row => {
      console.log(`  ${row.owner_name}: ${parseFloat(row.area_hectares).toFixed(4)} hectares`);
      console.log(`    Centroid: ${row.centroid}`);
    });
    
    console.log('\n✅ PostGIS upgrade completed!');
    
  } catch (error) {
    console.error('❌ PostGIS upgrade failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

upgradeToPostGIS();