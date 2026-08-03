package com.parental.child.ui

data class LauncherUiState(
    val appName: String = "Child Companion",
    val environmentName: String = "Development / Standby",
    val connectionStatus: String = "Not configured",
    val protectionStatus: String = "Not configured",
    val buildInfo: String = "Phase 1 Foundation - Build 1.0.0"
)
