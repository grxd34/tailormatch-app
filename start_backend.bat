@echo off
echo 🚀 Starting TailorMatch Backend...
echo =================================

cd tailormatch_backend

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start Django development server
echo Starting Django server on http://0.0.0.0:8000
echo Backend will be accessible at:
echo - http://localhost:8000 (from your computer)
echo - http://192.168.1.132:8000 (from mobile devices on same network)
echo.
python manage.py runserver 0.0.0.0:8000

pause
