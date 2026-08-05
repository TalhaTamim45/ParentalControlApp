package com.parental.child.data.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import timber.log.Timber
import java.io.EOFException
import java.net.ConnectException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.security.cert.CertificateException
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.SSLPeerUnverifiedException

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

/**
 * Health check result for /api/status endpoint.
 */
data class HealthCheckResult(
    val reachable: Boolean,
    val httpStatus: Int? = null,
    val tlsProtocol: String? = null,
    val durationMs: Long? = null,
    val error: String? = null,
    val errorCode: String? = null
)

/**
 * Standard REST API client using default OkHttp TLS configuration.
 * TLS trust is managed by Android Network Security Configuration
 * (network_security_config.xml), not by custom code.
 */
@Singleton
class PairingApiClient @Inject constructor(
    private val client: OkHttpClient
) {

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private fun normalizeUrl(rawUrl: String): String {
        var clean = rawUrl.trim()
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "https://$clean"
        }
        return clean.trimEnd('/')
    }

    /**
     * Checks server reachability and TLS connectivity by calling GET /api/status.
     * Uses the same OkHttpClient and TLS configuration as the pairing request.
     */
    fun checkServerHealth(serverUrl: String): HealthCheckResult {
        val baseUrl = normalizeUrl(serverUrl)
        val endpoint = "$baseUrl/api/status"
        val startTime = System.currentTimeMillis()

        Timber.i("Health check -> GET %s", endpoint)

        val request = Request.Builder()
            .url(endpoint)
            .get()
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val duration = System.currentTimeMillis() - startTime
                val tlsProtocol = response.handshake?.tlsVersion?.javaName
                Timber.i(
                    "Health check response -> Status: %d | Duration: %d ms | TLS: %s",
                    response.code, duration, tlsProtocol
                )
                HealthCheckResult(
                    reachable = response.isSuccessful,
                    httpStatus = response.code,
                    tlsProtocol = tlsProtocol,
                    durationMs = duration
                )
            }
        } catch (e: UnknownHostException) {
            Timber.e(e, "Health check DNS failure: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Cannot resolve server domain", errorCode = "NET-HC-001")
        } catch (e: SSLHandshakeException) {
            val rootCause = findRootCause(e)
            Timber.e(e, "Health check TLS handshake failure: %s | Root cause: %s: %s",
                endpoint, rootCause.javaClass.simpleName, rootCause.message)
            HealthCheckResult(
                reachable = false,
                error = "TLS handshake failed: ${rootCause.javaClass.simpleName}",
                errorCode = "NET-HC-002"
            )
        } catch (e: SSLPeerUnverifiedException) {
            Timber.e(e, "Health check TLS peer unverified: %s", endpoint)
            HealthCheckResult(reachable = false, error = "TLS certificate unverified", errorCode = "NET-HC-002")
        } catch (e: CertificateException) {
            Timber.e(e, "Health check certificate exception: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Invalid server certificate", errorCode = "NET-HC-002")
        } catch (e: ConnectException) {
            Timber.e(e, "Health check connection refused: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Server connection refused", errorCode = "NET-HC-003")
        } catch (e: SocketException) {
            Timber.e(e, "Health check socket error: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Socket error", errorCode = "NET-HC-003")
        } catch (e: EOFException) {
            Timber.e(e, "Health check EOF: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Server closed connection", errorCode = "NET-HC-004")
        } catch (e: SocketTimeoutException) {
            Timber.e(e, "Health check timeout: %s", endpoint)
            HealthCheckResult(reachable = false, error = "Connection timed out", errorCode = "NET-HC-005")
        } catch (e: Exception) {
            Timber.e(e, "Health check unexpected error: %s", endpoint)
            HealthCheckResult(
                reachable = false,
                error = "${e.javaClass.simpleName}: ${e.localizedMessage}",
                errorCode = "NET-HC-099"
            )
        }
    }

    /**
     * Submits pairing code to backend for validation and device identity registration.
     */
    fun validatePairingCode(serverUrl: String, code: String, deviceName: String): PairingResponse {
        val baseUrl = normalizeUrl(serverUrl)
        val endpoint = "$baseUrl/api/pairing/validate"
        val payload = JSONObject().apply {
            put("code", code)
            put("deviceName", deviceName)
        }.toString()

        val startTime = System.currentTimeMillis()
        Timber.i("Starting pairing REST request -> Method: POST | URL: %s | Device: %s", endpoint, deviceName)

        val request = Request.Builder()
            .url(endpoint)
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val duration = System.currentTimeMillis() - startTime
                val bodyStr = response.body?.string() ?: ""
                val json = if (bodyStr.isNotEmpty()) JSONObject(bodyStr) else JSONObject()

                Timber.i("Pairing REST response -> Status: %d | Duration: %d ms | Content-Type: %s",
                    response.code, duration, response.header("Content-Type"))

                if (response.isSuccessful && json.optBoolean("success", false)) {
                    PairingResponse(
                        success = true,
                        deviceId = json.optString("deviceId"),
                        authToken = json.optString("authToken"),
                        deviceName = json.optString("name")
                    )
                } else {
                    val serverError = json.optString("error", "Server returned HTTP ${response.code}")
                    Timber.w("Pairing rejected by server -> Status: %d | Error: %s", response.code, serverError)
                    PairingResponse(
                        success = false,
                        error = "$serverError [NET-PAIR-HTTP-${response.code}]"
                    )
                }
            }
        } catch (e: UnknownHostException) {
            Timber.e(e, "Pairing DNS failure for URL: %s", endpoint)
            PairingResponse(success = false, error = "Cannot resolve server domain ($baseUrl) [NET-PAIR-001]")
        } catch (e: SSLHandshakeException) {
            val rootCause = findRootCause(e)
            Timber.e(e, "Pairing TLS handshake failure for URL: %s | Root cause: %s: %s",
                endpoint, rootCause.javaClass.simpleName, rootCause.message)
            PairingResponse(success = false, error = "TLS handshake failed with server [NET-PAIR-002]")
        } catch (e: SSLPeerUnverifiedException) {
            Timber.e(e, "Pairing TLS peer unverified for URL: %s", endpoint)
            PairingResponse(success = false, error = "TLS certificate unverified [NET-PAIR-002]")
        } catch (e: CertificateException) {
            Timber.e(e, "Pairing certificate exception for URL: %s", endpoint)
            PairingResponse(success = false, error = "Invalid server TLS certificate [NET-PAIR-002]")
        } catch (e: ConnectException) {
            Timber.e(e, "Pairing connection refused for URL: %s", endpoint)
            PairingResponse(success = false, error = "Server connection refused or offline [NET-PAIR-003]")
        } catch (e: SocketException) {
            Timber.e(e, "Pairing socket exception for URL: %s", endpoint)
            PairingResponse(success = false, error = "Socket communication error [NET-PAIR-003]")
        } catch (e: EOFException) {
            Timber.e(e, "Pairing EOF exception (server closed connection unexpectedly) for URL: %s", endpoint)
            PairingResponse(success = false, error = "Server closed connection unexpectedly [NET-PAIR-004]")
        } catch (e: SocketTimeoutException) {
            Timber.e(e, "Pairing timeout for URL: %s", endpoint)
            PairingResponse(success = false, error = "Connection request timed out [NET-PAIR-005]")
        } catch (e: Exception) {
            Timber.e(e, "Unexpected network exception for URL: %s", endpoint)
            PairingResponse(success = false, error = "Network error: ${e.javaClass.simpleName} (${e.localizedMessage}) [NET-PAIR-099]")
        }
    }

    /**
     * Sends heartbeat ping to backend.
     */
    fun sendHeartbeat(serverUrl: String, authToken: String): HeartbeatResponse {
        val baseUrl = normalizeUrl(serverUrl)
        val endpoint = "$baseUrl/api/devices/heartbeat"
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

    /**
     * Submits one authenticated location payload fix to POST /api/location/update (Milestone 1.1).
     */
    fun sendLocationFix(serverUrl: String, authToken: String, payload: Map<String, Any?>): HeartbeatResponse {
        val baseUrl = normalizeUrl(serverUrl)
        val endpoint = "$baseUrl/api/location/update"
        val jsonPayload = JSONObject(payload).toString()

        val request = Request.Builder()
            .url(endpoint)
            .post(jsonPayload.toRequestBody(jsonMediaType))
            .header("x-device-token", authToken)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val json = if (bodyStr.isNotEmpty()) JSONObject(bodyStr) else JSONObject()
                if (response.isSuccessful && json.optBoolean("success", false)) {
                    HeartbeatResponse(success = true, timestamp = json.optLong("receivedAt", System.currentTimeMillis()))
                } else {
                    val serverErr = json.optString("error", "Location update rejected (${response.code})")
                    HeartbeatResponse(success = false, error = serverErr)
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Location upload error: %s", endpoint)
            HeartbeatResponse(success = false, error = e.localizedMessage)
        }
    }


    /**
     * Traverses the exception cause chain to find the root cause.
     */
    private fun findRootCause(e: Throwable): Throwable {
        var cause: Throwable = e
        while (cause.cause != null && cause.cause !== cause) {
            cause = cause.cause!!
        }
        return cause
    }
}
