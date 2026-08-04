package com.parental.child.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import timber.log.Timber
import java.util.concurrent.atomic.AtomicBoolean

enum class NetworkTransport {
    WIFI,
    CELLULAR,
    OTHER,
    NONE
}

class NetworkMonitor(
    context: Context,
    private val onNetworkStatusChanged: (isConnected: Boolean, transport: NetworkTransport) -> Unit
) {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val isMonitoring = AtomicBoolean(false)
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    fun startMonitoring() {
        if (!isMonitoring.compareAndSet(false, true)) {
            Timber.d("NetworkMonitor already active")
            return
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                val transport = getTransport(network)
                Timber.i("Network available: %s", transport)
                onNetworkStatusChanged(true, transport)
            }

            override fun onLost(network: Network) {
                Timber.w("Network lost")
                onNetworkStatusChanged(false, NetworkTransport.NONE)
            }

            override fun onCapabilitiesChanged(
                network: Network,
                capabilities: NetworkCapabilities
            ) {
                val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                val transport = getTransport(network)
                Timber.d("Network capabilities changed: internetValidated=$hasInternet, transport=$transport")
                if (hasInternet) {
                    onNetworkStatusChanged(true, transport)
                }
            }
        }

        try {
            connectivityManager.registerNetworkCallback(request, networkCallback!!)
            Timber.i("Registered default network callback successfully")
        } catch (e: Exception) {
            Timber.e(e, "Failed to register network callback")
        }
    }

    fun stopMonitoring() {
        if (isMonitoring.compareAndSet(true, false)) {
            networkCallback?.let {
                try {
                    connectivityManager.unregisterNetworkCallback(it)
                    Timber.i("Unregistered network callback")
                } catch (e: Exception) {
                    Timber.e(e, "Failed to unregister network callback")
                }
            }
            networkCallback = null
        }
    }

    fun isCurrentlyConnected(): Boolean {
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun getTransport(network: Network): NetworkTransport {
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return NetworkTransport.NONE
        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkTransport.WIFI
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkTransport.CELLULAR
            else -> NetworkTransport.OTHER
        }
    }
}
