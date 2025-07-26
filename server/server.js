const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:1420', 'http://localhost:3000'], // Allow both Vite and potential other ports
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow Excel and CSV files
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LCM Designer Server is running' });
});

// Excel to CSV conversion endpoint
app.post('/api/convert-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    console.log(`Processing file: ${originalName}`);

    // If it's already a CSV, just read and return it
    if (originalName.endsWith('.csv')) {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      return res.json({
        success: true,
        filename: originalName,
        csvData: csvContent,
        message: 'CSV file processed successfully'
      });
    }

    // Process Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    console.log(`Successfully converted ${originalName} to CSV`);
    
    res.json({
      success: true,
      filename: originalName,
      csvData: csvData,
      sheetName: sheetName,
      message: 'Excel file converted to CSV successfully'
    });
    
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Failed to process file',
      message: error.message
    });
  }
});

// VMware file processing endpoint
app.post('/api/process-vmware', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    console.log(`Processing VMware file: ${originalName}`);

    let csvContent;

    // Convert Excel to CSV if needed
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      csvContent = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      // Read CSV directly
      csvContent = fs.readFileSync(filePath, 'utf8');
    }

    // Basic VMware data validation
    const lines = csvContent.split('\n');
    const headers = lines[0].toLowerCase();
    
    const isRVTools = headers.includes('vm name') || headers.includes('vmname') || 
                     headers.includes('host name') || headers.includes('hostname') ||
                     headers.includes('cluster') || headers.includes('datacenter');
    
    if (!isRVTools) {
      throw new Error('File does not appear to be a valid RVTools or VMware export');
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    console.log(`Successfully processed VMware file: ${originalName}`);
    
    res.json({
      success: true,
      filename: originalName,
      csvData: csvContent,
      fileType: 'vmware',
      message: 'VMware file processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing VMware file:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Failed to process VMware file',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LCM Designer Server running on port ${PORT}`);
  console.log(`📁 File upload endpoint: http://localhost:${PORT}/api/convert-excel`);
  console.log(`🔧 VMware processing: http://localhost:${PORT}/api/process-vmware`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
