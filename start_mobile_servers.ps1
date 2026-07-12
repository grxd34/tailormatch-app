# PowerShell script to start TailorMatch servers for mobile access
Write-Host "🚀 Starting TailorMatch for Mobile Access" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Get current IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "172.*" -or $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress
Write-Host "📱 Mobile URL: http://$ipAddress:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://$ipAddress:8000/api/" -ForegroundColor Cyan
Write-Host ""

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\tailormatch_backend'; .\venv\Scripts\Activate.ps1; Write-Host 'Backend starting on 0.0.0.0:8000...' -ForegroundColor Green; python manage.py runserver 0.0.0.0:8000"

# Wait for backend to start
Write-Host "Waiting 10 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\tailormatch_frontend'; Write-Host 'Frontend starting on 0.0.0.0:3000...' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting with mobile access enabled!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Mobile Access Instructions:" -ForegroundColor Cyan
Write-Host "1. Make sure your mobile device is on the same WiFi network" -ForegroundColor White
Write-Host "2. Open mobile browser" -ForegroundColor White
Write-Host "3. Go to: http://$ipAddress:3000" -ForegroundColor White
Write-Host "4. Try logging in - the network error should be fixed!" -ForegroundColor White
Write-Host ""
Write-Host "🔍 If you still get network errors:" -ForegroundColor Yellow
Write-Host "- Check Windows Firewall settings" -ForegroundColor White
Write-Host "- Allow Python and Node.js through firewall" -ForegroundColor White
Write-Host "- Ensure both devices are on same WiFi network" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
