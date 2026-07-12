@echo off
echo Fixing Windows Firewall for TailorMatch Backend...
echo ================================================
echo.

echo Adding firewall rules for TailorMatch Backend...
echo.

REM Add rule for port 8000 (Django backend)
echo 1. Adding firewall rule for port 8000...
netsh advfirewall firewall add rule name="TailorMatch Backend Port 8000" dir=in action=allow protocol=TCP localport=8000
if %errorlevel% equ 0 (
    echo    ✓ Successfully added rule for port 8000
) else (
    echo    ✗ Failed to add rule for port 8000
)
echo.

REM Add rule for port 8081 (Expo mobile development server)
echo 2. Adding firewall rule for port 8081 (Expo)...
netsh advfirewall firewall add rule name="Expo Mobile Dev Server Port 8081" dir=in action=allow protocol=TCP localport=8081
if %errorlevel% equ 0 (
    echo    ✓ Successfully added rule for port 8081
) else (
    echo    ✗ Failed to add rule for port 8081
)
echo.

REM Add rule for port 3000 (React frontend)
echo 3. Adding firewall rule for port 3000...
netsh advfirewall firewall add rule name="React Frontend Port 3000" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo    ✓ Successfully added rule for port 3000
) else (
    echo    ✗ Failed to add rule for port 3000
)
echo.

REM Add rule for Python executable
echo 4. Adding firewall rule for Python...
for /f "tokens=*" %%i in ('where python') do (
    echo    Found Python at: %%i
    netsh advfirewall firewall add rule name="Python Executable" dir=in action=allow program="%%i"
    if %errorlevel% equ 0 (
        echo    ✓ Successfully added rule for Python
    ) else (
        echo    ✗ Failed to add rule for Python
    )
)
echo.

REM Add rule for Node.js
echo 5. Adding firewall rule for Node.js...
for /f "tokens=*" %%i in ('where node') do (
    echo    Found Node.js at: %%i
    netsh advfirewall firewall add rule name="Node.js Executable" dir=in action=allow program="%%i"
    if %errorlevel% equ 0 (
        echo    ✓ Successfully added rule for Node.js
    ) else (
        echo    ✗ Failed to add rule for Node.js
    )
)
echo.

echo ================================================
echo FIREWALL RULES ADDED SUCCESSFULLY!
echo ================================================
echo.
echo The following ports are now allowed through Windows Firewall:
echo - Port 8000: TailorMatch Backend (Django)
echo - Port 8081: Expo Mobile Development Server
echo - Port 3000: React Frontend
echo - Python and Node.js executables
echo.
echo You can now restart your backend and mobile app.
echo.
echo To verify the rules were added, run: check_firewall.bat
echo.

pause
