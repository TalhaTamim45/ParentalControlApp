const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const { requireDeviceAuth, requireParentAuth } = require('../middleware/authMiddleware');

/**
 * Ingest one location fix (Milestone 1.1).
 * Device identity is derived EXCLUSIVELY from x-device-token header via middleware.
 */
router.post('/update', requireDeviceAuth, (req, res) => {
    try {
        const result = locationService.updateLocationFix(req.device, req.body);
        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }
        res.status(200).json(result);
    } catch (err) {
        console.error('[LocationRoute] Error updating location fix:', err);
        res.status(500).json({ success: false, error: 'Internal server error processing location' });
    }
});

/**
 * Fetch latest location fix for parent query.
 * Requires authenticated parent session.
 */
router.get('/latest/:deviceId', requireParentAuth, (req, res) => {
    try {
        const { deviceId } = req.params;
        const result = locationService.getLatestLocation(deviceId);
        if (!result.success) {
            return res.status(result.status || 404).json(result);
        }
        res.status(200).json(result);
    } catch (err) {
        console.error('[LocationRoute] Error fetching latest location:', err);
        res.status(500).json({ success: false, error: 'Internal server error fetching location' });
    }
});

module.exports = router;
