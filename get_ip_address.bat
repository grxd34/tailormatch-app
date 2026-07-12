@echo off
echo Finding your computer's IP address...
echo =====================================
echo.

REM Get the IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set ip=%%a
    goto :found
)

:found
REM Remove leading spaces
set ip=%ip: =%

echo Your computer's IP address is: %ip%
echo.
echo IMPORTANT: Update the following files with your IP address:
echo.
echo 1. TailorMatchMobile\src\services\api.ts
echo    Change: baseURL: 'http://192.168.1.132:8000/api'
echo    To:     baseURL: 'http://%ip%:8000/api'
echo.
echo 2. tailormatch_backend\tailormatch_backend\settings.py
echo    Add your IP to ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS
echo.
echo 3. tailormatch_frontend\src\services\api.ts
echo    Change: API_BASE_URL = 'http://192.168.70.101:8000/api'
echo    To:     API_BASE_URL = 'http://%ip%:8000/api'
echo.
echo After updating these files, restart your backend and mobile app.
echo.
pause
