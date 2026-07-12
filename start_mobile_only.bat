@echo off
echo Starting TailorMatch Mobile-Only Version...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo Your IP Address: %LOCAL_IP%
echo Mobile URL: http://%LOCAL_IP%:3000
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd tailormatch_backend && python manage.py runserver 0.0.0.0:8000"

echo Starting Frontend Server (Mobile Optimized)...
start "Frontend Server" cmd /k "cd tailormatch_frontend && npm start"

echo.
echo Both servers are starting...
echo.
echo To access on mobile:
echo 1. Make sure your mobile is on the same WiFi network
echo 2. Open mobile browser
echo 3. Go to: http://%LOCAL_IP%:3000
echo.
echo Mobile Features:
echo - Hidden sidebar by default
echo - Bottom navigation for easy access
echo - Touch-optimized interface
echo - Mobile-first design
echo.

pause
