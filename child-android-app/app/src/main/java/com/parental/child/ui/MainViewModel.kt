package com.parental.child.ui

import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.parental.child.BuildConfig
import com.parental.child.data.pairing.PairingRepository
import com.parental.child.data.pairing.PairingResult
import com.parental.child.data.presence.PresenceCoordinator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

import com.parental.child.location.LocationTracker

@HiltViewModel
class MainViewModel @Inject constructor(
    private val pairingRepository: PairingRepository,
    private val presenceCoordinator: PresenceCoordinator,
    private val locationTracker: LocationTracker
) : ViewModel() {


    private val defaultDeviceName = "${Build.MANUFACTURER.capitalize()} ${Build.MODEL}"

    private val _uiState = MutableStateFlow(
        LauncherUiState(
            appName = "Child Companion",
            version = BuildConfig.VERSION_NAME,
            buildType = BuildConfig.BUILD_TYPE,
            environment = BuildConfig.ENVIRONMENT,
            buildDate = BuildConfig.BUILD_DATE,
            deviceName = defaultDeviceName,
            serverUrl = pairingRepository.getServerUrl()
        )
    )
    val uiState: StateFlow<LauncherUiState> = _uiState.asStateFlow()

    init {
        checkInitialPairingState()
        runHealthCheck()

        // Register listener for remote device unpair
        presenceCoordinator.onRemoteUnpairedListener = {
            viewModelScope.launch {
                _uiState.update {
                    it.copy(
                        isPaired = false,
                        deviceId = "",
                        errorMessage = "Device un-paired remotely by parent"
                    )
                }
            }
        }

        // Collect presence connection status
        viewModelScope.launch {
            presenceCoordinator.connectionStatus.collect { status ->
                _uiState.update { it.copy(connectionStatus = status.name) }
            }
        }

        // Collect heartbeat timestamp updates
        viewModelScope.launch {
            presenceCoordinator.lastHeartbeatTime.collect { ts ->
                _uiState.update { it.copy(lastHeartbeatTimestamp = ts) }
            }
        }
    }

    /**
     * Runs a TLS health check against the configured server URL on startup.
     * This verifies that the Android device can complete a standard HTTPS connection
     * before any pairing is attempted.
     */
    private fun runHealthCheck() {
        viewModelScope.launch {
            val serverUrl = _uiState.value.serverUrl.ifEmpty { BuildConfig.SERVER_BASE_URL }
            _uiState.update { it.copy(healthCheckStatus = "Checking...") }

            val result = pairingRepository.checkServerHealth(serverUrl)
            if (result.reachable) {
                Timber.i("Health check passed -> HTTP %d | TLS: %s | %d ms",
                    result.httpStatus, result.tlsProtocol, result.durationMs)
                _uiState.update {
                    it.copy(
                        healthCheckStatus = "Reachable (HTTP ${result.httpStatus})",
                        healthCheckTls = result.tlsProtocol
                    )
                }
            } else {
                Timber.w("Health check failed -> %s [%s]", result.error, result.errorCode)
                _uiState.update {
                    it.copy(
                        healthCheckStatus = "Failed: ${result.error} [${result.errorCode}]",
                        healthCheckTls = null
                    )
                }
            }
        }
    }

    private fun checkInitialPairingState() {
        val paired = pairingRepository.isPaired()
        if (paired) {
            val devId = pairingRepository.getDeviceId() ?: ""
            val devName = pairingRepository.getDeviceName() ?: defaultDeviceName
            val serverUrl = pairingRepository.getServerUrl()

            _uiState.update {
                it.copy(
                    isPaired = true,
                    deviceId = devId,
                    deviceName = devName,
                    serverUrl = serverUrl
                )
            }
            presenceCoordinator.startPresenceSession(serverUrl)
        } else {
            _uiState.update {
                it.copy(
                    isPaired = false,
                    deviceName = defaultDeviceName
                )
            }
        }
    }

    fun onDeviceNameChanged(name: String) {
        _uiState.update { it.copy(deviceName = name) }
    }

    fun onPairingCodeChanged(code: String) {
        // Enforce max 6 digits, numeric only
        val filtered = code.filter { it.isDigit() }.take(6)
        _uiState.update { it.copy(pairingCodeInput = filtered, errorMessage = null) }
    }

    fun onServerUrlChanged(url: String) {
        _uiState.update { it.copy(serverUrl = url) }
    }

    fun pairDevice() {
        val currentState = uiState.value
        val code = currentState.pairingCodeInput.trim()
        val devName = currentState.deviceName.trim().ifEmpty { defaultDeviceName }
        val serverUrl = currentState.serverUrl.trim().ifEmpty { BuildConfig.SERVER_BASE_URL }

        if (code.length != 6) {
            _uiState.update { it.copy(errorMessage = "Please enter a valid 6-digit numeric pairing code.") }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            when (val result = pairingRepository.pairDevice(code, devName, serverUrl)) {
                is PairingResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isPaired = true,
                            deviceId = result.deviceId,
                            deviceName = result.deviceName,
                            isLoading = false,
                            pairingCodeInput = "",
                            errorMessage = null
                        )
                    }
                    presenceCoordinator.startPresenceSession(serverUrl)
                }
                is PairingResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun unpairDevice() {
        presenceCoordinator.stopPresenceSession()
        pairingRepository.unpairLocalDevice()
        _uiState.update {
            it.copy(
                isPaired = false,
                deviceId = "",
                pairingCodeInput = "",
                errorMessage = null,
                connectionStatus = "Disconnected",
                lastHeartbeatTimestamp = null
            )
        }
    }

    fun updateLocationStatus(status: String) {
        _uiState.update { it.copy(locationStatus = status) }
    }

    fun requestOneTimeLocationFix(batteryPercent: Int = 100, isCharging: Boolean = false) {
        if (!pairingRepository.isPaired()) {
            _uiState.update { it.copy(locationStatus = "Device not paired") }
            return
        }

        _uiState.update { it.copy(locationStatus = "Obtaining GPS location fix...") }

        locationTracker.getCurrentLocationFix(
            batteryPercent = batteryPercent,
            isCharging = isCharging,
            onSuccess = { payload ->
                viewModelScope.launch {
                    _uiState.update { it.copy(locationStatus = "Sending location payload...") }
                    val ok = pairingRepository.uploadLocationFix(payload)
                    if (ok) {
                        val ts = System.currentTimeMillis()
                        _uiState.update {
                            it.copy(
                                locationStatus = "Location successfully shared",
                                locationLastSentAt = ts
                            )
                        }
                        Timber.i("Milestone 1.1 single location fix uploaded successfully")
                    } else {
                        _uiState.update { it.copy(locationStatus = "Location upload failed") }
                    }
                }
            },
            onError = { err ->
                _uiState.update { it.copy(locationStatus = "Location unavailable: $err") }
            }
        )
    }

    private fun String.capitalize(): String {
        return replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

