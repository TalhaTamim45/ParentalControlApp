package com.parental.child.data.pairing

import com.parental.child.BuildConfig
import com.parental.child.data.network.HealthCheckResult
import com.parental.child.data.credentials.CredentialManager
import com.parental.child.data.network.PairingApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

sealed class PairingResult {
    data class Success(val deviceId: String, val deviceName: String) : PairingResult()
    data class Error(val message: String) : PairingResult()
}

@Singleton
class PairingRepository @Inject constructor(
    private val credentialManager: CredentialManager,
    private val apiClient: PairingApiClient
) {

    fun isPaired(): Boolean = credentialManager.isPaired()

    fun getDeviceId(): String? = credentialManager.getDeviceId()

    fun getDeviceName(): String? = credentialManager.getDeviceName()

    fun getAuthToken(): String? = credentialManager.getAuthToken()

    fun getServerUrl(): String = credentialManager.getServerUrl(BuildConfig.SERVER_BASE_URL)

    fun saveServerUrl(url: String) = credentialManager.saveServerUrl(url)

    fun isServerUrlConfigured(url: String = getServerUrl()): Boolean {
        if (url.isBlank()) return false
        if (url.contains("unconfigured-dev-server.invalid")) return false
        return true
    }

    suspend fun pairDevice(code: String, deviceName: String, customServerUrl: String? = null): PairingResult =
        withContext(Dispatchers.IO) {
            val serverUrl = customServerUrl?.takeIf { it.isNotBlank() } ?: getServerUrl()
            if (!isServerUrlConfigured(serverUrl)) {
                return@withContext PairingResult.Error("Server configuration missing: SERVER_BASE_URL is unconfigured in local.properties")
            }
            if (customServerUrl != null && customServerUrl.isNotBlank()) {
                saveServerUrl(customServerUrl)
            }

            val response = apiClient.validatePairingCode(serverUrl, code, deviceName)
            if (response.success && !response.deviceId.isNullOrEmpty() && !response.authToken.isNullOrEmpty()) {
                val saved = credentialManager.saveCredentials(
                    deviceId = response.deviceId,
                    deviceName = response.deviceName ?: deviceName,
                    rawAuthToken = response.authToken
                )
                if (saved) {
                    PairingResult.Success(response.deviceId, response.deviceName ?: deviceName)
                } else {
                    PairingResult.Error("Failed to store credentials securely on device")
                }
            } else {
                PairingResult.Error(response.error ?: "Invalid pairing code or connection failure")
            }
        }

    suspend fun checkServerHealth(customServerUrl: String? = null): HealthCheckResult =
        withContext(Dispatchers.IO) {
            val serverUrl = customServerUrl?.takeIf { it.isNotBlank() } ?: getServerUrl()
            if (!isServerUrlConfigured(serverUrl)) {
                return@withContext HealthCheckResult(
                    reachable = false,
                    httpStatus = 0,
                    tlsProtocol = null,
                    durationMs = 0,
                    error = "Server configuration missing: SERVER_BASE_URL is unconfigured",
                    errorCode = "ERR_UNCONFIGURED_SERVER"
                )
            }
            apiClient.checkServerHealth(serverUrl)
        }

    fun unpairLocalDevice() {
        credentialManager.clearCredentials()
        Timber.i("Local device state un-paired")
    }

    suspend fun uploadLocationFix(payload: Map<String, Any?>): Boolean =
        withContext(Dispatchers.IO) {
            val serverUrl = getServerUrl()
            if (!isServerUrlConfigured(serverUrl)) {
                Timber.w("Location upload blocked: Server configuration missing")
                return@withContext false
            }
            val token = getAuthToken() ?: return@withContext false

            val fullEventId = payload["eventId"]?.toString() ?: "unknown"
            val sanitizedEventId = if (fullEventId.length > 12) {
                fullEventId.take(8) + "..." + fullEventId.takeLast(4)
            } else {
                fullEventId
            }

            Timber.i("Location upload started | event=%s", sanitizedEventId)
            val res = apiClient.sendLocationFix(serverUrl, token, payload)
            if (res.success) {
                Timber.i("Location upload completed | event=%s | status=200", sanitizedEventId)
            } else {
                Timber.w("Location upload failed | event=%s | status=%s", sanitizedEventId, res.error ?: "unknown")
            }
            res.success
        }
}

