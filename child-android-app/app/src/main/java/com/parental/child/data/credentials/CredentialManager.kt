package com.parental.child.data.credentials

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages persistent credential storage and service user preference state.
 * Stores non-sensitive metadata in SharedPreferences and encrypts authentication tokens
 * using KeystoreManager.
 */
@Singleton
class CredentialManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val keystoreManager: KeystoreManager
) {

    companion object {
        private const val PREFS_NAME = "child_secure_credentials_v1"
        private const val KEY_IS_PAIRED = "is_paired"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_ENCRYPTED_TOKEN = "encrypted_token"
        private const val KEY_TOKEN_IV = "token_iv"
        private const val KEY_SERVER_URL = "custom_server_url"
        private const val KEY_SERVICE_ENABLED = "is_service_enabled"
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isPaired(): Boolean {
        return prefs.getBoolean(KEY_IS_PAIRED, false) && !getAuthToken().isNullOrEmpty()
    }

    fun saveCredentials(deviceId: String, deviceName: String, rawAuthToken: String): Boolean {
        val encryptedResult = keystoreManager.encrypt(rawAuthToken)
        if (encryptedResult == null) {
            Timber.e("Failed to encrypt device authentication token")
            return false
        }

        prefs.edit().apply {
            putBoolean(KEY_IS_PAIRED, true)
            putString(KEY_DEVICE_ID, deviceId)
            putString(KEY_DEVICE_NAME, deviceName)
            putString(KEY_ENCRYPTED_TOKEN, encryptedResult.first)
            putString(KEY_TOKEN_IV, encryptedResult.second)
            putBoolean(KEY_SERVICE_ENABLED, true)
            apply()
        }
        Timber.i("Successfully saved encrypted credentials for device ID: %s", deviceId)
        return true
    }

    fun setServiceEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SERVICE_ENABLED, enabled).apply()
        Timber.i("Updated service enabled preference to: %s", enabled)
    }

    fun isServiceEnabled(): Boolean {
        return isPaired() && prefs.getBoolean(KEY_SERVICE_ENABLED, true)
    }

    fun getDeviceId(): String? {
        return prefs.getString(KEY_DEVICE_ID, null)
    }

    fun getDeviceName(): String? {
        return prefs.getString(KEY_DEVICE_NAME, null)
    }

    fun getAuthToken(): String? {
        val cipherText = prefs.getString(KEY_ENCRYPTED_TOKEN, null) ?: return null
        val iv = prefs.getString(KEY_TOKEN_IV, null) ?: return null
        return keystoreManager.decrypt(cipherText, iv)
    }

    fun saveServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getServerUrl(defaultUrl: String): String {
        return prefs.getString(KEY_SERVER_URL, null) ?: defaultUrl
    }

    fun clearCredentials() {
        prefs.edit().clear().apply()
        Timber.i("Cleared local device credentials and un-paired device state")
    }
}
