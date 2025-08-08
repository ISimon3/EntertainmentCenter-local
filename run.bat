@echo off
echo Starting Services...

start "Backend" cmd /k ".venv\Scripts\python.exe backend\run.py"

timeout /t 5 /nobreak >nul

start "Frontend" cmd /k "cd frontend && python -m http.server 8080"

timeout /t 3 /nobreak >nul

start http://localhost:8080

echo Services started!
pause
