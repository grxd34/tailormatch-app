@echo off
echo Checking Windows Firewall for TailorMatch Backend...
echo ===================================================
echo.

REM Check if Windows Firewall is enabled
echo 1. Checking if Windows Firewall is enabled...
netsh advfirewall show allprofiles state | findstr "State"
echo.

REM Check if port 8000 is blocked
echo 2. Checking if port 8000 is blocked...
netsh advfirewall firewall show rule name=all | findstr "8000"
echo.

REM Check current firewall rules for port 8000
echo 3. Current firewall rules for port 8000:
netsh advfirewall firewall show rule name=all | findstr /C:"8000" /C:"TailorMatch"
echo.

echo 4. Testing if port 8000 is accessible...
echo Trying to connect to localhost:8000...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 5; Write-Host 'SUCCESS: Backend is accessible on localhost:8000' } catch { Write-Host 'ERROR: Cannot connect to localhost:8000 - Backend might not be running or blocked' }"
echo.

echo 5. Checking network connectivity...
ipconfig | findstr "IPv4"
echo.

echo ===================================================
echo FIREWALL CONFIGURATION RECOMMENDATIONS:
echo ===================================================
echo.
echo If the backend is not accessible, you may need to:
echo.
echo 1. Add a firewall rule for port 8000:
echo    netsh advfirewall firewall add rule name="TailorMatch Backend" dir=in action=allow protocol=TCP localport=8000
echo.
echo 2. Allow Python through firewall:
echo    netsh advfirewall firewall add rule name="Python" dir=in action=allow program="C:\Python\python.exe"
echo.
echo 3. Temporarily disable firewall for testing (NOT RECOMMENDED for production):
echo    netsh advfirewall set allprofiles state off
echo.
echo 4. Check if antivirus is blocking the connection
echo.
echo ===================================================
echo.

pause
