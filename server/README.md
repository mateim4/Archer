# LCM Designer Server

Backend service for processing Excel files in the LCM Designer web application.

## Features

- **Excel to CSV conversion** - Automatically converts .xlsx and .xls files to CSV
- **VMware file processing** - Handles RVTools exports and vSphere CSV files
- **File validation** - Ensures uploaded files are valid VMware/RVTools data
- **CORS enabled** - Works seamlessly with the frontend web application

## Quick Start

### Starting the Server

From the main project directory:

```bash
# Start the server
npm run server

# Or start in development mode with auto-restart
npm run server:dev
```

The server will start on `http://localhost:3001`

### Endpoints

- **Health Check**: `GET /health`
- **Excel Conversion**: `POST /api/convert-excel`
- **VMware Processing**: `POST /api/process-vmware`

## How It Works

### With Server (Recommended)
1. **Upload Excel files directly** - RVTools .xlsx files work seamlessly
2. **Automatic conversion** - Server converts Excel to CSV behind the scenes
3. **Enhanced processing** - Validates VMware data structure
4. **Better performance** - Server-side processing is faster for large files

### Without Server (Fallback)
1. **CSV files only** - Must export RVTools data as CSV manually
2. **Client-side processing** - Uses browser FileReader API
3. **Limited file size** - Browser memory constraints apply

## File Support

### Supported Formats
- **.xlsx** - Excel 2007+ (requires server)
- **.xls** - Excel 97-2003 (requires server)
- **.csv** - Comma-separated values (works with or without server)
- **.txt** - Tab-separated or comma-separated text files

### File Size Limits
- **Server processing**: 50MB maximum
- **Client processing**: Limited by browser memory (~10-20MB typical)

## Server Status Indicator

The web app automatically detects server availability and shows:
- ✅ **Green checkmark**: Server available, Excel files supported
- ⚠️ **Yellow warning**: Server offline, CSV files only

## Technical Details

### Dependencies
- **Express** - Web server framework
- **Multer** - File upload handling
- **xlsx** - Excel file parsing
- **CORS** - Cross-origin resource sharing

### Architecture
```
Frontend (React) → Server (Node.js) → Excel Processing (xlsx) → CSV Output → Frontend
```

## Troubleshooting

### Server Won't Start
```bash
cd server
npm install  # Install dependencies
npm start    # Start server
```

### Port Already in Use
The server uses port 3001 by default. If this port is busy:
1. Stop other services using port 3001
2. Or modify `server/server.js` to use a different port

### CORS Issues
The server is configured to allow requests from:
- `http://localhost:1420` (Vite dev server)
- `http://localhost:3000` (Alternative React dev server)

### File Upload Fails
Check that:
1. File is a valid Excel or CSV file
2. File size is under 50MB
3. Server is running and accessible
4. No firewall blocking port 3001

## Production Deployment

For production deployment:

1. **Environment variables**:
   ```bash
   PORT=3001
   NODE_ENV=production
   ```

2. **Process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start server/server.js --name lcm-server
   ```

3. **Reverse proxy** (Nginx example):
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3001/api/;
   }
   ```

## Security Considerations

- **File validation** - Only Excel and CSV files are accepted
- **File size limits** - 50MB maximum to prevent abuse
- **Temporary storage** - Uploaded files are automatically deleted after processing
- **CORS restrictions** - Only configured origins can access the API

## Development

To modify the server:

1. **Edit server code**: `server/server.js`
2. **Install new dependencies**: `cd server && npm install <package>`
3. **Test endpoints**: Use Postman or curl to test API endpoints
4. **Auto-restart**: Use `npm run server:dev` for development with auto-restart
