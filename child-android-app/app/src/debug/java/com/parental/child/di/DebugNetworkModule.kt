package com.parental.child.di

import com.parental.child.network.DebugTlsEventListener
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/**
 * Debug network module providing OkHttpClient configured with DebugTlsEventListener.
 * Exists ONLY under src/debug/ and is used solely for debug builds.
 */
@Module
@InstallIn(SingletonComponent::class)
object DebugNetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .eventListenerFactory(DebugTlsEventListener.Factory())
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }
}
