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

@HiltViewModel
class MainViewModel @Inject constructor(
    private val pairingRepository: PairingRepository,
    private val presenceCoordinator: PresenceCoordinator
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

    private fun String.capitalize(): String {
        return replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}
