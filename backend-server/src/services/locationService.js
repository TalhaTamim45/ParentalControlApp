const { getDb, saveDb } = require('../storage/devStorage');
const presenceService = require('./presenceService');

// In-memory set for eventId idempotency (Milestone 1.1)
const processedEventIds = new Set();
const MAX_EVENT_ID_CACHE = 10000;

class LocationService {

    /**
     * Validates and persists one location payload fix (Milestone 1.1).
     * Device identity is derived EXCLUSIVELY from tokenAuth.deviceId.
     */
    updateLocationFix(tokenDevice, payload) {
        const deviceId = tokenDevice ? (tokenDevice.id || tokenDevice.deviceId) : null;
        if (!deviceId) {
            return { success: false, error: 'Unauthorized device token', status: 401 };
        }

        // Verify device is active and not revoked
        const db = getDb();
        const deviceRecord = db.devices[deviceId];
        if (!deviceRecord || deviceRecord.revokedAt) {
            return { success: false, error: 'Device is revoked or un-paired', status: 403 };
        }

        // Schema validation
        const {
            schemaVersion,
            eventId,
            latitude,
            longitude,
            horizontalAccuracyMeters,
            batteryPercent,
            isCharging,
            recordedAt,
            provider,
            isMockLocation
        } = payload;

        // Schema version validation (must be 1 if specified)
        if (schemaVersion !== undefined && schemaVersion !== 1) {
            return { success: false, error: 'Unsupported schema version', status: 400 };
        }

        if (!eventId || typeof eventId !== 'string') {
            return { success: false, error: 'Invalid or missing eventId', status: 400 };
        }

        // Idempotency enforcement
        if (processedEventIds.has(eventId)) {
            console.log(`[LocationService] Idempotency match for eventId: ${eventId} (Skipped duplicate execution)`);
            return { success: true, duplicate: true, receivedAt: Date.now() };
        }

        // Coordinate range validation
        if (typeof latitude !== 'number' || latitude < -90.0 || latitude > 90.0) {
            return { success: false, error: 'Invalid latitude range (-90 to 90)', status: 400 };
        }
        if (typeof longitude !== 'number' || longitude < -180.0 || longitude > 180.0) {
            return { success: false, error: 'Invalid longitude range (-180 to 180)', status: 400 };
        }

        // Accuracy validation
        if (typeof horizontalAccuracyMeters === 'number' && horizontalAccuracyMeters < 0) {
            return { success: false, error: 'Negative accuracy rejected', status: 400 };
        }

        // Battery percentage validation
        if (typeof batteryPercent === 'number' && (batteryPercent < 0 || batteryPercent > 100)) {
            return { success: false, error: 'Battery percentage out of range (0-100)', status: 400 };
        }

        // Timestamp skew validation (reject future timestamps > 5 min)
        const now = Date.now();
        if (typeof recordedAt !== 'number' || recordedAt > now + 300000) {
            return { success: false, error: 'Timestamp skew invalid (future timestamp)', status: 400 };
        }

        // Add eventId to cache
        processedEventIds.add(eventId);
        if (processedEventIds.size > MAX_EVENT_ID_CACHE) {
            const firstKey = processedEventIds.values().next().value;
            processedEventIds.delete(firstKey);
        }

        const receivedAt = now;
        const accuracy = typeof horizontalAccuracyMeters === 'number' ? horizontalAccuracyMeters : 0.0;
        const batt = typeof batteryPercent === 'number' ? batteryPercent : 100;
        const charging = Boolean(isCharging);

        // Build sanitized location object (NO EXACT COORDINATES PRINTED TO LOGS)
        const locationData = {
            eventId,
            latitude,
            longitude,
            horizontalAccuracyMeters: accuracy,
            altitudeMeters: payload.altitudeMeters || null,
            speedMetersPerSecond: payload.speedMetersPerSecond || null,
            bearingDegrees: payload.bearingDegrees || null,
            batteryPercent: batt,
            isCharging: charging,
            recordedAt,
            receivedAt,
            deviceElapsedRealtimeNanos: payload.deviceElapsedRealtimeNanos || null,
            provider: provider || 'fused',
            isMockLocation: Boolean(isMockLocation)
        };

        // Persist to storage abstraction (attached to device record)
        deviceRecord.lastLocation = locationData;
        deviceRecord.lastSeen = receivedAt;
        deviceRecord.updatedAt = receivedAt;
        saveDb();

        // Sanitized Log (Zero exact coordinates printed)
        console.log(`[LocationService] Location fix saved for ${deviceId} | Acc: ${accuracy}m | Batt: ${batt}% | EventID: ${eventId}`);

        // Broadcast to Socket.io presence coordinator / parent room
        presenceService.broadcastLocationChanged(deviceId, {
            deviceId,
            latitude,
            longitude,
            horizontalAccuracyMeters: accuracy,
            batteryPercent: batt,
            isCharging: charging,
            recordedAt,
            receivedAt,
            isStale: false
        });

        return { success: true, receivedAt };
    }

    /**
     * Gets latest location fix for parent query.
     */
    getLatestLocation(deviceId) {
        const db = getDb();
        const deviceRecord = db.devices[deviceId];
        if (!deviceRecord || deviceRecord.revokedAt) {
            return { success: false, error: 'Device not found or revoked', status: 404 };
        }

        const lastLoc = deviceRecord.lastLocation;
        if (!lastLoc) {
            return { success: false, error: 'No location fix recorded yet for device', status: 404 };
        }

        const now = Date.now();
        const isStale = (now - lastLoc.receivedAt) > (15 * 60 * 1000); // >15 mins is stale

        return {
            success: true,
            location: {
                deviceId,
                latitude: lastLoc.latitude,
                longitude: lastLoc.longitude,
                horizontalAccuracyMeters: lastLoc.horizontalAccuracyMeters,
                altitudeMeters: lastLoc.altitudeMeters,
                speedMetersPerSecond: lastLoc.speedMetersPerSecond,
                bearingDegrees: lastLoc.bearingDegrees,
                batteryPercent: lastLoc.batteryPercent,
                isCharging: lastLoc.isCharging,
                recordedAt: lastLoc.recordedAt,
                receivedAt: lastLoc.receivedAt,
                provider: lastLoc.provider,
                isStale
            }
        };
    }
}

module.exports = new LocationService();
