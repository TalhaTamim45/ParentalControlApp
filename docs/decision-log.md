# Architectural Decision Log (ADR)

## ADR-001: Target Android API 36 (Android 16) Specification
- **Decision**: Set `compileSdk = 36`, `targetSdk = 36`, `minSdk = 26`.
- **Reason**: Play Store policy mandates targeting API 36 for new apps and updates. minSdk 26 preserves compatibility back to Android 8.0 Oreo while supporting modern notification channels and background execution rules.
- **Alternatives Considered**: Target API 34.
- **Trade-offs**: Requires AGP 9.2.x build tools compatibility.

## ADR-002: Android Build Tooling (AGP 9.2.1 & Gradle 9.4.1)
- **Decision**: Adopt AGP 9.2.1 with Gradle 9.4.1 and Kotlin 2.1.0.
- **Reason**: Ensures native Kotlin compiler support and seamless API 36 compilation.
- **Alternatives Considered**: AGP 8.5.2 / Gradle 8.5 (Outdated for 2026 baseline).
- **Trade-offs**: Requires JDK 17 target compatibility.

## ADR-003: Jetpack Compose for UI
- **Decision**: Use Jetpack Compose with Kotlin Compose plugin (`org.jetbrains.kotlin.plugin.compose`) and Compose BOM 2026.04.01.
- **Reason**: Declarative UI layout eliminates XML layout duplication and boilerplate code.
- **Alternatives Considered**: Traditional XML layout files.
- **Trade-offs**: Requires Kotlin 2.x compose compiler integration.

## ADR-004: Version Catalog (`libs.versions.toml`)
- **Decision**: Centralize all Gradle dependency and plugin versions in `gradle/libs.versions.toml`.
- **Reason**: Prevents version fragmentation and enforces single-source-of-truth version management across root and module build scripts.
- **Alternatives Considered**: Hardcoded string dependencies in `build.gradle.kts`.

## ADR-005: Platform-Independent Preliminary Schemas
- **Decision**: Maintain JSON Schemas in `shared/schemas/` without hardcoding disconnected Kotlin/JS source files in `shared/` until networking phase.
- **Reason**: Keeps repository modular and avoids non-compilable cross-language files in shared directories.
