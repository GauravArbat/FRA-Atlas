const express = require('express');
const cors = require('cors');
const processedDataRoutes = require('./routes/processed-data');
const dataRoutes = require('./routes/data');
const pdfProcessorRoutes = require('./routes/pdf-processor');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/processed-data', processedDataRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/pdf-processor', pdfProcessorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});