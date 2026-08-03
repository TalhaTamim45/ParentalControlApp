# Folder Structure Reference

```
E:\ParentalControlApp/
├── backend-server/             # Node.js + Express + Socket.io Relay Server (Port 4000)
├── parent-dashboard/           # React + Vite Web Dashboard (Port 3000)
├── child-android-app/          # Android Companion App (Gradle + Compose + Hilt - API 36)
│   ├── gradle/
│   │   ├── wrapper/            # Gradle Wrapper Properties
│   │   └── libs.versions.toml  # Centralized Gradle Version Catalog
│   ├── gradlew                 # Gradle wrapper Unix script
│   ├── gradlew.bat             # Gradle wrapper Windows script
│   ├── settings.gradle.kts     # Gradle settings
│   ├── build.gradle.kts        # Root build script
│   └── app/                    # Main Android Application Module
│       ├── build.gradle.kts    # App build configuration (compileSdk 36, targetSdk 36)
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── java/com/parental/child/
│               ├── ChildApplication.kt
│               ├── di/
│               └── ui/
├── shared/                     # Platform-independent preliminary JSON schemas
│   └── schemas/
├── legacy/                     # Archived prototype files (Read-only)
│   └── child-android-app/
└── docs/                       # Project documentation
```
