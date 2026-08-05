package com.parental.child.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.SystemClock
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationTracker @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    fun isLocationServicesEnabled(): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        return locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true ||
                locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
    }

    @SuppressLint("MissingPermission")
    fun getCurrentLocationFix(
        batteryPercent: Int,
        isCharging: Boolean,
        onSuccess: (Map<String, Any?>) -> Unit,
        onError: (String) -> Unit
    ) {
        if (!isLocationServicesEnabled()) {
            onError("Location services (GPS) are disabled on the device")
            return
        }

        val cancellationTokenSource = CancellationTokenSource()

        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationTokenSource.token
        ).addOnSuccessListener { location: Location? ->
            if (location != null) {
                val payload = buildLocationPayload(location, batteryPercent, isCharging)
                Timber.i("Location fix obtained successfully -> Acc: %.1fm", location.accuracy)
                onSuccess(payload)
            } else {
                // Fallback to last known location if high accuracy fix is null
                fusedLocationClient.lastLocation.addOnSuccessListener { lastLoc: Location? ->
                    if (lastLoc != null) {
                        val payload = buildLocationPayload(lastLoc, batteryPercent, isCharging)
                        Timber.i("Fallback to last known location fix -> Acc: %.1fm", lastLoc.accuracy)
                        onSuccess(payload)
                    } else {
                        onError("Unable to acquire GPS location fix")
                    }
                }.addOnFailureListener { e ->
                    onError("Location acquisition failed: ${e.message}")
                }
            }
        }.addOnFailureListener { e ->
            Timber.e(e, "Failed to get current location")
            onError("Location acquisition failed: ${e.message}")
        }
    }

    private fun buildLocationPayload(
        location: Location,
        batteryPercent: Int,
        isCharging: Boolean
    ): Map<String, Any?> {
        val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            @Suppress("DEPRECATION")
            location.isFromMockProvider
        }

        return mapOf(
            "schemaVersion" to 1,
            "eventId" to "evt_loc_${UUID.randomUUID().toString().replace("-", "").take(16)}",
            "sequenceNumber" to System.currentTimeMillis(),
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "horizontalAccuracyMeters" to location.accuracy.toDouble(),
            "altitudeMeters" to if (location.hasAltitude()) location.altitude else null,
            "speedMetersPerSecond" to if (location.hasSpeed()) location.speed.toDouble() else null,
            "bearingDegrees" to if (location.hasBearing()) location.bearing.toDouble() else null,
            "batteryPercent" to batteryPercent,
            "isCharging" to isCharging,
            "recordedAt" to location.time,
            "deviceElapsedRealtimeNanos" to SystemClock.elapsedRealtimeNanos(),
            "provider" to (location.provider ?: "fused"),
            "isMockLocation" to isMock
        )
    }
}
