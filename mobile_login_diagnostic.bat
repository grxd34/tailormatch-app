@echo off
echo Mobile App Login Diagnostic Tool
echo ================================
echo.

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

echo 1. CHECKING MOBILE APP API CONFIGURATION...
echo ============================================
cd TailorMatchMobile\src\services
echo Current mobile app API baseURL:
findstr "baseURL" api.ts
echo.

echo 2. CHECKING BACKEND CONNECTIVITY...
echo ===================================
echo Testing if backend is accessible from network...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%ip%:8000/api/' -TimeoutSec 5; Write-Host '✓ Backend API is accessible at http://%ip%:8000/api' } catch { Write-Host '✗ Backend API is NOT accessible at http://%ip%:8000/api' }"
echo.

echo 3. CHECKING BACKEND LOGIN ENDPOINT...
echo ====================================
echo Testing login endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%ip%:8000/api/auth/login/' -Method POST -ContentType 'application/json' -Body '{\"email\":\"test\",\"password\":\"test\"}' -TimeoutSec 5; Write-Host '✓ Login endpoint is working' } catch { Write-Host '✗ Login endpoint error:' $_.Exception.Message }"
echo.

echo 4. COMMON MOBILE LOGIN ISSUES...
echo ================================
echo.
echo If mobile login is still not working:
echo.
echo 1. Wrong IP Address:
echo    - Mobile app might be using old IP address
echo    - Solution: Run update_mobile_ip.bat
echo.
echo 2. Backend not running on network:
echo    - Backend must run on 0.0.0.0:8000 (not localhost:8000)
echo    - Solution: Use start_backend_network.bat
echo.
echo 3. CORS issues:
echo    - Backend CORS might not allow mobile app
echo    - Check tailormatch_backend/settings.py CORS_ALLOWED_ORIGINS
echo.
echo 4. Network connectivity:
echo    - Mobile device and computer must be on same WiFi
echo    - Check if router blocks device-to-device communication
echo.
echo 5. Expo development server:
echo    - Make sure Expo is running and mobile app is connected
echo    - Try refreshing the mobile app
echo.

echo ================================================
echo DIAGNOSTIC COMPLETE
echo ================================================
echo.
echo To fix mobile login issues:
echo 1. Run: update_mobile_ip.bat
echo 2. Restart mobile app
echo 3. Test login again
echo.

pause
