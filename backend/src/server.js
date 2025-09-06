const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth-mock'); // Using mock auth for testing
const fraRoutes = require('./routes/fra');
const dataRoutes = require('./routes/data');
const decisionRoutes = require('./routes/decisions');
const reportRoutes = require('./routes/reports');
const digitizationRoutes = require('./routes/digitization');
const proxyRoutes = require('./routes/proxy');
const ocrRoutes = require('./routes/ocr');
const nerRoutes = require('./routes/ner');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
app.use('/api/fra', fraRoutes); // FRA data (public for atlas)
app.use('/api/data', authenticateToken, dataRoutes);
app.use('/api/decisions', authenticateToken, decisionRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/digitization', digitizationRoutes); // Digitization and standardization (public)
app.use('/api/proxy', proxyRoutes); // Tile proxy for external datasets
app.use('/api/ocr', ocrRoutes); // OCR processing
app.use('/api/ner', nerRoutes); // Named Entity Recognition

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 FRA Atlas API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
