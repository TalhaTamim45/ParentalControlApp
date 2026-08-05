package com.parental.child.data.presence

import com.parental.child.data.credentials.CredentialManager
import com.parental.child.data.network.PairingApiClient
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    UNAUTHENTICATED
}

@Singleton
class PresenceCoordinator @Inject constructor(
    private val credentialManager: CredentialManager,
    private val apiClient: PairingApiClient
) {

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    private val _lastHeartbeatTime = MutableStateFlow<Long?>(null)
    val lastHeartbeatTime: StateFlow<Long?> = _lastHeartbeatTime.asStateFlow()

    private var socket: Socket? = null
    private var heartbeatJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    var onRemoteUnpairedListener: (() -> Unit)? = null

    companion object {
        private const val HEARTBEAT_INTERVAL_MS = 45_000L // 45 seconds
    }

    fun startPresenceSession(serverUrl: String) {
        stopPresenceSession()

        val token = credentialManager.getAuthToken()
        if (token.isNullOrEmpty()) {
            Timber.w("Cannot start presence session: Auth token missing")
            _connectionStatus.value = ConnectionStatus.UNAUTHENTICATED
            return
        }

        _connectionStatus.value = ConnectionStatus.CONNECTING

        try {
            val options = IO.Options().apply {
                auth = mapOf("role" to "child", "token" to token)
                reconnection = true
                reconnectionDelay = 2000
                reconnectionDelayMax = 30000
            }

            val socketUrl = serverUrl.trim().trimEnd('/')
            socket = IO.socket(socketUrl, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Timber.i("Socket.io connected successfully to %s", socketUrl)
                    _connectionStatus.value = ConnectionStatus.CONNECTED
                    sendHeartbeatPing(serverUrl, token)
                }

                on(Socket.EVENT_DISCONNECT) {
                    Timber.w("Socket.io disconnected")
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }

                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Timber.e("Socket.io connection error: %s", args.firstOrNull())
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }

                on("device_unpaired") {
                    Timber.w("Received device_unpaired signal from backend server!")
                    stopPresenceSession()
                    credentialManager.clearCredentials()
                    onRemoteUnpairedListener?.invoke()
                }

                connect()
            }

            // Launch periodic background heartbeat loop
            heartbeatJob = scope.launch {
                while (isActive) {
                    delay(HEARTBEAT_INTERVAL_MS)
                    val currentToken = credentialManager.getAuthToken()
                    if (!currentToken.isNullOrEmpty()) {
                        sendHeartbeatPing(serverUrl, currentToken)
                    } else {
                        break
                    }
                }
            }

        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize socket presence coordinator")
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
        }
    }

    private fun sendHeartbeatPing(serverUrl: String, token: String) {
        socket?.emit("child_heartbeat")

        // Also issue REST fallback heartbeat
        scope.launch {
            val res = apiClient.sendHeartbeat(serverUrl, token)
            if (res.success) {
                _lastHeartbeatTime.value = res.timestamp ?: System.currentTimeMillis()
                _connectionStatus.value = ConnectionStatus.CONNECTED
            } else if (res.error?.contains("revoked", ignoreCase = true) == true) {
                Timber.w("Heartbeat rejected due to token revocation")
                stopPresenceSession()
                credentialManager.clearCredentials()
                onRemoteUnpairedListener?.invoke()
            }
        }
    }

    fun stopPresenceSession() {
        heartbeatJob?.cancel()
        heartbeatJob = null
        try {
            socket?.off()
            socket?.disconnect()
            socket?.close()
        } catch (e: Exception) {
            Timber.e(e, "Error closing presence socket")
        }
        socket = null
        _connectionStatus.value = ConnectionStatus.DISCONNECTED
    }
}
