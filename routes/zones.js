const express = require('express');
const router = express.Router(); // ✅ THIS WAS MISSING!
const Zone = require('../models/Zone');

// GET all zones (for displaying on map)
router.get('/', async (req, res) => {
    try {
        const zones = await Zone.find({});
        res.json({
            success: true,
            data: zones
        });
    } catch (error) {
        console.error('GET zones error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /check-location - point-in-polygon check
router.post('/check-location', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        console.log('📍 Received location:', lat, lng);

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        console.log('🔍 Querying MongoDB for point:', longitude, latitude);

        // Query using $geoWithin
        const zone = await Zone.findOne({
        geometry: {
        $geoIntersects: {
            $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        }
    }
});

        console.log('✅ Query result:', zone ? zone.name : 'No zone found');

        if (!zone) {
            return res.json({
                success: true,
                riskLevel: 'none',
                message: 'No flood risk zone found for this location.'
            });
        }

        res.json({
            success: true,
            riskLevel: zone.riskLevel,
            zoneName: zone.name,
            district: zone.district || 'Unknown'
        });
    } catch (error) {
        console.error('❌ Check location error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;