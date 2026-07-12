@echo off
echo TailorMatch Network Diagnostic Tool
echo ===================================
echo.

echo 1. CHECKING YOUR IP ADDRESS...
echo ===============================
ipconfig | findstr "IPv4"
echo.

echo 2. CHECKING FIREWALL STATUS...
echo =============================
netsh advfirewall show allprofiles state
echo.

echo 3. CHECKING FIREWALL RULES FOR TAILORMATCH...
echo =============================================
netsh advfirewall firewall show rule name=all | findstr /C:"TailorMatch" /C:"8000" /C:"8081" /C:"3000"
echo.

echo 4. TESTING LOCAL CONNECTIVITY...
echo ===============================
echo Testing localhost:8000 (Backend)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 5; Write-Host '✓ Backend is running and accessible on localhost:8000' } catch { Write-Host '✗ Backend is NOT accessible on localhost:8000' }"
echo.

echo Testing localhost:3000 (Frontend)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5; Write-Host '✓ Frontend is running and accessible on localhost:3000' } catch { Write-Host '✗ Frontend is NOT accessible on localhost:3000' }"
echo.

echo Testing localhost:8081 (Expo)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8081' -TimeoutSec 5; Write-Host '✓ Expo server is running and accessible on localhost:8081' } catch { Write-Host '✗ Expo server is NOT accessible on localhost:8081' }"
echo.

echo 5. CHECKING NETWORK ADAPTERS...
echo ==============================
echo Active network adapters:
ipconfig | findstr /C:"Ethernet adapter" /C:"Wireless LAN adapter" /C:"Wi-Fi"
echo.

echo 6. CHECKING FOR ANTIVIRUS BLOCKING...
echo ====================================
echo Common antivirus programs that might block connections:
tasklist | findstr /I "avast\|norton\|mcafee\|kaspersky\|bitdefender\|windows defender"
echo.

echo 7. RECOMMENDATIONS...
echo ====================
echo.
echo If your mobile app still can't connect:
echo.
echo 1. Make sure your backend is running on 0.0.0.0:8000 (not just localhost:8000)
echo 2. Check that your mobile device is on the same WiFi network
echo 3. Try temporarily disabling Windows Firewall for testing:
echo    netsh advfirewall set allprofiles state off
echo    (Remember to re-enable it later!)
echo 4. Check if your antivirus has a firewall that's blocking connections
echo 5. Make sure your router isn't blocking device-to-device communication
echo.
echo To fix firewall issues, run: fix_firewall.bat
echo.

pause
