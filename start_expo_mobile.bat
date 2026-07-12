@echo off
echo Starting TailorMatch Mobile App with Expo...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to Expo mobile app directory
cd TailorMatchMobile

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start Expo development server
echo Starting Expo development server...
echo.
echo You can now:
echo 1. Scan the QR code with Expo Go app on your phone
echo 2. Press 'a' to open Android emulator
echo 3. Press 'i' to open iOS simulator
echo 4. Press 'w' to open in web browser
echo.

npx expo start

pause
