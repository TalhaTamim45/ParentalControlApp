package com.parental.child.receiver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.parental.child.data.credentials.CredentialManager
import com.parental.child.service.ParentalForegroundService
import com.parental.child.ui.MainActivity
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class BootReceiver : BroadcastReceiver() {

    @Inject
    lateinit var credentialManager: CredentialManager

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Timber.i("BootReceiver onReceive action: %s", action)

        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            if (!credentialManager.isServiceEnabled()) {
                Timber.i("Device not paired or service explicitly stopped by user preference, skipping boot auto-start")
                return
            }

            Timber.i("Paired & enabled credentials found on boot, attempting service restoration...")
            try {
                ParentalForegroundService.startService(context)
                Timber.i("Service boot auto-start initiated successfully")
            } catch (e: Exception) {
                Timber.w(e, "Background service start restricted by OS on boot. Displaying tap-to-activate notification.")
                showBootFallbackNotification(context)
            }
        }
    }

    private fun showBootFallbackNotification(context: Context) {
        val channelId = "boot_fallback_channel"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Protection Status Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setContentTitle("Parent Shield - Action Required")
            .setContentText("Tap to reactivate child protection after device restart.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(9999, notification)
    }
}
