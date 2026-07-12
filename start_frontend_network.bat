@echo off
echo Starting TailorMatch Frontend on Network Interface
echo ===================================================
echo.

REM Navigate to frontend directory
cd /d "F:\final\tailormatch_frontend"

REM Get the computer's IP address
echo Finding your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    goto :found_ip
)
:found_ip

echo Your computer's IP address: %ip%
echo.

echo ==================================================
echo FRONTEND STARTING ON NETWORK INTERFACE
echo ==================================================
echo.
echo Frontend will be accessible at:
echo - http://localhost:3000 (from your computer)
echo - http://%ip%:3000 (from mobile devices)
echo.
echo Backend should be running at:
echo - http://%ip%:8000
echo.
echo ==================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start React development server
echo Starting React development server...
echo.
echo IMPORTANT: Keep this window open while using the frontend!
echo To stop the server, press Ctrl+C
echo.

npm start

echo.
echo Frontend server stopped.
pause
