# Project Rules for ParentalControlApp

## MANDATORY RULE: Real-World Functionality Only (No Mock/Simulated Data)

This is a permanent requirement for the entire ParentalControlApp project.

1. **No Simulated or Mock Features**: Do not create demo-only, simulated, mock, prototype-only, or test-only functionality in production code.
2. **Clear "Not Implemented" Badges**: If a real feature is not implemented yet, the UI must explicitly state: `"Not implemented yet"` or the feature should not be displayed.
3. **Real Architecture & Verification**:
   - Every feature operates through the real Child Android App, Backend Server, Parent Dashboard, physical Android phone, real authentication, and real network communication.
   - Production code must never depend on test fixtures, simulated devices, or mock responses.
   - If a physical phone is required for milestone completion and not connected, report the exact real status and the simple phone action required from the user. Do not mark the milestone complete until verified on a physical phone.
