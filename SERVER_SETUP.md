# LCM Designer - Backend Server Setup

## Quick Start

The LCM Designer application consists of two components:
1. **Frontend** (React/Vite) - Port 1420
2. **Backend** (Node.js/Express) - Port 3001

### Starting Both Servers

#### Option 1: Using the startup script (Recommended)
```bash
./start-dev.sh
```

#### Option 2: Manual startup
```bash
# Terminal 1 - Start backend server
cd server
node server.js

# Terminal 2 - Start frontend
npm run dev
```

#### Option 3: Using npm scripts
```bash
# Terminal 1 - Start backend
npm run server

# Terminal 2 - Start frontend  
npm run dev
```

## Backend Server Features

The Node.js backend server provides:
- **Excel file processing** - Converts .xlsx/.xls files to CSV
- **VMware data parsing** - Processes RVTools exports
- **File upload handling** - Supports up to 50MB files
- **CORS enabled** - Allows frontend connections

### API Endpoints

- `GET /health` - Health check
- `POST /api/convert-excel` - Convert Excel to CSV
- `POST /api/process-vmware` - Process VMware/RVTools files

## File Processing Flow

1. **Excel files (.xlsx/.xls)**: 
   - Uploaded to backend server
   - Converted to CSV
   - Returned to frontend for processing

2. **CSV files (.csv)**: 
   - Processed directly by frontend
   - No backend server required

3. **RVTools exports**: 
   - Can be uploaded as Excel or CSV
   - Backend provides enhanced parsing for Excel formats

## Troubleshooting

### Backend Server Issues
```bash
# Check if server is running
curl http://localhost:3001/health

# View server logs
cd server && node server.js

# Install server dependencies
cd server && npm install
```

### Port Conflicts
- Frontend: Port 1420 (configurable in vite.config.ts)
- Backend: Port 3001 (configurable in server/server.js)

### Development Notes
- Backend server automatically handles CORS for localhost:1420
- File uploads are limited to 50MB
- Temporary files are stored in `server/uploads/`
