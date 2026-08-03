# Cross-Platform Schema & Code Generation Strategy

To ensure zero divergence between the backend, parent dashboard, and child Android app without duplicating definitions manually:

1. **Single Source of Truth**: JSON Schemas in `shared/schemas/` define the structural contracts.
2. **Platform Implementations**:
   - **Parent Dashboard**: Native TypeScript types inside `parent-dashboard/src/shared/socketEvents.ts`.
   - **Child Android App**: Native Kotlin data classes & objects inside `child-android-app/app/src/main/java/com/parental/child/data/network/SocketEvents.kt`.
   - **Backend Server**: Native JavaScript module exports inside `backend-server/src/shared/socketEvents.js`.
3. **Future Phase Tooling**: Schema validation libraries (AJV for Node.js/TS, Kotlinx.serialization for Android) will validate incoming and outgoing payloads against `shared/schemas/` definitions during builds and tests.
