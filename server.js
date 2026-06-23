const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware
// ============================================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500','https://flood-risk-checker.vercel.app'],
    credentials: true
}));
app.use(express.json());
app.use(express.json({
    verify: (req, res, buf) => {
        console.log("RAW BODY:", buf.toString());
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// MongoDB Connection
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flooddb';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ============================================================
// Routes
// ============================================================
const zoneRoutes = require('./routes/zones');
app.use('/api/zones', zoneRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ success: false, message: err.message });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/zones`);
});

// ============================================================
// PROXY ROUTES FOR GREEN SPACE MAP
// ============================================================

// Proxy for Nominatim (Geocoding)
app.get('/api/geocode', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }
        
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&polygon_geojson=1`;
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'GreenSpaceMap/1.0 (via proxy)',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Nominatim error: ${response.status}` });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Geocode proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy for Overpass (Parks)
app.get('/api/overpass-parks', async (req, res) => {
    try {
        const { south, west, north, east } = req.query;
        if (!south || !west || !north || !east) {
            return res.status(400).json({ error: 'Missing bounding box parameters' });
        }
        
        const query = `[out:json][timeout:30];way["leisure"="park"](${south},${west},${north},${east});out geom;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'GreenSpaceMap/1.0 (via proxy)' }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Overpass error: ${response.status}` });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Overpass parks proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy for Overpass (Trees)
app.get('/api/overpass-trees', async (req, res) => {
    try {
        const { south, west, north, east } = req.query;
        if (!south || !west || !north || !east) {
            return res.status(400).json({ error: 'Missing bounding box parameters' });
        }
        
        const query = `[out:json][timeout:30];node["natural"="tree"](${south},${west},${north},${east});out;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'GreenSpaceMap/1.0 (via proxy)' }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Overpass error: ${response.status}` });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Overpass trees proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});