package com.parental.child.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // Hilt Dependency Injection module ready for repositories & network clients in future phases
}
