package com.parental.child.network

import okhttp3.Call
import okhttp3.EventListener
import okhttp3.Handshake
import okhttp3.Protocol
import okhttp3.Response
import timber.log.Timber
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy
import java.security.cert.X509Certificate

/**
 * Debug-only OkHttp EventListener that logs TLS handshake, DNS, certificate, and HTTP status diagnostics.
 * This class exists ONLY under src/debug/ and is never included in release builds.
 */
class DebugTlsEventListener : EventListener() {

    override fun dnsStart(call: Call, domainName: String) {
        Timber.d("[TLS-DIAG] DNS start -> Hostname: %s", domainName)
    }

    override fun dnsEnd(call: Call, domainName: String, inetAddressList: List<InetAddress>) {
        val addrs = inetAddressList.joinToString { it.hostAddress ?: "" }
        Timber.d("[TLS-DIAG] DNS end -> Hostname: %s | Addresses: [%s]", domainName, addrs)
    }

    override fun secureConnectStart(call: Call) {
        Timber.d("[TLS-DIAG] secureConnectStart -> Host: %s", call.request().url.host)
    }

    override fun secureConnectEnd(call: Call, handshake: Handshake?) {
        if (handshake != null) {
            val tlsVersion = handshake.tlsVersion.javaName
            val cipherSuite = handshake.cipherSuite.javaName
            val certSubjects = handshake.peerCertificates.mapNotNull { cert ->
                (cert as? X509Certificate)?.subjectX500Principal?.name
            }.joinToString(" -> ")

            Timber.d(
                "[TLS-DIAG] secureConnectEnd -> TLS: %s | Cipher: %s | Peer Certs: [%s]",
                tlsVersion, cipherSuite, certSubjects
            )
        } else {
            Timber.d("[TLS-DIAG] secureConnectEnd -> Handshake is null")
        }
    }

    override fun connectFailed(
        call: Call,
        inetSocketAddress: InetSocketAddress,
        proxy: Proxy,
        protocol: Protocol?,
        ioException: IOException
    ) {
        Timber.e(
            ioException,
            "[TLS-DIAG] connectFailed -> Host: %s | Addr: %s | Exception: %s: %s",
            call.request().url.host,
            inetSocketAddress,
            ioException.javaClass.name,
            ioException.message
        )
    }

    override fun responseHeadersEnd(call: Call, response: Response) {
        Timber.d(
            "[TLS-DIAG] Response received -> Host: %s | HTTP Status: %d",
            call.request().url.host,
            response.code
        )
    }

    override fun callFailed(call: Call, ioException: IOException) {
        Timber.e(
            ioException,
            "[TLS-DIAG] callFailed -> Host: %s | Exception: %s: %s",
            call.request().url.host,
            ioException.javaClass.name,
            ioException.message
        )
    }

    class Factory : EventListener.Factory {
        override fun create(call: Call): EventListener = DebugTlsEventListener()
    }
}
