package com.parental.child.di

import android.content.Context
import com.parental.child.data.credentials.CredentialManager
import com.parental.child.data.credentials.KeystoreManager
import com.parental.child.data.network.PairingApiClient
import com.parental.child.data.pairing.PairingRepository
import com.parental.child.data.presence.PresenceCoordinator
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideKeystoreManager(): KeystoreManager {
        return KeystoreManager()
    }

    @Provides
    @Singleton
    fun provideCredentialManager(
        @ApplicationContext context: Context,
        keystoreManager: KeystoreManager
    ): CredentialManager {
        return CredentialManager(context, keystoreManager)
    }

    @Provides
    @Singleton
    fun providePairingApiClient(): PairingApiClient {
        return PairingApiClient()
    }

    @Provides
    @Singleton
    fun providePairingRepository(
        credentialManager: CredentialManager,
        apiClient: PairingApiClient
    ): PairingRepository {
        return PairingRepository(credentialManager, apiClient)
    }

    @Provides
    @Singleton
    fun providePresenceCoordinator(
        credentialManager: CredentialManager,
        apiClient: PairingApiClient
    ): PresenceCoordinator {
        return PresenceCoordinator(credentialManager, apiClient)
    }
}
