const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class LandRecord {
  // Search by Khasra number
  static async findByKhasra(district, village, khasraNumber) {
    try {
      const query = `
        SELECT lr.*, 
               lr.boundaries as boundaries_geojson,
               ARRAY_AGG(
                 JSON_BUILD_OBJECT(
                   'date', mh.mutation_date,
                   'type', mh.mutation_type,
                   'details', mh.details
                 ) ORDER BY mh.mutation_date DESC
               ) as mutation_history
        FROM land_records lr
        LEFT JOIN mutation_history mh ON lr.id = mh.land_record_id
        WHERE lr.district = $1 AND lr.village = $2 AND lr.khasra_number = $3
        GROUP BY lr.id
      `;
      
      const result = await pool.query(query, [district, village, khasraNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const record = result.rows[0];
      return this.formatRecord(record);
    } catch (error) {
      logger.error('Error finding land record by khasra:', error);
      throw error;
    }
  }

  // Search by owner name
  static async findByOwner(district, ownerName) {
    try {
      const query = `
        SELECT lr.*, 
               lr.boundaries as boundaries_geojson,
               ARRAY_AGG(
                 JSON_BUILD_OBJECT(
                   'date', mh.mutation_date,
                   'type', mh.mutation_type,
                   'details', mh.details
                 ) ORDER BY mh.mutation_date DESC
               ) as mutation_history
        FROM land_records lr
        LEFT JOIN mutation_history mh ON lr.id = mh.land_record_id
        WHERE lr.district = $1 AND lr.owner_name ILIKE $2
        GROUP BY lr.id
        ORDER BY lr.owner_name
      `;
      
      const result = await pool.query(query, [district, `%${ownerName}%`]);
      return result.rows.map(record => this.formatRecord(record));
    } catch (error) {
      logger.error('Error finding land records by owner:', error);
      throw error;
    }
  }

  // Get all land records
  static async findAll() {
    try {
      const query = `
        SELECT lr.*, 
               lr.boundaries as boundaries_geojson,
               ARRAY_AGG(
                 JSON_BUILD_OBJECT(
                   'date', mh.mutation_date,
                   'type', mh.mutation_type,
                   'details', mh.details
                 ) ORDER BY mh.mutation_date DESC
               ) as mutation_history
        FROM land_records lr
        LEFT JOIN mutation_history mh ON lr.id = mh.land_record_id
        GROUP BY lr.id
        ORDER BY lr.state, lr.district, lr.village, lr.khasra_number
      `;
      
      const result = await pool.query(query);
      return result.rows.map(record => this.formatRecord(record));
    } catch (error) {
      logger.error('Error finding all land records:', error);
      throw error;
    }
  }

  // Format record for API response
  static formatRecord(record) {
    return {
      khasraNumber: record.khasra_number,
      surveyNumber: record.survey_number,
      area: `${record.area} ${record.area_unit}`,
      classification: record.classification,
      ownerName: record.owner_name,
      fatherName: record.father_name,
      village: record.village,
      district: record.district,
      state: record.state,
      fraStatus: record.fra_status,
      boundaries: record.boundaries_geojson || null,
      mutationHistory: record.mutation_history && record.mutation_history[0] 
        ? record.mutation_history.filter(m => m.date) 
        : []
    };
  }
}

module.exports = LandRecord;