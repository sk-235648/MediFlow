@echo off
title MediFlow Launcher
echo ========================================================
echo        MediFlow - Autonomous Healthcare Triage Agent
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "MediFlow Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "MediFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are booting in separate windows!
echo - Frontend UI: http://localhost:3000
echo - Backend Docs: http://localhost:8000/docs
echo.
pause

