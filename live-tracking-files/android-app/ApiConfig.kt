package com.sid7985.fastfare

/**
 * API Configuration for FastFare Driver App
 * Change SERVER_IP to your PC's IP address when testing on physical device
 * Use 10.0.2.2 for Android emulator (localhost equivalent)
 */
object ApiConfig {
    // For physical device: Use your PC's local IP (e.g., 192.168.1.100)
    // For emulator: Use 10.0.2.2 (Android emulator's localhost)
    // For production: Use your deployed server URL
    
    const val SERVER_IP = "10.0.2.2" // Change this to your PC IP for physical device
    const val SERVER_PORT = "5000"   // PC WMS backend port
    
    const val BASE_URL = "http://$SERVER_IP:$SERVER_PORT"
    const val API_URL = "$BASE_URL/api"
    const val SOCKET_URL = BASE_URL
    
    // API Endpoints
    const val DRIVER_AUTH = "$API_URL/driver-auth"
    const val TRACKING_UPDATE = "$API_URL/tracking/live-update"
    const val TRIPS = "$API_URL/trips"
    const val DRIVERS = "$API_URL/drivers"
}
