# PowerShell script to restart dev server

Write-Host "Stopping any running dev servers..." -ForegroundColor Yellow

# Find processes on ports 1420 and 1421
$ports = @(1420, 1421)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing process $($proc.ProcessName) (PID: $($proc.Id)) on port $port" -ForegroundColor Red
                Stop-Process -Id $proc.Id -Force
            }
        }
    }
}

# Also kill any stray node/vite processes
Get-Process | Where-Object {$_.ProcessName -match "node|vite"} | ForEach-Object {
    Write-Host "Killing $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "`nWaiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`nStarting frontend dev server..." -ForegroundColor Green
Set-Location frontend
Start-Process cmd -ArgumentList "/k", "npm run dev"

Write-Host "`nDev server starting in new window..." -ForegroundColor Green
Write-Host "Visit http://localhost:1420 once it's ready" -ForegroundColor Cyan
