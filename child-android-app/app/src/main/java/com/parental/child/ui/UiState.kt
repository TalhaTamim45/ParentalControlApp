package com.parental.child.ui

data class LauncherUiState(
    val appName: String = "Child Companion",
    val version: String = "",
    val buildType: String = "",
    val environment: String = "",
    val buildDate: String = "",
    val connectionStatus: String = "Not configured",
    val protectionStatus: String = "Not configured"
)
