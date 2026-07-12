@echo off
echo Mobile Connectivity Diagnostic Tool
echo ===================================
echo.

echo 1. CHECKING BACKEND STATUS...
echo ============================
echo Checking if Django backend is running on port 8000...
netstat -an | findstr ":8000"
if %errorlevel% equ 0 (
    echo ✓ Port 8000 is in use
) else (
    echo ✗ Port 8000 is NOT in use - Backend might not be running
)
echo.

echo 2. CHECKING NETWORK INTERFACE...
echo ================================
echo Checking what IP addresses Django is listening on...
netstat -an | findstr ":8000" | findstr "LISTENING"
echo.

echo 3. GETTING YOUR COMPUTER'S IP ADDRESS...
echo ======================================
echo Your computer's network IP addresses:
ipconfig | findstr "IPv4"
echo.

echo 4. TESTING LOCAL ACCESS...
echo ==========================
echo Testing if backend is accessible from localhost...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 5; Write-Host '✓ Backend accessible from localhost' } catch { Write-Host '✗ Backend NOT accessible from localhost' }"
echo.

echo 5. TESTING NETWORK ACCESS...
echo ============================
echo Testing if backend is accessible from network IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Testing http://!ip!:8000...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://!ip!:8000' -TimeoutSec 5; Write-Host '✓ Backend accessible from network IP' } catch { Write-Host '✗ Backend NOT accessible from network IP' }"
    goto :found_ip
)
:found_ip
echo.

echo 6. CHECKING FIREWALL RULES...
echo ============================
echo Checking if port 8000 is allowed through firewall...
netsh advfirewall firewall show rule name=all | findstr "8000"
echo.

echo 7. CHECKING WINDOWS FIREWALL STATUS...
echo =====================================
netsh advfirewall show allprofiles state
echo.

echo ================================================
echo DIAGNOSTIC RESULTS:
echo ================================================
echo.
echo If you see "✗ Backend NOT accessible from network IP":
echo   → Your backend is only running on localhost, not on network interface
echo   → Solution: Make sure Django runs with 0.0.0.0:8000 (not localhost:8000)
echo.
echo If you see "✗ Port 8000 is NOT in use":
echo   → Your backend is not running at all
echo   → Solution: Start your backend with start_backend.bat
echo.
echo If backend is accessible but mobile still can't connect:
echo   → Check if mobile device is on same WiFi network
echo   → Check if router blocks device-to-device communication
echo   → Try using your computer's IP address in mobile app
echo.

pause
