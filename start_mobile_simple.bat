@echo off
echo Starting TailorMatch Mobile App
echo =================================
echo.

echo 1. CHECKING NODE.JS...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✓ Node.js is installed
)

echo.
echo 2. NAVIGATING TO MOBILE APP DIRECTORY...
cd /d "F:\final\TailorMatchMobile"

echo 3. CHECKING DEPENDENCIES...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies are installed
)

echo.
echo 4. STARTING EXPO DEVELOPMENT SERVER...
echo ======================================
echo.
echo Your mobile app will be available at:
echo - Scan QR code with Expo Go app
echo - Press 'a' for Android emulator
echo - Press 'i' for iOS simulator
echo - Press 'w' for web browser
echo.
echo To stop the server, press Ctrl+C
echo.

npx expo start

pause
