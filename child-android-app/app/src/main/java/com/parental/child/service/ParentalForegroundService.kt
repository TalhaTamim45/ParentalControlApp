package com.parental.child.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.parental.child.BuildConfig
import com.parental.child.data.credentials.CredentialManager
import com.parental.child.data.presence.PresenceCoordinator
import com.parental.child.network.NetworkMonitor
import com.parental.child.network.NetworkTransport
import com.parental.child.ui.MainActivity
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber
import java.util.concurrent.atomic.AtomicReference
import javax.inject.Inject

enum class ServiceState {
    STOPPED,
    STARTING,
    ACTIVE,
    WAITING_FOR_NETWORK,
    RECONNECTING,
    AUTHENTICATION_FAILED,
    REVOKED,
    STOPPING,
    FAILED
}

@AndroidEntryPoint
class ParentalForegroundService : Service() {

    @Inject
    lateinit var credentialManager: CredentialManager

    @Inject
    lateinit var presenceCoordinator: PresenceCoordinator

    private val currentState = AtomicReference(ServiceState.STOPPED)
    private var networkMonitor: NetworkMonitor? = null

    override fun onCreate() {
        super.onCreate()
        Timber.i("ParentalForegroundService onCreate called")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        Timber.i("ParentalForegroundService onStartCommand action: %s, currentState: %s", action, currentState.get())

        when (action) {
            ACTION_STOP_SERVICE -> {
                stopProtectionService()
                return START_NOT_STICKY
            }
            else -> {
                startProtectionService()
                return START_STICKY
            }
        }
    }

    private fun startProtectionService() {
        if (!currentState.compareAndSet(ServiceState.STOPPED, ServiceState.STARTING)) {
            if (currentState.get() == ServiceState.ACTIVE || currentState.get() == ServiceState.STARTING) {
                Timber.d("Service protection already running or starting")
                return
            }
            currentState.set(ServiceState.STARTING)
        }

        // Record user service-enabled preference
        credentialManager.setServiceEnabled(true)

        // Start foreground with persistent notification
        val notification = buildNotification("Parent Shield Active", "Initializing device connection...")
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error starting foreground service")
        }

        if (!credentialManager.isPaired()) {
            Timber.w("No encrypted credentials found, stopping foreground service")
            updateState(ServiceState.STOPPED, "Unpaired - Protection Stopped")
            stopSelf()
            return
        }

        val serverUrl = credentialManager.getServerUrl(BuildConfig.SERVER_BASE_URL)

        // Start Network Monitoring
        networkMonitor = NetworkMonitor(this) { isConnected, transport ->
            if (isConnected) {
                Timber.i("Network available via %s, connecting presence...", transport)
                updateState(ServiceState.RECONNECTING, "Reconnecting via $transport...")
                presenceCoordinator.startPresenceSession(serverUrl)
                updateState(ServiceState.ACTIVE, "Connected & Protected")
            } else {
                Timber.w("Network disconnected")
                updateState(ServiceState.WAITING_FOR_NETWORK, "Waiting for Internet connection...")
            }
        }
        networkMonitor?.startMonitoring()

        // Start Presence Coordinator Session
        presenceCoordinator.startPresenceSession(serverUrl)
        updateState(ServiceState.ACTIVE, "Connected & Protected")
    }

    private fun stopProtectionService() {
        Timber.i("Stopping protection service explicitly by user request")
        
        // Record user service-disabled preference so boot recovery respects explicit stop choice
        credentialManager.setServiceEnabled(false)

        updateState(ServiceState.STOPPING, "Stopping protection...")
        
        networkMonitor?.stopMonitoring()
        networkMonitor = null

        presenceCoordinator.stopPresenceSession()

        updateState(ServiceState.STOPPED, "Protection Stopped")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun updateState(newState: ServiceState, statusText: String) {
        currentState.set(newState)
        Timber.i("Service state transition -> %s (%s)", newState, statusText)
        val notification = buildNotification("Parent Shield Active", statusText)
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun buildNotification(title: String, content: String): Notification {
        val tapIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Parent Shield Ongoing Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent status notification for authorized child supervision connection"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        networkMonitor?.stopMonitoring()
        networkMonitor = null
        presenceCoordinator.stopPresenceSession()
        currentState.set(ServiceState.STOPPED)
        Timber.i("ParentalForegroundService onDestroy completed")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val CHANNEL_ID = "parental_service_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_SERVICE = "com.parental.child.action.START_SERVICE"
        const val ACTION_STOP_SERVICE = "com.parental.child.action.STOP_SERVICE"

        fun startService(context: Context) {
            val intent = Intent(context, ParentalForegroundService::class.java).apply {
                action = ACTION_START_SERVICE
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to start ParentalForegroundService")
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, ParentalForegroundService::class.java).apply {
                action = ACTION_STOP_SERVICE
            }
            try {
                context.startService(intent)
            } catch (e: Exception) {
                Timber.e(e, "Failed to stop ParentalForegroundService")
            }
        }
    }
}
