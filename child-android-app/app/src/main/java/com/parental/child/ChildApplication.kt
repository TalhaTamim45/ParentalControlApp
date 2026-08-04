package com.parental.child

import android.app.Application
import com.parental.child.utils.CrashHandler
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class ChildApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        CrashHandler.init(this)
        Timber.i("ChildApplication initialized - Milestone 5 Reliability Active")
    }
}
