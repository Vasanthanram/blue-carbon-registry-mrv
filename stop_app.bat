@echo off
cd /d "%~dp0"
echo ========================================================
echo  Stopping Blue Carbon Registry ^& MRV System
echo ========================================================
echo.

echo [1/2] Stopping FastAPI Backend (Port 8000)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do taskkill /F /PID %%a >nul 2>&1

echo [2/2] Stopping Vite Frontend (Port 3000)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001"') do taskkill /F /PID %%a >nul 2>&1

echo.
echo ========================================================
echo  All services have been stopped successfully!
echo ========================================================
timeout /t 3 >nul

