package com.parental.child.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.parental.child.ui.screens.LauncherScreen
import com.parental.child.ui.theme.ChildAppTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate()
        setContent {
            ChildAppTheme {
                val uiState by viewModel.uiState.collectAsState()
                LauncherScreen(uiState = uiState)
            }
        }
    }
}
