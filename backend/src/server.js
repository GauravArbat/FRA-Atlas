const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeTables } = require('./config/database');
const { seedDatabase } = require('./scripts/seedData');

const authRoutes = require('./routes/auth'); // Real auth with RBAC
const rbacRoutes = require('./routes/rbac'); // Role-based access control
const claimsRoutes = require('./routes/claims'); // FRA claims management
const legacyRoutes = require('./routes/legacy'); // Legacy records processing
const legacyDigitizationRoutes = require('./routes/legacy-digitization'); // Legacy digitization
const aiAnalysisRoutes = require('./routes/ai-analysis'); // AI satellite analysis
const schemesRoutes = require('./routes/schemes'); // Scheme integration
const dssRoutes = require('./routes/dss'); // DSS Engine integration
const satelliteRoutes = require('./routes/satellite'); // Satellite Asset Mapping
const fraRoutes = require('./routes/fra');
const dataRoutes = require('./routes/data');
const decisionRoutes = require('./routes/decisions');
const reportRoutes = require('./routes/reports');
const digitizationRoutes = require('./routes/digitization');
const proxyRoutes = require('./routes/proxy');
const ocrRoutes = require('./routes/ocr');
const nerRoutes = require('./routes/ner');
const gisPlotRoutes = require('./routes/gis-plot');
const geojsonPlotRoutes = require('./routes/geojson-plot');
const pdfProcessorRoutes = require('./routes/pdf-processor');
const bhunakshaRoutes = require('./routes/bhunaksha');
const translateRoutes = require('./routes/translate');
const voiceRoutes = require('./routes/voice');
const pattaHoldersRoutes = require('./routes/patta-holders');
const pattaReportRoutes = require('./routes/patta-report');
const adminRoutes = require('./routes/admin');
const digitizationPipelineRoutes = require('./routes/digitization-pipeline');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins temporarily for testing
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rbac', authenticateToken, rbacRoutes); // Role-based access control
app.use('/api/claims', claimsRoutes); // FRA claims management
app.use('/api/legacy', legacyRoutes); // Legacy records processing
app.use('/api/legacy-digitization', legacyDigitizationRoutes); // Legacy digitization
app.use('/api/ai-analysis', aiAnalysisRoutes); // AI satellite analysis
app.use('/api/schemes', schemesRoutes); // Scheme integration
app.use('/api/dss', dssRoutes); // DSS Engine integration
app.use('/api/satellite', satelliteRoutes); // Satellite Asset Mapping

// Environment variable for advanced satellite engine
process.env.ADVANCED_SATELLITE_ENGINE_URL = process.env.ADVANCED_SATELLITE_ENGINE_URL || 'http://localhost:8003';
app.use('/api/fra', fraRoutes); // FRA data (public for atlas)
app.use('/api/data', authenticateToken, dataRoutes);
app.use('/api/decisions', authenticateToken, decisionRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/digitization', digitizationRoutes); // Digitization and standardization (public)
app.use('/api/proxy', proxyRoutes); // Tile proxy for external datasets
app.use('/api/ocr', ocrRoutes); // OCR processing
app.use('/api/ner', nerRoutes); // Named Entity Recognition
app.use('/api/gis-plot', gisPlotRoutes); // Digital GIS Plot functionality
app.use('/api/geojson-plot', geojsonPlotRoutes); // GeoJSON plotting functionality
app.use('/api/pdf-processor', pdfProcessorRoutes); // PDF processing and data extraction
app.use('/api/bhunaksha', bhunakshaRoutes); // Bhunaksha-style land records
app.use('/api/translate', translateRoutes); // Google Translate API
app.use('/api/voice', voiceRoutes); // Voice Assistant API
app.use('/api/patta-holders', pattaHoldersRoutes); // Patta holders management
app.use('/api/patta-report', pattaReportRoutes); // Patta holder reports
app.use('/api/admin', adminRoutes); // Admin management
app.use('/api/digitization-pipeline', digitizationPipelineRoutes); // Advanced digitization pipeline

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('❌ Failed to connect to database. Server will start but database features may not work.');
    } else {
      // Initialize database tables
      await initializeTables();
      
      // Seed database if empty (development only)
      if (process.env.NODE_ENV !== 'production') {
        try {
          await seedDatabase();
        } catch (error) {
          console.log('⚠️ Database seeding failed (may already be seeded):', error.message);
        }
      }
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 FRA Atlas API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
