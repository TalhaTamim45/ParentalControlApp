# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - Phase 1 Milestone 1 (2026-08-04)

### Added
- Created Version Catalog `child-android-app/gradle/libs.versions.toml` specifying AGP 9.2.1, Kotlin 2.1.0, Compose BOM 2026.04.01, Hilt 2.60.1, KSP 2.1.0-1.0.29, Timber 5.0.1, and target/compile SDK 36.
- Scaffolded minimal Android Compose app with `ChildApplication.kt`, `MainActivity.kt`, `MainViewModel.kt`, `UiState.kt`, `LauncherScreen.kt`, and `ChildAppTheme`.
- Added Gradle wrapper scripts (`gradlew`, `gradlew.bat`, `gradle-wrapper.properties`).
- Created preliminary shared JSON schemas in `shared/schemas/`.
- Created documentation suite (`decision-log.md`, `architecture.md`, `roadmap.md`, `api.md`, `socket-events.md`, `permissions.md`, `project-status.md`, `build-instructions.md`, `folder-structure.md`, `changelog.md`).

### Changed
- Converted `child-android-app` to a standard Gradle project.
- Archived legacy un-scaffolded files to `legacy/child-android-app/`.
