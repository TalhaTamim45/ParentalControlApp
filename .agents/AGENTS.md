# Project Rules for ParentalControlApp

## MANDATORY RULE: Real-World Functionality Only (No Mock/Simulated Data)

This is a permanent requirement for the entire ParentalControlApp project.

1. **No Simulated or Mock Features**: Do not create demo-only, simulated, mock, prototype-only, or test-only functionality in production code.
2. **Clear "Not Implemented" Badges**: If a real feature is not implemented yet, the UI must explicitly state: `"Not implemented yet"` or the feature should not be displayed.
3. **Real Architecture & Verification**:
   - Every feature operates through the real Child Android App, Backend Server, Parent Dashboard, physical Android phone, real authentication, and real network communication.
   - Production code must never depend on test fixtures, simulated devices, or mock responses.
   - If a physical phone is required for milestone completion and not connected, report the exact real status and the simple phone action required from the user. Do not mark the milestone complete until verified on a physical phone.

## Verification Accuracy Rule

Never describe any feature, milestone, deployment, or capability as:

* 100% complete
* Fully verified
* Production ready
* Completely operational
* Real-world verified

unless every relevant claim has been directly verified under the exact conditions described.

Examples:

* A mobile-data test does not prove a different-city test.
* A successful build does not prove physical-device operation.
* Automated tests do not replace real Android-device testing.
* Active-app heartbeat testing does not prove background, Doze, process-kill, reboot, or battery-optimization survival.
* Implemented PostgreSQL support does not prove PostgreSQL is the active production storage.
* Expected reconnection behavior must not be reported as verified unless it was actually observed.
* A configured service must not be reported as automatically recovering after reboot unless a real reboot test was completed.

Use precise status labels:

* Implemented
* Compiled
* Automatically tested
* Physically tested
* Verified on local network
* Verified over mobile data
* Verified across different networks
* Not physically tested
* Expected but unverified
* Partially complete
* Blocked
* Pending real-world verification

When a capability is inferred, expected, or tested only under similar conditions, clearly state that limitation.

Precision is more important than optimistic reporting.

## Completion Reporting Rule

Every final milestone report must separate:

1. Implemented
2. Compiled
3. Automated tests passed
4. Physically tested
5. Exact environment tested
6. Not tested
7. Known limitations
8. Remaining work

Do not mark a milestone complete when its required physical or real-world verification is still pending.
