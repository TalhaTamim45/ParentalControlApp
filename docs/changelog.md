# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - Phase 1 Milestone 2 (2026-08-04)

### Added
- Feature branch `feature/first-working-apk`.
- Dynamic `BuildConfig` fields (`ENVIRONMENT`, `BUILD_DATE`) injected via Gradle `providers.provider {}` in `app/build.gradle.kts`.
- Enhanced Compose `LauncherScreen.kt` with Material 3 AssistChips rendering version badge, build type, build date, connection status, and protection status placeholders.
- ADB executable verified at `C:\Users\Hi\Downloads\platform-tools-latest-windows\platform-tools\adb.exe` (v37.0.0).

### Changed
- Refactored `MainViewModel.kt` to consume standard AGP `BuildConfig.VERSION_NAME` and `BuildConfig.BUILD_TYPE` directly without duplicate manual build fields.
- Reverified parent-dashboard build (8.15s) and backend status endpoint.

### Fixed
- Standardized `UiState.kt` data class fields for dynamic runtime binding.
