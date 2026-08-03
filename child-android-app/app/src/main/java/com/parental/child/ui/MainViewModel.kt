package com.parental.child.ui

import androidx.lifecycle.ViewModel
import com.parental.child.BuildConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor() : ViewModel() {

    private val _uiState = MutableStateFlow(
        LauncherUiState(
            appName = "Child Companion",
            version = BuildConfig.VERSION_NAME,
            buildType = BuildConfig.BUILD_TYPE,
            environment = BuildConfig.ENVIRONMENT,
            buildDate = BuildConfig.BUILD_DATE,
            connectionStatus = "Not configured",
            protectionStatus = "Not configured"
        )
    )
    val uiState: StateFlow<LauncherUiState> = _uiState.asStateFlow()

    init {
        Timber.i("MainViewModel initialized with BuildConfig metadata: version=%s, buildType=%s", BuildConfig.VERSION_NAME, BuildConfig.BUILD_TYPE)
    }
}
