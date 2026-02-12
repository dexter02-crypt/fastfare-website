package com.sid7985.fastfare.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.sid7985.fastfare.ApiConfig

class LocationService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var wakeLock: android.os.PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        createNotificationChannel()

        // Acquire WakeLock
        val powerManager = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        wakeLock = powerManager.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "FastFare::LocationWakeLock")
        wakeLock?.acquire(10*60*1000L /*10 minutes timeout just in case*/)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.locations.forEach { location ->
                    // Send to Server
                    sendLocationToServer(location.latitude, location.longitude)
                    println("Background Location: ${location.latitude}, ${location.longitude}")
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FastFare Driver")
            .setContentText("Tracking location in background... (Battery Optimized)")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1, notification)
        
        if (wakeLock?.isHeld == false) {
             wakeLock?.acquire()
        }
        
        startLocationUpdates()
        
        return START_STICKY
    }

    private fun startLocationUpdates() {
        // Battery Optimized Request
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000) // 10 seconds
            .setWaitForAccurateLocation(false)
            .setMinUpdateIntervalMillis(10000) // Match interval
            .setMinUpdateDistanceMeters(30f) // Only if moved 30m
            .build()
            
        if (ActivityCompat.checkSelfPermission(
                this,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            "FastFare Driver Service Channel",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(serviceChannel)
    }

    private fun sendLocationToServer(lat: Double, lng: Double) {
        // HTTP Updates Logic - Using ApiConfig for URL
        Thread {
            try {
                val url = java.net.URL(ApiConfig.TRACKING_UPDATE)
                val conn = url.openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.connectTimeout = 5000
                conn.readTimeout = 5000

                // Use current trip ID or a default tracking ID
                val jsonInputString = """{"trackingId": "DRIVER_LIVE", "lat": $lat, "lng": $lng}"""

                conn.outputStream.use { os ->
                    val input = jsonInputString.toByteArray(java.nio.charset.StandardCharsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val code = conn.responseCode
                println("Location sent to ${ApiConfig.SERVER_IP}:${ApiConfig.SERVER_PORT}: $code")
                
                conn.disconnect()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    companion object {
        const val CHANNEL_ID = "FastFareLocationChannel"
    }
}
