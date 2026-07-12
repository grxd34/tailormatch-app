@echo off
echo Fixing Expo Metro Cache Issue
echo ==============================
echo.

echo 1. CLEANING NODE_MODULES...
echo ===========================
echo Removing node_modules and package-lock.json...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"

echo.
echo 2. CLEARING NPM CACHE...
echo ========================
npm cache clean --force

echo.
echo 3. REINSTALLING DEPENDENCIES...
echo ===============================
echo Installing fresh dependencies...
npm install

echo.
echo 4. INSTALLING MISSING METRO PACKAGES...
echo =======================================
echo Installing metro-cache and related packages...
npm install metro-cache metro-config metro-runtime

echo.
echo 5. STARTING EXPO...
echo ==================
echo Starting Expo development server...
npx expo start

pause
