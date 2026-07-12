@echo off
echo Mobile Network Connectivity Test
echo ================================
echo.

echo This script will help you test if your mobile device can reach your computer.
echo.
echo STEP 1: Find your computer's IP address
echo =======================================
echo Your computer's IP addresses:
ipconfig | findstr "IPv4"
echo.

echo STEP 2: Test from your computer
echo ===============================
echo Testing if backend is accessible from your computer's IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Testing http://!ip!:8000...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://!ip!:8000' -TimeoutSec 5; Write-Host '✓ SUCCESS: Backend is accessible at http://!ip!:8000' } catch { Write-Host '✗ FAILED: Backend is NOT accessible at http://!ip!:8000' }"
    goto :found_ip
)
:found_ip
echo.

echo STEP 3: Mobile device test instructions
echo =======================================
echo.
echo On your mobile device (phone/tablet):
echo.
echo 1. Make sure your mobile device is connected to the SAME WiFi network as your computer
echo 2. Open a web browser on your mobile device
echo 3. Go to: http://!ip!:8000
echo 4. You should see your Django backend response
echo.
echo If you see the Django backend page on your mobile device:
echo   ✓ Network connectivity is working
echo   ✓ Update your mobile app to use: http://!ip!:8000/api
echo.
echo If you get "This site can't be reached" or "Connection refused":
echo   ✗ Network connectivity issue
echo   ✗ Check firewall, router settings, or network configuration
echo.

echo STEP 4: Common solutions
echo ========================
echo.
echo If mobile can't reach your computer:
echo.
echo 1. Check Windows Firewall:
echo    - Run: fix_firewall.bat
echo    - Or manually allow port 8000 through firewall
echo.
echo 2. Check if backend is running on network interface:
echo    - Backend must run on 0.0.0.0:8000 (not localhost:8000)
echo    - Use: fix_backend_network.bat
echo.
echo 3. Check router settings:
echo    - Some routers block device-to-device communication
echo    - Try connecting both devices to mobile hotspot instead
echo.
echo 4. Check antivirus:
echo    - Some antivirus programs block network connections
echo    - Temporarily disable to test
echo.

pause
