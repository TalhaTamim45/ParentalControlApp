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

    suspend fun pairDevice(code: String, deviceName: String, customServerUrl: String? = null): PairingResult =
        withContext(Dispatchers.IO) {
            val serverUrl = customServerUrl?.takeIf { it.isNotBlank() } ?: getServerUrl()
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
            apiClient.checkServerHealth(serverUrl)
        }

    fun unpairLocalDevice() {
        credentialManager.clearCredentials()
        Timber.i("Local device state un-paired")
    }

    suspend fun uploadLocationFix(payload: Map<String, Any?>): Boolean =
        withContext(Dispatchers.IO) {
            val serverUrl = getServerUrl()
            val token = getAuthToken() ?: return@withContext false
            val res = apiClient.sendLocationFix(serverUrl, token, payload)
            res.success
        }
}

