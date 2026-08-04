# Changelog

All notable changes to this project will be documented in this file.

## [Milestone 2] - Phase 1 Milestone 2 (2026-08-04)

### Added
- Feature branch `feature/first-working-apk`.
- Completed Android Build Environment setup: Temurin JDK 17 (`C:\Android\jdk-17`), Android SDK 36 (`C:\Android\Sdk\platforms\android-36`), Build Tools 36.0.0 (`C:\Android\Sdk\build-tools\36.0.0`), Platform Tools 37.0.1 (`C:\Android\Sdk\platform-tools`).
- Official Gradle 9.4.1 Wrapper setup (`gradle-wrapper.jar` and `gradle-wrapper.properties`).
- Built and generated first working Debug APK (`app-debug.apk`, 11.32 MB, SHA-256: `0F2B10BAB5670E8B9590F2D25B0C96CCA50D099365CC2FC86FAB8BEC56943D4B`).
- Dynamic `BuildConfig` fields (`ENVIRONMENT`, `BUILD_DATE`) injected via Gradle `providers.provider {}` in `app/build.gradle.kts`.
- Enhanced Compose `LauncherScreen.kt` with Material 3 AssistChips rendering version badge, build type, build date, connection status, and protection status placeholders.

### Changed
- Configured AGP 9.2.1 built-in Kotlin support with Gradle 9.4.1 and KSP 2.1.0 compatibility.
- Refactored `MainViewModel.kt` to consume standard AGP `BuildConfig.VERSION_NAME` and `BuildConfig.BUILD_TYPE` directly.

### Fixed
- Fixed `super.onCreate(savedInstanceState)` method invocation in `MainActivity.kt`.
- Resolved AGP 9 Kotlin source set compatibility via `android.disallowKotlinSourceSets=false`.
