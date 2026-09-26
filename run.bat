@echo off
title Lexi Application Runner
echo ===================================================
echo Starting Lexi Services
echo ===================================================

echo.
echo [1/2] Starting Python Backend (uvicorn)...
start "Lexi Backend" cmd /c "uv run uvicorn backend.main:app --reload"

echo.
echo [2/2] Starting React Frontend (bun)...
start "Lexi Frontend" cmd /k "cd frontend && bun run dev"

echo.
echo ===================================================
echo Lexi is now running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000 (Check terminal for exact port)
echo.
echo Keep this window open. Close the newly opened terminal windows to stop the services.
echo ===================================================
pause
