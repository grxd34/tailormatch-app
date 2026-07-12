@echo off
echo Updating Mobile App API Configuration
echo =====================================
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

echo Updating mobile app API configuration...
echo.

REM Navigate to mobile app directory
cd TailorMatchMobile\src\services

echo Current API baseURL in api.ts:
findstr "baseURL" api.ts
echo.

echo Updating to use your network IP: %ip%
powershell -Command "(Get-Content api.ts) -replace 'http://192.168.1.132:8000/api', 'http://%ip%:8000/api' | Set-Content api.ts"

echo.
echo Updated API baseURL in api.ts:
findstr "baseURL" api.ts
echo.

echo ================================================
echo MOBILE APP CONFIGURATION UPDATED!
echo ================================================
echo.
echo Your mobile app will now connect to: http://%ip%:8000/api
echo.
echo Next steps:
echo 1. Restart your mobile app (Expo)
echo 2. Test login functionality
echo.

pause
