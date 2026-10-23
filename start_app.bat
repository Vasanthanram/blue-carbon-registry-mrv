@echo off
cd /d "%~dp0"
echo ========================================================
echo  Starting Blue Carbon Registry ^& MRV System
echo ========================================================
echo.
echo [1/3] Freeing ports 8000 and 3000 if occupied...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Blue Carbon - FastAPI Backend" cmd /k "call .\venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

echo [3/3] Starting Vite Frontend on http://localhost:3000 ...
start "Blue Carbon - Vite Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application started!
echo - Web Dashboard:  http://localhost:3000
echo - API Docs:       http://localhost:8000/docs
echo.
echo To stop all services anytime, run: .\stop_app.bat
echo ========================================================
pause
