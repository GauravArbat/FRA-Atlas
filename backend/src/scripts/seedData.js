const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

// Mock data to seed the database
const SEED_DATA = [
  {
    khasraNumber: '45/2',
    surveyNumber: 'MP-BAL-001',
    area: 2.25,
    classification: 'Forest Land (Sarkar)',
    ownerName: 'Ramsingh Gond',
    fatherName: 'Late Bhimsingh Gond',
    village: 'Khairlanji',
    district: 'Balaghat',
    state: 'Madhya Pradesh',
    fraStatus: 'IFR Granted',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[80.1847, 21.8047], [80.1857, 21.8047], [80.1857, 21.8057], [80.1847, 21.8057], [80.1847, 21.8047]]]
    },
    mutationHistory: [
      { date: '2024-03-15', type: 'FRA Grant', details: 'Individual Forest Rights granted under FRA 2006' },
      { date: '2024-01-15', type: 'Application', details: 'FRA claim application submitted' }
    ]
  },
  {
    khasraNumber: '46/1',
    surveyNumber: 'MP-BAL-002',
    area: 1.75,
    classification: 'Forest Land (Sarkar)',
    ownerName: 'Bhil Singh',
    fatherName: 'Kalu Singh',
    village: 'Khairlanji',
    district: 'Balaghat',
    state: 'Madhya Pradesh',
    fraStatus: 'Pending',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[80.1867, 21.8067], [80.1877, 21.8067], [80.1877, 21.8077], [80.1867, 21.8077], [80.1867, 21.8067]]]
    },
    mutationHistory: [
      { date: '2024-02-10', type: 'Application', details: 'FRA claim application under review' }
    ]
  },
  {
    khasraNumber: '67/3',
    surveyNumber: 'OD-MAY-001',
    area: 3.2,
    classification: 'Forest Land (Government)',
    ownerName: 'Arjun Santal',
    fatherName: 'Mangal Santal',
    village: 'Baripada',
    district: 'Mayurbhanj',
    state: 'Odisha',
    fraStatus: 'IFR Granted',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[86.7350, 21.9287], [86.7360, 21.9287], [86.7360, 21.9297], [86.7350, 21.9297], [86.7350, 21.9287]]]
    },
    mutationHistory: [
      { date: '2024-03-10', type: 'FRA Grant', details: 'Individual Forest Rights granted' },
      { date: '2024-01-10', type: 'Application', details: 'FRA claim submitted with documents' }
    ]
  },
  {
    khasraNumber: '23/7',
    surveyNumber: 'TR-DHA-001',
    area: 1.8,
    classification: 'Forest Land (Reserved)',
    ownerName: 'Kokborok Debbarma',
    fatherName: 'Tripura Debbarma',
    village: 'Gandacherra',
    district: 'Dhalai',
    state: 'Tripura',
    fraStatus: 'Pending',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[91.8624, 23.8372], [91.8634, 23.8372], [91.8634, 23.8382], [91.8624, 23.8382], [91.8624, 23.8372]]]
    },
    mutationHistory: [
      { date: '2024-01-20', type: 'Application', details: 'FRA claim application submitted' }
    ]
  },
  {
    khasraNumber: '89/1',
    surveyNumber: 'TG-ADI-001',
    area: 15.0,
    classification: 'Forest Land (Community)',
    ownerName: 'Gram Sabha Utnoor',
    fatherName: '',
    village: 'Utnoor',
    district: 'Adilabad',
    state: 'Telangana',
    fraStatus: 'CFR Granted',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[78.5311, 19.6677], [78.5321, 19.6677], [78.5321, 19.6687], [78.5311, 19.6687], [78.5311, 19.6677]]]
    },
    mutationHistory: [
      { date: '2024-02-28', type: 'CFR Grant', details: 'Community Forest Rights granted to Gram Sabha' },
      { date: '2024-01-05', type: 'Application', details: 'CFR claim application by Gram Sabha' }
    ]
  }
];

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear existing data
    await client.query('DELETE FROM mutation_history');
    await client.query('DELETE FROM land_records');
    
    // Insert land records
    for (const record of SEED_DATA) {
      const insertQuery = `
        INSERT INTO land_records (
          khasra_number, survey_number, area, area_unit, classification,
          owner_name, father_name, village, district, state, fra_status, boundaries
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `;
      
      const values = [
        record.khasraNumber,
        record.surveyNumber,
        record.area,
        'hectares',
        record.classification,
        record.ownerName,
        record.fatherName,
        record.village,
        record.district,
        record.state,
        record.fraStatus,
        record.boundaries
      ];
      
      const result = await client.query(insertQuery, values);
      const landRecordId = result.rows[0].id;
      
      // Insert mutation history
      for (const mutation of record.mutationHistory) {
        await client.query(
          'INSERT INTO mutation_history (land_record_id, mutation_date, mutation_type, details) VALUES ($1, $2, $3, $4)',
          [landRecordId, mutation.date, mutation.type, mutation.details]
        );
      }
    }
    
    await client.query('COMMIT');
    logger.info(`Database seeded successfully with ${SEED_DATA.length} land records`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { seedDatabase };