# Mobile App Backend Connection Guide

## Problem
Your mobile app cannot connect to the backend because it's trying to reach `localhost:8000`, which doesn't work on mobile devices.

## Solution Steps

### 1. Find Your Computer's IP Address
Run the `get_ip_address.bat` script to find your computer's IP address, or manually find it:
- Windows: Open Command Prompt and run `ipconfig`
- Look for "IPv4 Address" under your network adapter

### 2. Update Mobile App Configuration
Edit `TailorMatchMobile/src/services/api.ts`:
```typescript
// Replace 192.168.1.132 with your actual IP address
baseURL: 'http://YOUR_IP_ADDRESS:8000/api',
```

### 3. Update Backend CORS Settings
Edit `tailormatch_backend/tailormatch_backend/settings.py`:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'YOUR_IP_ADDRESS']

CORS_ALLOWED_ORIGINS = [
    # ... existing origins ...
    "exp://YOUR_IP_ADDRESS:8081",
]
```

### 4. Update Frontend Configuration (if needed)
Edit `tailormatch_frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://YOUR_IP_ADDRESS:8000/api';
```

### 5. Restart Services
1. Stop your backend server (Ctrl+C)
2. Restart backend: `start_backend.bat`
3. Restart mobile app: `start_expo_mobile.bat`

## Testing Connection

### Test Backend from Computer
Open browser and go to: `http://YOUR_IP_ADDRESS:8000/api/`

### Test from Mobile Device
1. Make sure your phone is on the same WiFi network
2. Open Expo Go app
3. Scan the QR code from your mobile development server
4. Try logging in

## Common Issues

### "Network Error" or "Connection Refused"
- Check if backend is running on `0.0.0.0:8000` (not just `localhost:8000`)
- Verify IP address is correct
- Check Windows Firewall settings

### "CORS Error"
- Make sure your IP is in `CORS_ALLOWED_ORIGINS`
- Check that `CORS_ALLOW_ALL_ORIGINS = DEBUG` is True

### "Invalid Host Header"
- Add your IP to `ALLOWED_HOSTS` in Django settings

## Network Requirements
- Computer and mobile device must be on the same WiFi network
- Backend must run on `0.0.0.0:8000` (accessible from network)
- No firewall blocking port 8000

## Alternative: Use ngrok
If network issues persist, you can use ngrok to create a public tunnel:
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 8000`
3. Use the ngrok URL in your mobile app configuration
