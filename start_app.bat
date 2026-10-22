@echo off
echo ========================================================
echo  Starting Blue Carbon Registry & MRV System
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Blue Carbon - FastAPI Backend" cmd /k ".\venv\Scripts\uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting Vite Frontend on http://localhost:3000 ...
start "Blue Carbon - Vite Frontend" cmd /k "npm --prefix frontend run dev -- --host 0.0.0.0 --port 3000"

echo.
echo Application started!
echo - Web Dashboard:  http://localhost:3000  (or http://localhost:8000)
echo - API Docs:       http://localhost:8000/docs
echo ========================================================
pause

