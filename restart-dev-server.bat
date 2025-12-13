@echo off
echo Killing any running Node.js dev servers...

REM Kill any node processes running on port 1420 or 1421
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":1420"') do (
    echo Killing process on port 1420: %%a
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":1421"') do (
    echo Killing process on port 1421: %%a
    taskkill /F /PID %%a 2>nul
)

REM Also kill any node processes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM vite.exe 2>nul

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting frontend dev server...
cd frontend
start "Archer Frontend" cmd /k "npm run dev"

echo.
echo Dev server starting in new window...
echo Visit http://localhost:1420 once it's ready
echo.
pause
