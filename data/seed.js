const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flooddb');
        console.log('✅ Connected to MongoDB');

        // Clear existing zones
        await Zone.deleteMany({});
        console.log('🗑️ Cleared existing zones');

        // Read the GeoJSON file
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'kerala_flood_zones.geojson'), 'utf8'));
        
        // Extract features and transform to MongoDB documents
        const zones = data.features.map(feature => ({
            name: feature.properties.name,
            riskLevel: feature.properties.riskLevel,
            district: feature.properties.district,
            geometry: feature.geometry
        }));

        // Insert zones
        const result = await Zone.insertMany(zones);
        console.log(`✅ Inserted ${result.length} flood zones`);

        // Create 2dsphere index
        await Zone.collection.createIndex({ geometry: '2dsphere' });
        console.log('✅ Created 2dsphere index');

        console.log('\n🌊 Flood zones seeded successfully!');
        console.log('\n📋 Zones added:');
        zones.forEach(z => {
            console.log(`  - ${z.name} (${z.riskLevel} risk) - ${z.district}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seed();