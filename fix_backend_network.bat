@echo off
echo Fixing Backend Network Configuration
echo ===================================
echo.

echo 1. STOPPING ANY EXISTING BACKEND PROCESSES...
echo ============================================
echo Stopping any Django processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo.

echo 2. CHECKING DJANGO CONFIGURATION...
echo ==================================
echo Verifying Django settings allow network access...
cd tailormatch_backend
echo Current ALLOWED_HOSTS in settings.py:
findstr "ALLOWED_HOSTS" tailormatch_backend\settings.py
echo.

echo 3. STARTING BACKEND ON NETWORK INTERFACE...
echo ==========================================
echo Starting Django backend on 0.0.0.0:8000 (accessible from network)...
echo.
echo IMPORTANT: This will make your backend accessible from:
echo - http://localhost:8000 (from your computer)
echo - http://YOUR_IP:8000 (from mobile devices on same network)
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start Django on network interface
echo Starting Django server...
python manage.py runserver 0.0.0.0:8000

pause
