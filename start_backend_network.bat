@echo off
echo Starting TailorMatch Backend on Network Interface
echo ==================================================
echo.

REM Navigate to backend directory
cd /d "F:\final\tailormatch_backend"

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Get the computer's IP address
echo Getting your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    goto :found_ip
)
:found_ip

echo.
echo ==================================================
echo BACKEND STARTING ON NETWORK INTERFACE
echo ==================================================
echo.
echo Your computer's IP address: %ip%
echo.
echo Backend will be accessible at:
echo - http://localhost:8000 (from your computer)
echo - http://%ip%:8000 (from mobile devices)
echo.
echo ==================================================
echo.

REM Start Django on network interface (0.0.0.0:8000)
echo Starting Django server on 0.0.0.0:8000...
echo.
echo IMPORTANT: Keep this window open while using the mobile app!
echo To stop the server, press Ctrl+C
echo.

python manage.py runserver 0.0.0.0:8000

echo.
echo Backend server stopped.
pause
