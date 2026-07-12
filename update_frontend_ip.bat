@echo off
echo Updating Frontend API Configuration
echo ====================================
echo.

REM Get the computer's IP address
echo Finding your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    goto :found_ip
)
:found_ip

echo Your computer's IP address is: %ip%
echo.

echo Updating frontend API configuration...
echo.

REM Update the frontend API configuration
cd tailormatch_frontend\src\services

echo Current API_BASE_URL in api.ts:
findstr "API_BASE_URL" api.ts
echo.

echo Updating to use your network IP: %ip%
powershell -Command "(Get-Content api.ts) -replace 'http://192.168.70.101:8000/api', 'http://%ip%:8000/api' | Set-Content api.ts"

echo.
echo Updated API_BASE_URL in api.ts:
findstr "API_BASE_URL" api.ts
echo.

echo ================================================
echo FRONTEND CONFIGURATION UPDATED!
echo ================================================
echo.
echo Your frontend will now connect to: http://%ip%:8000/api
echo.
echo Next steps:
echo 1. Restart your frontend development server
echo 2. Test the connection
echo.

pause
