package com.parental.child.data.credentials

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import timber.log.Timber
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages credential encryption and decryption using Android KeyStore directly.
 * Uses AES-256-GCM without external or deprecated dependencies.
 */
@Singleton
class KeystoreManager @Inject constructor() {

    companion object {
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "ParentalControlDeviceKey_v1"
        private const val AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
    }

    private val keyStore: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
        load(null)
    }

    init {
        ensureSecretKeyExists()
    }

    private fun ensureSecretKeyExists() {
        try {
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                val keyGenerator = KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES,
                    KEYSTORE_PROVIDER
                )
                val spec = KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .build()

                keyGenerator.init(spec)
                keyGenerator.generateKey()
                Timber.i("Generated new AES-256 key in Android KeyStore under alias: %s", KEY_ALIAS)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error initializing Android KeyStore key")
        }
    }

    private fun getSecretKey(): SecretKey {
        ensureSecretKeyExists()
        val entry = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry
            ?: throw IllegalStateException("KeyStore entry missing for alias $KEY_ALIAS")
        return entry.secretKey
    }

    /**
     * Encrypts plaintext string using AES-GCM. Returns Pair(CiphertextBase64, IvBase64).
     */
    fun encrypt(plainText: String): Pair<String, String>? {
        if (plainText.isEmpty()) return null
        return try {
            val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
            val iv = cipher.iv
            val encryptedBytes = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))

            val ciphertextBase64 = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
            val ivBase64 = Base64.encodeToString(iv, Base64.NO_WRAP)
            Pair(ciphertextBase64, ivBase64)
        } catch (e: Exception) {
            Timber.e(e, "Failed to encrypt payload with KeyStore")
            null
        }
    }

    /**
     * Decrypts Base64 ciphertext and Base64 IV back to plaintext string.
     */
    fun decrypt(ciphertextBase64: String, ivBase64: String): String? {
        if (ciphertextBase64.isEmpty() || ivBase64.isEmpty()) return null
        return try {
            val encryptedBytes = Base64.decode(ciphertextBase64, Base64.NO_WRAP)
            val iv = Base64.decode(ivBase64, Base64.NO_WRAP)

            val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), gcmSpec)

            val decryptedBytes = cipher.doFinal(encryptedBytes)
            String(decryptedBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            Timber.e(e, "Failed to decrypt payload with KeyStore")
            null
        }
    }

    /**
     * Clears and resets the KeyStore key.
     */
    fun removeKey() {
        try {
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting KeyStore entry")
        }
    }
}
