const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LCM Designer Server is running' });
});

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'LCM Designer Backend'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LCM Designer Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});