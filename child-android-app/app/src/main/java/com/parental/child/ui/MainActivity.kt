package com.parental.child.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import com.parental.child.service.ParentalForegroundService
import com.parental.child.ui.screens.PairingScreen
import com.parental.child.ui.theme.ChildAppTheme
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            Timber.i("Notification permission request result: isGranted=%s", isGranted)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS permission on Android 13+ if needed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        setContent {
            ChildAppTheme {
                val uiState by viewModel.uiState.collectAsState()
                
                // Auto-start foreground service if device is paired
                if (uiState.isPaired) {
                    ParentalForegroundService.startService(this)
                }

                PairingScreen(
                    uiState = uiState,
                    onDeviceNameChanged = viewModel::onDeviceNameChanged,
                    onPairingCodeChanged = viewModel::onPairingCodeChanged,
                    onServerUrlChanged = viewModel::onServerUrlChanged,
                    onPairClicked = viewModel::pairDevice,
                    onUnpairClicked = viewModel::unpairDevice
                )
            }
        }
    }
}
