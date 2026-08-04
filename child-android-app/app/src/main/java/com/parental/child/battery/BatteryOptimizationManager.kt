package com.parental.child.battery

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import timber.log.Timber

/**
 * Manages Battery Optimization detection and user-guided exemption requests.
 */
class BatteryOptimizationManager(private val context: Context) {

    fun isIgnoringBatteryOptimizations(): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true
        }
    }

    /**
     * Creates intent to launch battery optimization request or app details setting.
     */
    fun createOptimizationRequestIntent(): Intent {
        val packageName = context.packageName
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isIgnoringBatteryOptimizations()) {
            try {
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
            } catch (e: Exception) {
                Timber.w(e, "Direct battery optimization intent unavailable, falling back to app settings")
                createAppSettingsIntent()
            }
        } else {
            createAppSettingsIntent()
        }
    }

    private fun createAppSettingsIntent(): Intent {
        return Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
    }

    companion object {
        const val SAMSUNG_GUIDANCE = "Samsung Galaxy A12 Instructions: Go to Settings -> Apps -> Parent Shield Child -> Battery -> Select 'Unrestricted'. Also ensure the app is added to Device Care -> 'Never sleeping apps'."
    }
}
