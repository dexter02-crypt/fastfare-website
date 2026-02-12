# Live Tracking Files

All files related to driver location tracking, animations, maps, and Socket.io integration.

## Folder Structure

```
live-tracking-files/
├── pc-backend/          # Server-side files
│   ├── location.socket.js   # Socket.io handler for real-time updates
│   └── trackingRoutes.js    # REST API for location updates
│
├── pc-frontend/         # React UI components
│   └── LiveTrackingPage.tsx # Uber-style tracking page with animated truck
│
├── android-app/         # Mobile driver app files
│   ├── ApiConfig.kt         # Server URL configuration
│   ├── LocationService.kt   # Background location tracking
│   └── SocketManager.kt     # Socket.io client for real-time updates
│
└── partners-web/        # Web app for partners
    ├── api.ts               # API client for PC WMS
    └── useSocket.ts         # React hook for socket connection
```

## What Each File Does

### PC Backend

| File | Purpose |
|------|---------|
| `location.socket.js` | Handles Socket.io events for real-time driver location |
| `trackingRoutes.js` | HTTP endpoint `/api/tracking/live-update` for location updates |

### PC Frontend

| File | Purpose |
|------|---------|
| `LiveTrackingPage.tsx` | Uber-style tracking UI with animated truck, route, driver info, ETA |

### Android App

| File | Purpose |
|------|---------|
| `ApiConfig.kt` | Central config - change `SERVER_IP` to connect to your server |
| `LocationService.kt` | Sends GPS location to server every 10 seconds |
| `SocketManager.kt` | Real-time socket connection for instant updates |

### Partners Web

| File | Purpose |
|------|---------|
| `api.ts` | API client with get/post/put/delete methods |
| `useSocket.ts` | React hook for listening to driver location updates |

## Configuration

To change the server URL, modify:
- **Android**: `ApiConfig.kt` → `SERVER_IP` variable
- **Web**: `api.ts` → `BASE_URL` variable
- **Partners**: Environment variable `NEXT_PUBLIC_API_URL`

## How to Use

1. Copy these files to your project
2. Update server URLs to match your deployment
3. Install dependencies: `socket.io` (backend), `socket.io-client` (frontend)
