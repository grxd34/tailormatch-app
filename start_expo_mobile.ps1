# TailorMatch Mobile App Startup Script (Expo)
Write-Host "Starting TailorMatch Mobile App with Expo..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to Expo mobile app directory
Set-Location "TailorMatchMobile"

# Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start Expo development server
Write-Host "Starting Expo development server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "1. Scan the QR code with Expo Go app on your phone" -ForegroundColor White
Write-Host "2. Press 'a' to open Android emulator" -ForegroundColor White
Write-Host "3. Press 'i' to open iOS simulator" -ForegroundColor White
Write-Host "4. Press 'w' to open in web browser" -ForegroundColor White
Write-Host ""

npx expo start

Read-Host "Press Enter to continue"
