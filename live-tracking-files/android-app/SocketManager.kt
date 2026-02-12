package com.sid7985.fastfare.services

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.net.URISyntaxException
import com.sid7985.fastfare.ApiConfig

object SocketManager {
    private const val TAG = "SocketManager"

    private var socket: Socket? = null
    
    private val _locationUpdates = MutableStateFlow<Pair<Double, Double>?>(null)
    val locationUpdates: StateFlow<Pair<Double, Double>?> = _locationUpdates
    
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected

    fun connect() {
        try {
            if (socket == null) {
                val opts = IO.Options()
                opts.forceNew = true
                opts.reconnection = true
                opts.reconnectionAttempts = 5
                opts.reconnectionDelay = 1000
                
                // Use centralized config for server URL
                socket = IO.socket(ApiConfig.SOCKET_URL, opts)
                
                socket?.on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "Connected to server at ${ApiConfig.SOCKET_URL}")
                    _isConnected.value = true
                }?.on(Socket.EVENT_DISCONNECT) {
                    Log.d(TAG, "Disconnected from server")
                    _isConnected.value = false
                }?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e(TAG, "Connection error: ${args.getOrNull(0)}")
                    _isConnected.value = false
                }
                
                socket?.connect()
            }
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid URI", e)
        }
    }

    fun joinTracking(trackingId: String) {
        if (socket?.connected() == true) {
            socket?.emit("join_tracking", trackingId)
            Log.d(TAG, "Joined tracking room: $trackingId")
            
            // Listen for location updates from other drivers/dashboard
            socket?.on("driver_location_update") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    try {
                        val lat = data.getDouble("lat")
                        val lng = data.getDouble("lng")
                        Log.d(TAG, "Received location: $lat, $lng")
                        _locationUpdates.value = Pair(lat, lng)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing location update", e)
                    }
                }
            }
        } else {
            Log.w(TAG, "Socket not connected, cannot join tracking")
        }
    }
    
    fun sendLocation(trackingId: String, lat: Double, lng: Double) {
        if (socket?.connected() == true) {
            val locationData = JSONObject().apply {
                put("trackingId", trackingId)
                put("lat", lat)
                put("lng", lng)
                put("timestamp", System.currentTimeMillis())
            }
            socket?.emit("update_location", locationData)
            Log.d(TAG, "Sent location via socket: $lat, $lng")
        }
    }
    
    fun updateDriverStatus(driverId: String, status: String) {
        if (socket?.connected() == true) {
            val statusData = JSONObject().apply {
                put("driverId", driverId)
                put("status", status)
                put("timestamp", System.currentTimeMillis())
            }
            socket?.emit("driver_status", statusData)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _isConnected.value = false
    }
}
