package com.parental.child.data.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import timber.log.Timber
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

data class PairingResponse(
    val success: Boolean,
    val deviceId: String? = null,
    val authToken: String? = null,
    val deviceName: String? = null,
    val error: String? = null
)

data class HeartbeatResponse(
    val success: Boolean,
    val timestamp: Long? = null,
    val error: String? = null
)

@Singleton
class PairingApiClient @Inject constructor() {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    /**
     * Submits pairing code to backend for validation and device identity registration.
     */
    fun validatePairingCode(serverUrl: String, code: String, deviceName: String): PairingResponse {
        val endpoint = "${serverUrl.trimEnd('/')}/api/pairing/validate"
        val payload = JSONObject().apply {
            put("code", code)
            put("deviceName", deviceName)
        }.toString()

        val request = Request.Builder()
            .url(endpoint)
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val json = if (bodyStr.isNotEmpty()) JSONObject(bodyStr) else JSONObject()
                if (response.isSuccessful && json.optBoolean("success", false)) {
                    PairingResponse(
                        success = true,
                        deviceId = json.optString("deviceId"),
                        authToken = json.optString("authToken"),
                        deviceName = json.optString("name")
                    )
                } else {
                    PairingResponse(
                        success = false,
                        error = json.optString("error", "Validation failed (HTTP ${response.code})")
                    )
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Pairing network request error")
            PairingResponse(success = false, error = e.localizedMessage ?: "Connection error to server")
        }
    }

    /**
     * Sends heartbeat ping to backend.
     */
    fun sendHeartbeat(serverUrl: String, authToken: String): HeartbeatResponse {
        val endpoint = "${serverUrl.trimEnd('/')}/api/devices/heartbeat"
        val request = Request.Builder()
            .url(endpoint)
            .post("{}".toRequestBody(jsonMediaType))
            .header("x-device-token", authToken)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val json = if (bodyStr.isNotEmpty()) JSONObject(bodyStr) else JSONObject()
                if (response.isSuccessful && json.optBoolean("success", false)) {
                    HeartbeatResponse(success = true, timestamp = json.optLong("timestamp", System.currentTimeMillis()))
                } else {
                    HeartbeatResponse(success = false, error = json.optString("error", "Heartbeat rejected"))
                }
            }
        } catch (e: Exception) {
            HeartbeatResponse(success = false, error = e.localizedMessage)
        }
    }
}
