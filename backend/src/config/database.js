// Mock database configuration for development without PostgreSQL
const mockPool = {
  query: async (text, params) => {
    console.log('Mock DB Query:', text, params);
    return { rows: [], rowCount: 0 };
  },
  connect: async () => {
    console.log('Mock DB Connect');
    return { release: () => {} };
  },
  end: async () => {
    console.log('Mock DB End');
  }
};

// Use mock database for development
const pool = mockPool;

module.exports = { pool };



