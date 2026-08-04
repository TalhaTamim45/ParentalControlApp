package com.parental.child.ui

data class LauncherUiState(
    val appName: String = "Child Companion",
    val version: String = "",
    val buildType: String = "",
    val environment: String = "",
    val buildDate: String = "",

    // Pairing & Identity State
    val isPaired: Boolean = false,
    val deviceId: String = "",
    val deviceName: String = "",
    val serverUrl: String = "",
    val pairingCodeInput: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,

    // Presence & Heartbeat Status
    val connectionStatus: String = "Disconnected",
    val lastHeartbeatTimestamp: Long? = null
)
