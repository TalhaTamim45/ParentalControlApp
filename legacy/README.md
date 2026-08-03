# Legacy Code Archive

This folder stores original prototype files and early templates from before the Phase 1 Clean Architecture scaffolding. No legacy files were deleted.

## Archived Items

### 1. `legacy/child-android-app/AndroidManifest.xml`
- **Original Path**: `E:\ParentalControlApp\child-android-app\AndroidManifest.xml`
- **Reason for Archiving**: Placed directly in root folder of `child-android-app` rather than standard Gradle module path (`app/src/main/AndroidManifest.xml`). Contained early permissions for camera, microphone, and location, which are deferred to future phases per Phase 1 scope guidelines.

### 2. `legacy/child-android-app/ParentalBackgroundService.kt`
- **Original Path**: `E:\ParentalControlApp\child-android-app\src\main\java\com\parental\child\services\ParentalBackgroundService.kt`
- **Reason for Archiving**: Contained invalid Kotlin syntax (`const channel = ...` inside function) and missing imports/declarations. Preserved for reference when implementing background location pings in later phases.
