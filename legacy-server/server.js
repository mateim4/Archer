const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Path to the Rust CLI parser
const RVTOOLS_CLI_PATH = path.join(__dirname, '..', 'target', 'debug', 'rvtools_cli');

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

// Mock project data store (in production, this would be a database)
const projects = [
  {
    id: '1',
    name: 'Project Phoenix',
    description: 'Migrate the legacy infrastructure to the new platform.',
    owner_id: 'user:admin',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  },
  {
    id: '2', 
    name: 'Project Titan',
    description: 'Large scale datacenter consolidation project.',
    owner_id: 'user:admin',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-18T00:00:00Z'
  },
  {
    id: '3',
    name: 'Project Nova', 
    description: 'Cloud migration and modernization initiative.',
    owner_id: 'user:admin',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
];

// Project API endpoints
app.get('/api/projects', (req, res) => {
  console.log('📋 GET /api/projects - Fetching all projects');
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description, owner_id } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }
  
  const newProject = {
    id: (projects.length + 1).toString(),
    name,
    description,
    owner_id: owner_id || 'user:admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const { name, description } = req.body;
  projects[projectIndex] = {
    ...projects[projectIndex],
    name: name || projects[projectIndex].name,
    description: description || projects[projectIndex].description,
    updated_at: new Date().toISOString()
  };
  
  res.json(projects[projectIndex]);
});

app.delete('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  projects.splice(projectIndex, 1);
  res.status(204).send();
});

// Excel to CSV conversion endpoint
app.post('/api/convert-excel', upload.single('file'), async (req, res) => {
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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    // Convert to CSV
    let csvData = '';
    worksheet.eachRow((row, rowNumber) => {
      const rowValues = [];
      row.eachCell((cell, colNumber) => {
        // Handle different cell types
        let value = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && cell.value.text) {
            value = cell.value.text; // Rich text
          } else {
            value = cell.value.toString();
          }
        }
        rowValues.push(`"${value.replace(/"/g, '""')}"`);
      });
      csvData += rowValues.join(',') + '\n';
    });
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    console.log(`Successfully converted ${originalName} to CSV`);
    
    res.json({
      success: true,
      filename: originalName,
      csvData: csvData,
      sheetName: worksheet.name,
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

// VMware file processing endpoint - Enhanced with real RVTools parsing
app.post('/api/process-vmware', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    console.log(`Processing VMware file: ${originalName}`);

    // Check if this is an Excel file (RVTools export)
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      
      // Check if the Rust CLI parser exists
      if (!fs.existsSync(RVTOOLS_CLI_PATH)) {
        console.warn('RVTools parser not found, using basic Excel parsing fallback');
        
        // Basic Excel parsing fallback
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheets = workbook.worksheets;
        
        // Try to find the vInfo sheet which contains VM information
        const vInfoSheet = worksheets.find(ws => ws.name.toLowerCase().includes('vinfo')) || worksheets[0];
        
        // Convert worksheet to JSON format
        const jsonData = [];
        const headers = [];
        
        // Get headers from first row
        const headerRow = vInfoSheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value ? cell.value.toString() : '';
        });
        
        // Get data from remaining rows
        for (let rowNumber = 2; rowNumber <= vInfoSheet.rowCount; rowNumber++) {
          const row = vInfoSheet.getRow(rowNumber);
          const rowData = {};
          let hasData = false;
          
          row.eachCell((cell, colNumber) => {
            if (headers[colNumber]) {
              const value = cell.value ? cell.value.toString() : '';
              rowData[headers[colNumber]] = value;
              if (value) hasData = true;
            }
          });
          
          if (hasData) {
            jsonData.push(rowData);
          }
        }
        
        // Generate environment data from Excel content
        const environmentData = generateEnvironmentFromExcel(jsonData, originalName);
        
        // Log the processed data summary
        console.log(`Excel parsing summary:
          - Sheet used: ${vInfoSheet.name}
          - Total rows: ${jsonData.length}
          - VMs found: ${environmentData.total_vms}
          - Clusters: ${environmentData.clusters.length}
          - Hosts: ${environmentData.total_hosts}`);
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        console.log(`Successfully processed Excel file with fallback parser: ${originalName}`);
        
        res.json({
          success: true,
          filename: originalName,
          environment: environmentData,
          fileType: 'rvtools',
          message: 'Excel file processed with basic parser (Rust parser not available)'
        });
        return;
      }

      console.log(`Using Rust parser to process RVTools file: ${originalName}`);
      
      // Use the Rust CLI to parse the RVTools file
      const parseResult = await parseRVToolsFile(filePath);
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      console.log(`Successfully parsed RVTools file: ${originalName}`);
      console.log(`Environment contains ${parseResult.clusters.length} clusters, ${parseResult.total_vms} VMs, ${parseResult.total_hosts} hosts`);
      
      res.json({
        success: true,
        filename: originalName,
        environment: parseResult,
        fileType: 'rvtools',
        message: 'RVTools file parsed successfully with real data'
      });
      
    } else if (originalName.endsWith('.csv')) {
      // For CSV files, parse them into environment structure like Excel files
      const csvContent = fs.readFileSync(filePath, 'utf8');
      
      // Basic VMware data validation
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or invalid');
      }
      
      const headers = lines[0].toLowerCase();
      const isRVTools = headers.includes('vm name') || headers.includes('vmname') || 
                       headers.includes('host name') || headers.includes('hostname') ||
                       headers.includes('cluster') || headers.includes('datacenter');
      
      if (!isRVTools) {
        throw new Error('CSV file does not appear to be a valid RVTools or VMware export');
      }

      // Parse CSV data into JSON format for processing
      const parsedCSV = [];
      const headerFields = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headerFields.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        if (Object.values(row).some(v => v)) { // Only add non-empty rows
          parsedCSV.push(row);
        }
      }

      // Generate environment data from CSV content using the same logic as Excel
      const environmentData = generateEnvironmentFromExcel(parsedCSV, originalName);
      
      // Log the processed data summary
      console.log(`CSV parsing summary:
        - Total rows: ${parsedCSV.length}
        - VMs found: ${environmentData.total_vms}
        - Clusters: ${environmentData.clusters.length}
        - Hosts: ${environmentData.total_hosts}`);

      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      console.log(`Successfully processed VMware CSV file: ${originalName}`);
      
      res.json({
        success: true,
        filename: originalName,
        environment: environmentData,
        fileType: 'vmware_csv',
        message: 'VMware CSV file processed successfully with environment data'
      });
    } else {
      throw new Error('Unsupported file format. Please upload an Excel (.xlsx/.xls) RVTools export or CSV file.');
    }
    
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

/**
 * Generate environment data from Excel RVTools export when Rust parser is not available
 */
function generateEnvironmentFromExcel(jsonData, filename) {
  // Analyze the Excel data to extract meaningful information
  const vms = jsonData.filter(row => row && (row['VM'] || row['VM Name'] || row['Name']));
  
  // Group VMs by cluster
  const clusterMap = new Map();
  const hostMap = new Map();
  
  vms.forEach(vm => {
    const clusterName = vm['Cluster'] || vm['cluster'] || 'Default-Cluster';
    const hostName = vm['Host'] || vm['ESX Host'] || vm['hostname'] || 'Unknown-Host';
    const vmName = vm['VM'] || vm['VM Name'] || vm['Name'] || 'Unknown-VM';
    const powerState = vm['Powerstate'] || vm['Power State'] || vm['state'] || 'poweredOn';
    const cpus = parseInt(vm['CPUs'] || vm['Num CPUs'] || vm['vCPU'] || '2') || 2;
    const memoryMB = parseInt(vm['Memory'] || vm['Memory MB'] || vm['Provisioned MB'] || '4096') || 4096;
    const memoryGB = Math.round(memoryMB / 1024 * 100) / 100;
    const os = vm['OS'] || vm['Guest OS'] || vm['OS according to the VMware Tools'] || 'Unknown';
    
    // Track cluster
    if (!clusterMap.has(clusterName)) {
      clusterMap.set(clusterName, {
        name: clusterName,
        vms: [],
        hosts: new Set(),
        totalCPUs: 0,
        totalMemoryGB: 0,
        totalVMs: 0
      });
    }
    
    // Track host
    if (!hostMap.has(hostName)) {
      hostMap.set(hostName, {
        name: hostName,
        cluster: clusterName,
        cpuCores: parseInt(vm['Host CPU Cores'] || vm['# CPU'] || '24') || 24,
        memoryGB: Math.round((parseInt(vm['Host Memory'] || vm['Host Memory MB'] || '131072') || 131072) / 1024),
        vms: []
      });
    }
    
    const cluster = clusterMap.get(clusterName);
    const host = hostMap.get(hostName);
    
    cluster.hosts.add(hostName);
    cluster.totalCPUs += cpus;
    cluster.totalMemoryGB += memoryGB;
    cluster.totalVMs += 1;
    cluster.vms.push({
      id: `vm-${cluster.vms.length + 1}`,
      name: vmName,
      vcpus: cpus,
      memory_gb: memoryGB,
      power_state: powerState.toLowerCase(),
      guest_os: os,
      host: hostName
    });
    
    host.vms.push(vmName);
  });
  
  // Generate clusters with calculated metrics
  const clusters = Array.from(clusterMap.values()).map(cluster => {
    const hosts = Array.from(cluster.hosts).map(hostName => {
      const host = hostMap.get(hostName);
      return {
        id: hostName.replace(/\s+/g, '-').toLowerCase(),
        name: hostName,
        cpu_cores: host.cpuCores,
        memory_gb: host.memoryGB,
        vms: host.vms.length,
        status: 'connected'
      };
    });
    
    const totalHostCores = hosts.reduce((sum, h) => sum + h.cpu_cores, 0);
    const totalHostMemory = hosts.reduce((sum, h) => sum + h.memory_gb, 0);
    
    // Calculate ratios with proper fallbacks to prevent 0.0:1 display
    const vcpuRatio = totalHostCores > 0 ? Math.max(cluster.totalCPUs / totalHostCores, 0.1) : 2.5; // Default to 2.5:1 if no data
    const memoryRatio = totalHostMemory > 0 ? Math.max(cluster.totalMemoryGB / totalHostMemory, 0.1) : 1.2; // Default to 1.2:1 if no data
    
    return {
      id: cluster.name.replace(/\s+/g, '-').toLowerCase(),
      name: cluster.name,
      hosts: hosts,
      vms: cluster.vms,
      metrics: {
        total_hosts: hosts.length,
        total_vms: cluster.totalVMs,
        total_vcpus: cluster.totalCPUs,
        total_pcpu_cores: totalHostCores,
        total_memory_gb: totalHostMemory,
        provisioned_memory_gb: cluster.totalMemoryGB,
        current_vcpu_pcpu_ratio: vcpuRatio,
        memory_overcommit_ratio: memoryRatio
      }
    };
  });
  
  // Calculate summary metrics
  const totalHosts = clusters.reduce((sum, c) => sum + c.metrics.total_hosts, 0);
  const totalVMs = clusters.reduce((sum, c) => sum + c.metrics.total_vms, 0);
  const totalPCores = clusters.reduce((sum, c) => sum + c.metrics.total_pcpu_cores, 0);
  const totalMemory = clusters.reduce((sum, c) => sum + c.metrics.total_memory_gb, 0);
  const totalVCPUs = clusters.reduce((sum, c) => sum + c.metrics.total_vcpus, 0);
  const totalProvisionedMemory = clusters.reduce((sum, c) => sum + c.metrics.provisioned_memory_gb, 0);
  
  return {
    id: `env-${Date.now()}`,
    name: filename.replace(/\.[^/.]+$/, ''),
    parsed_at: new Date().toISOString(),
    total_hosts: totalHosts,
    total_vms: totalVMs,
    clusters: clusters,
    summary_metrics: {
      total_pcores: totalPCores,
      total_vcpus: totalVCPUs,
      total_memory_gb: totalMemory,
      total_consumed_memory_gb: totalProvisionedMemory,
      overall_vcpu_pcpu_ratio: totalPCores > 0 ? Math.max(totalVCPUs / totalPCores, 0.1) : 2.5,
      overall_memory_overcommit_ratio: totalMemory > 0 ? Math.max(totalProvisionedMemory / totalMemory, 0.1) : 1.2
    }
  };
}

/**
 * Parse RVTools Excel file using the Rust CLI parser
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<Object>} - Parsed environment data
 */
function parseRVToolsFile(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(RVTOOLS_CLI_PATH, [filePath]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse JSON output: ${parseError.message}`));
        }
      } else {
        reject(new Error(`RVTools parser failed with code ${code}: ${stderr || 'Unknown error'}`));
      }
    });
    
    child.on('error', (error) => {
      reject(new Error(`Failed to start RVTools parser: ${error.message}`));
    });
  });
}

// Hardware basket storage (in production, this would be a database)
const hardwareBaskets = [];

// Hardware basket API endpoints
app.get('/api/hardware-baskets', (req, res) => {
  console.log('📦 GET /api/hardware-baskets - Fetching all hardware baskets');
  res.json(hardwareBaskets);
});

app.post('/api/hardware-baskets/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📦 POST /api/hardware-baskets/upload - Processing hardware basket upload');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const { vendor, quarter, year } = req.body;
    
    console.log(`Processing hardware basket: ${originalName} (${vendor} Q${quarter} ${year})`);

    // Process Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Parse hardware basket data - Look for the main data worksheet
    const models = [];
    const configurations = [];
    
    // Find the main pricing worksheet (usually "Dell Lot Pricing", "Pricing", or similar)
    let dataWorksheet = null;
    for (const worksheet of workbook.worksheets) {
      const name = worksheet.name.toLowerCase();
      if (name.includes('pricing') || name.includes('lot') || name.includes('config') || name.includes('server')) {
        dataWorksheet = worksheet;
        break;
      }
    }
    
    // If no specific worksheet found, use the first one with substantial data
    if (!dataWorksheet) {
      dataWorksheet = workbook.worksheets.find(ws => ws.rowCount > 10) || workbook.worksheets[0];
    }
    
    console.log(`Using worksheet: "${dataWorksheet.name}" with ${dataWorksheet.rowCount} rows`);
    
    // Find header row by looking for common hardware terms
    let headerRowNumber = 1;
    let headers = [];
    
    for (let rowNumber = 1; rowNumber <= Math.min(10, dataWorksheet.rowCount); rowNumber++) {
      const row = dataWorksheet.getRow(rowNumber);
      const rowValues = [];
      let hasHardwareTerms = 0;
      
      row.eachCell((cell, colNumber) => {
        if (cell.value) {
          const value = cell.value.toString().toLowerCase();
          rowValues.push(cell.value.toString());
          
          // Count hardware-related terms
          if (value.includes('lot') || value.includes('description') || value.includes('item') || 
              value.includes('specification') || value.includes('price') || value.includes('model') ||
              value.includes('sku') || value.includes('part')) {
            hasHardwareTerms++;
          }
        }
      });
      
      // If this row has multiple hardware terms, it's likely the header
      if (hasHardwareTerms >= 3 && rowValues.length >= 5) {
        headerRowNumber = rowNumber;
        headers = rowValues;
        console.log(`Found header row ${rowNumber}: [${headers.slice(0, 5).join(' | ')}...]`);
        break;
      }
    }
    
    // If no clear header found, use a sensible default
    if (headers.length === 0) {
      headerRowNumber = 1;
      const headerRow = dataWorksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value ? cell.value.toString() : `Column${colNumber}`;
      });
    }
    
    // Process data rows starting after the header
    let processedCount = 0;
    for (let rowNumber = headerRowNumber + 1; rowNumber <= dataWorksheet.rowCount; rowNumber++) {
      const row = dataWorksheet.getRow(rowNumber);
      const rowData = {};
      let hasData = false;
      
      row.eachCell((cell, colNumber) => {
        if (headers[colNumber]) {
          const value = cell.value ? cell.value.toString().trim() : '';
          rowData[headers[colNumber]] = value;
          if (value && value !== '[object Object]') {
            hasData = true;
          }
        }
      });
      
      if (hasData && processedCount < 100) { // Limit to first 100 items for performance
        // Extract model information with better field mapping
        const lotDescription = rowData['Lot Description'] || rowData['Description'] || rowData['Item'] || '';
        const item = rowData['Item'] || rowData['Product'] || rowData['Model'] || '';
        const specification = rowData['Specification'] || rowData['Specs'] || rowData['Config'] || '';
        const format = rowData['Dell Format or model'] || rowData['Format'] || rowData['Model'] || '';
        
        // Determine model name from available fields
        let modelName = 'Unknown Model';
        if (lotDescription && lotDescription.length > 5 && !lotDescription.toLowerCase().includes('server')) {
          modelName = lotDescription;
        } else if (format && format.length > 2) {
          modelName = format;
        } else if (item && item.length > 5) {
          modelName = item;
        } else if (specification && specification.length > 10) {
          modelName = specification.substring(0, 50);
        }
        
        // Extract category and form factor from description
        let category = 'Server';
        let formFactor = 'N/A';
        
        const desc = (lotDescription + ' ' + specification).toLowerCase();
        if (desc.includes('rack')) formFactor = 'Rack';
        else if (desc.includes('tower')) formFactor = 'Tower';
        else if (desc.includes('blade')) formFactor = 'Blade';
        
        if (desc.includes('1u')) formFactor = '1U Rack';
        else if (desc.includes('2u')) formFactor = '2U Rack';
        
        // Extract pricing
        const listPrice = rowData['Listprice'] || rowData['List Price'] || '0';
        const netPrice = rowData['Net Price US$'] || rowData['Net Price'] || rowData['Sell price'] || '0';
        
        // Create model entry
        const model = {
          id: `model_${models.length + 1}`,
          name: modelName,
          category: category,
          formFactor: formFactor,
          vendor: vendor || 'Unknown',
          price: netPrice || listPrice || '0',
          specifications: {
            lotDescription: lotDescription,
            item: item,
            specification: specification,
            format: format,
            listPrice: listPrice,
            netPrice: netPrice,
            ...rowData
          }
        };
        
        models.push(model);
        
        // Create configuration from model
        const config = {
          id: `config_${configurations.length + 1}`,
          model_id: model.id,
          configuration: rowData
        };
        configurations.push(config);
        
        processedCount++;
      }
    }
    
    // Create hardware basket entry
    const basketId = `basket_${Date.now()}`;
    const hardwareBasket = {
      id: basketId,
      name: `${vendor} Q${quarter} ${year}`,
      vendor: vendor || 'Unknown',
      quarter: quarter || 'Unknown',
      year: parseInt(year) || new Date().getFullYear(),
      filename: originalName,
      created_at: new Date().toISOString(),
      models: models,
      configurations: configurations
    };
    
    hardwareBaskets.push(hardwareBasket);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    console.log(`Successfully processed hardware basket: ${models.length} models, ${configurations.length} configurations`);
    
    res.json({
      success: true,
      basket_id: basketId,
      total_models: models.length,
      total_configurations: configurations.length,
      message: 'Hardware basket uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error processing hardware basket:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Failed to process hardware basket',
      message: error.message
    });
  }
});

app.get('/api/hardware-baskets/:basketId/models', (req, res) => {
  console.log(`📦 GET /api/hardware-baskets/${req.params.basketId}/models - Fetching models`);
  
  const basket = hardwareBaskets.find(b => b.id === req.params.basketId);
  if (!basket) {
    return res.status(404).json({ error: 'Hardware basket not found' });
  }
  
  res.json(basket.models || []);
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
