@echo off
echo 🚀 Starting TailorMatch Application...
echo =====================================

echo Starting backend in new window...
start "TailorMatch Backend" cmd /k "cd tailormatch_backend && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend in new window...
start "TailorMatch Frontend" cmd /k "cd tailormatch_frontend && npm start"

echo.
echo ✅ Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window (servers will continue running)
pause >nul
