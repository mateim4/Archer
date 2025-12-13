# Quick Restart Guide

## I cannot directly restart the server due to PowerShell 6+ not being available in this environment.

Please run ONE of the following commands in your terminal:

---

## Option 1: Use the Batch Script (Windows CMD - Recommended)

Double-click or run:
```
restart-dev-server.bat
```

This will:
1. Kill any processes on ports 1420/1421
2. Kill any Node.js processes
3. Start the dev server in a new window

---

## Option 2: Use PowerShell Script

Right-click `restart-dev-server.ps1` → "Run with PowerShell"

OR in PowerShell:
```powershell
.\restart-dev-server.ps1
```

---

## Option 3: Manual Commands

### Step 1: Kill existing server
```bash
# Find and kill process on port 1420
netstat -ano | findstr :1420
# Note the PID from the last column, then:
taskkill /F /PID <PID>

# Or kill all node processes
taskkill /F /IM node.exe
```

### Step 2: Start fresh server
```bash
cd frontend
npm run dev
```

---

## Option 4: Simple Restart (If server is in a terminal)

1. Find the terminal window running `npm run dev`
2. Press `Ctrl + C` to stop it
3. Run `npm run dev` again

---

## What to Expect

Once the server starts, you should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:1420/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Then visit: **http://localhost:1420**

---

## Testing Your Changes

Navigate to any of these views to see the new PageHeader layout:

- http://localhost:1420/app/approvals
- http://localhost:1420/app/my-requests
- http://localhost:1420/app/workflows
- http://localhost:1420/app/inventory
- http://localhost:1420/app/hardware-baskets

You should see:
✅ Clean PageHeader with icon at the top
✅ Title and subtitle properly formatted
✅ Action buttons in the top-right
✅ No floating headers
✅ Professional, consistent design
