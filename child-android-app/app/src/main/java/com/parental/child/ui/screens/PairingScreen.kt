package com.parental.child.ui.screens

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parental.child.battery.BatteryOptimizationManager
import com.parental.child.service.ParentalForegroundService
import com.parental.child.ui.LauncherUiState
import com.parental.child.utils.CrashHandler
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun PairingScreen(
    uiState: LauncherUiState,
    onDeviceNameChanged: (String) -> Unit,
    onPairingCodeChanged: (String) -> Unit,
    onServerUrlChanged: (String) -> Unit,
    onPairClicked: () -> Unit,
    onUnpairClicked: () -> Unit,
    onLocationFixClicked: () -> Unit = {}
) {

    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val batteryManager = remember { BatteryOptimizationManager(context) }
    var isBatteryOptIgnored by remember { mutableStateOf(batteryManager.isIgnoringBatteryOptimizations()) }
    val lastCrashLog = remember { CrashHandler.getLastCrashReport(context) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0B0F19)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header Badge
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.padding(bottom = 20.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = uiState.appName,
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = " • Milestone 5 Reliability",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )
                }
            }

            if (!uiState.isPaired) {
                // UNPAIRED STATE
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF151C2C)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Secure Device Pairing",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Text(
                            text = "Generate a 6-digit pairing code on the Parent Dashboard and enter it below.",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        // Error Banner
                        uiState.errorMessage?.let { error ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0x33F43F5E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = error,
                                    color = Color(0xFFFB7185),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(12.dp),
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Server Health Check Status
                        uiState.healthCheckStatus?.let { status ->
                            val isHealthy = status.startsWith("Reachable")
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isHealthy) Color(0x3310B981) else Color(0x33F59E0B)
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = if (isHealthy) "✅ Server $status" else "⚠️ Server: $status",
                                        color = if (isHealthy) Color(0xFF34D399) else Color(0xFFFBBF24),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    uiState.healthCheckTls?.let { tls ->
                                        Text(
                                            text = "TLS: $tls",
                                            color = Color(0xFF94A3B8),
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }

                        // Device Name Field
                        OutlinedTextField(
                            value = uiState.deviceName,
                            onValueChange = onDeviceNameChanged,
                            label = { Text("Device Name") },
                            singleLine = true,
                            enabled = !uiState.isLoading,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF38BDF8),
                                unfocusedBorderColor = Color(0xFF334155),
                                focusedLabelColor = Color(0xFF38BDF8),
                                unfocusedLabelColor = Color(0xFF64748B),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp)
                        )

                        // 6-Digit Code Input
                        OutlinedTextField(
                            value = uiState.pairingCodeInput,
                            onValueChange = onPairingCodeChanged,
                            label = { Text("6-Digit Pairing Code") },
                            singleLine = true,
                            enabled = !uiState.isLoading,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF38BDF8),
                                unfocusedBorderColor = Color(0xFF334155),
                                focusedLabelColor = Color(0xFF38BDF8),
                                unfocusedLabelColor = Color(0xFF64748B),
                                focusedTextColor = Color(0xFF38BDF8),
                                unfocusedTextColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp)
                        )

                        // Configurable Server Base URL
                        OutlinedTextField(
                            value = uiState.serverUrl,
                            onValueChange = onServerUrlChanged,
                            label = { Text("Public Server Base URL") },
                            singleLine = true,
                            enabled = !uiState.isLoading,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF38BDF8),
                                unfocusedBorderColor = Color(0xFF334155),
                                focusedLabelColor = Color(0xFF38BDF8),
                                unfocusedLabelColor = Color(0xFF64748B),
                                focusedTextColor = Color.LightGray,
                                unfocusedTextColor = Color.Gray
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 24.dp)
                        )

                        // Pair Button / Progress
                        Button(
                            onClick = onPairClicked,
                            enabled = !uiState.isLoading && uiState.pairingCodeInput.length == 6,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF2563EB),
                                disabledContainerColor = Color(0xFF1E293B)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            if (uiState.isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "PAIR DEVICE NOW",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            } else {
                // PAIRED SUCCESS STATE WITH SERVICE & RELIABILITY CONTROLS
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF151C2C)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Success Badge
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0x2210B981)),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = "✓ DEVICE PAIRED & PROTECTED",
                                color = Color(0xFF34D399),
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = uiState.deviceName,
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "Device ID: ${uiState.deviceId}",
                            color = Color(0xFF64748B),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
                        )

                        // Service Control Toggle Buttons
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { ParentalForegroundService.startService(context) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("START SERVICE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = { ParentalForegroundService.stopService(context) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF475569)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("STOP SERVICE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Connection Status Card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0B0F19)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Connection Status:", color = Color(0xFF94A3B8), fontSize = 12.sp)
                                    Text(
                                        text = uiState.connectionStatus,
                                        color = if (uiState.connectionStatus == "CONNECTED") Color(0xFF34D399) else Color(0xFFF59E0B),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Last Heartbeat:", color = Color(0xFF94A3B8), fontSize = 12.sp)
                                    Text(
                                        text = formatTime(uiState.lastHeartbeatTimestamp),
                                        color = Color.White,
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }

                        // Milestone 1.1 Location Status Card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0B0F19)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Location Status (M1.1):", color = Color(0xFF94A3B8), fontSize = 12.sp)
                                    Text(
                                        text = uiState.locationStatus,
                                        color = if (uiState.locationStatus.startsWith("Location successfully shared")) Color(0xFF34D399) else Color(0xFFF59E0B),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    )
                                }

                                Button(
                                    onClick = onLocationFixClicked,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9)),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.fillMaxWidth().height(36.dp),
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text("SHARE ONE-TIME GPS LOCATION FIX", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }


                        // Battery Optimization Status Card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0B0F19)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Battery Optimization",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                        Text(
                                            text = if (isBatteryOptIgnored) "Unrestricted (Recommended)" else "Optimized (May pause background sync)",
                                            color = if (isBatteryOptIgnored) Color(0xFF34D399) else Color(0xFFF59E0B),
                                            fontSize = 11.sp
                                        )
                                    }

                                    Button(
                                        onClick = {
                                            try {
                                                context.startActivity(batteryManager.createOptimizationRequestIntent())
                                                isBatteryOptIgnored = batteryManager.isIgnoringBatteryOptimizations()
                                            } catch (_: Exception) {}
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text("Configure", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }

                        // Last Crash Log Card (if crash report exists)
                        lastCrashLog?.let { crash ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0x33F43F5E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "Last Sanitized Crash Log:",
                                        color = Color(0xFFFB7185),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    )
                                    Text(
                                        text = crash.take(200),
                                        color = Color.LightGray,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }
                            }
                        }

                        // Milestone 5 Reliability Notice Card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0x1A38BDF8)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "Milestone 5 Active: Foreground Protection Service runs in background with low-priority notification, network callbacks, and boot auto-recovery.",
                                color = Color(0xFF38BDF8),
                                fontSize = 11.sp,
                                modifier = Modifier.padding(10.dp),
                                textAlign = TextAlign.Center
                            )
                        }

                        // Unpair Button
                        Button(
                            onClick = onUnpairClicked,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                        ) {
                            Text("UNPAIR DEVICE", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

private fun formatTime(timestamp: Long?): String {
    if (timestamp == null || timestamp == 0L) return "Waiting for ping..."
    return SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(timestamp))
}
