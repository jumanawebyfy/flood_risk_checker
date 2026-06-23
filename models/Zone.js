const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    district: {
        type: String,
        trim: true
    },
    // Use a flexible schema for GeoJSON
    geometry: {
        type: Object,  // Accept any GeoJSON object
        required: true
    }
}, {
    timestamps: true
});

// Create 2dsphere index on the geometry field
zoneSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);