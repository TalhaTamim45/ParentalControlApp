package com.parental.child.utils

import android.content.Context
import timber.log.Timber
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Global Uncaught Exception Handler for safe crash diagnostics without crash loops.
 * Sanitizes stack traces, records local error log, and delegates to standard default handler.
 */
class CrashHandler private constructor(
    private val context: Context,
    private val defaultHandler: Thread.UncaughtExceptionHandler?
) : Thread.UncaughtExceptionHandler {

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        try {
            val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
            val sanitizedMessage = sanitizeLog(throwable.message ?: "No error message")
            val sanitizedStack = sanitizeLog(throwable.stackTraceToString())

            val crashLog = """
                === CRASH REPORT [$timestamp] ===
                Thread: ${thread.name} (id: ${thread.id})
                Exception: ${throwable.javaClass.name}
                Message: $sanitizedMessage
                StackTrace:
                $sanitizedStack
                =================================
            """.trimIndent()

            Timber.e("Uncaught exception detected: %s", throwable.javaClass.name)
            saveCrashLog(context, crashLog)

        } catch (e: Exception) {
            Timber.e(e, "Error inside CrashHandler while processing crash")
        } finally {
            // Delegate to system default handler to ensure standard Android crash reporting
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun sanitizeLog(raw: String): String {
        return raw.replace(Regex("(?i)(token|password|secret|pairingcode|auth)=[^&\\s]+"), "$1=[REDACTED]")
            .replace(Regex("(?i)bearer\\s+[a-z0-9._-]+"), "Bearer [REDACTED]")
    }

    private fun saveCrashLog(context: Context, log: String) {
        try {
            val crashDir = File(context.filesDir, "crash_logs")
            if (!crashDir.exists()) {
                crashDir.mkdirs()
            }
            val logFile = File(crashDir, "last_crash.txt")
            logFile.writeText(log)
        } catch (e: Exception) {
            Timber.e(e, "Failed to write crash log file")
        }
    }

    companion object {
        fun init(context: Context) {
            val currentHandler = Thread.getDefaultUncaughtExceptionHandler()
            if (currentHandler !is CrashHandler) {
                Thread.setDefaultUncaughtExceptionHandler(CrashHandler(context, currentHandler))
                Timber.i("Global CrashHandler initialized")
            }
        }

        fun getLastCrashReport(context: Context): String? {
            return try {
                val logFile = File(File(context.filesDir, "crash_logs"), "last_crash.txt")
                if (logFile.exists()) logFile.readText() else null
            } catch (_: Exception) {
                null
            }
        }
    }
}
