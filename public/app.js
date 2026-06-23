// ============================================================
// Flood Risk Checker - Frontend
// ============================================================

// ============================================================
// Configuration
// ============================================================
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api/zones'
    : 'https://flood-risk-checker.onrender.com/api/zones';

// ============================================================
// DOM Elements
// ============================================================
const locateBtn = document.getElementById('locateBtn');
const locationStatus = document.getElementById('locationStatus');
const riskDisplay = document.getElementById('riskDisplay');
const rainfallContainer = document.getElementById('rainfallData');
const layerControls = document.getElementById('layerControls');

// ============================================================
// State
// ============================================================
let map = null;
let userMarker = null;
let riskLayer = null;
let rainLayer = null;
let userLayer = null;
let currentLocation = null;
let riskZonesData = [];
let layerControlObj = null;

// ============================================================
// Initialize Map
// ============================================================
function initMap() {
    map = L.map('map', {
        center: [10.5276, 76.2144],
        zoom: 8,
        zoomControl: true
    });

    // Base tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Create layer groups
    riskLayer = L.layerGroup().addTo(map);
    rainLayer = L.layerGroup().addTo(map);
    userLayer = L.layerGroup().addTo(map);

    // Create Leaflet Layer Control (top-right corner of map)
    const baseMaps = {
        'Street Map': tileLayer
    };

    const overlayMaps = {
        'Flood Risk Zones': riskLayer,
        'Rain Gauges': rainLayer,
        'My Location': userLayer
    };

    layerControlObj = L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    // ✅ NEW: Create sidebar layer controls
    createSidebarLayerControls(overlayMaps);

    // Load data
    loadRiskZones();
    loadRainfallData();

    // Map click handler
    map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        await checkLocation(lat, lng);
    });
}

// ============================================================
// ✅ NEW: Create Sidebar Layer Controls (Checkboxes)
// ============================================================
function createSidebarLayerControls(overlayMaps) {
    if (!layerControls) return;
    
    let html = '';
    for (const [name, layer] of Object.entries(overlayMaps)) {
        // Check if layer is currently on the map
        const isChecked = map.hasLayer(layer) ? 'checked' : '';
        
        html += `
            <label class="layer-toggle">
                <input type="checkbox" ${isChecked} data-layer-name="${name}">
                ${name}
            </label>
        `;
    }
    
    layerControls.innerHTML = html;

    // Add event listeners to checkboxes
    document.querySelectorAll('.layer-toggle input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const layerName = this.dataset.layerName;
            const layer = overlayMaps[layerName];
            
            if (this.checked) {
                map.addLayer(layer);
            } else {
                map.removeLayer(layer);
            }
        });
    });
}

// ============================================================
// Load Risk Zones from API
// ============================================================
async function loadRiskZones() {
    try {
        const response = await fetch(`${API_URL}`);
        if (!response.ok) throw new Error('Failed to fetch zones');
        const result = await response.json();

        if (result.success) {
            riskZonesData = result.data;
            console.log(`✅ Loaded ${riskZonesData.length} risk zones`);
            displayRiskZones(riskZonesData);
        } else {
            console.warn('No zones loaded');
        }
    } catch (error) {
        console.error('Error loading risk zones:', error);
    }
}

// ============================================================
// Display Risk Zones on Map
// ============================================================
function displayRiskZones(zones) {
    riskLayer.clearLayers();

    const riskColors = {
        low: '#27ae60',
        medium: '#f39c12',
        high: '#e74c3c'
    };

    const features = zones.map(zone => ({
        type: 'Feature',
        geometry: zone.geometry,
        properties: {
            riskLevel: zone.riskLevel,
            name: zone.name,
            district: zone.district
        }
    }));

    const geoJsonData = {
        type: 'FeatureCollection',
        features: features
    };

    const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: function(feature) {
            const risk = feature.properties.riskLevel || 'low';
            return {
                fillColor: riskColors[risk] || '#ccc',
                fillOpacity: 0.45,
                color: '#333',
                weight: 1.5,
                opacity: 0.8
            };
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties;
            const riskEmoji = props.riskLevel === 'high' ? '🔴' : (props.riskLevel === 'medium' ? '🟠' : '🟢');
            layer.bindPopup(`
                <div style="min-width:150px;">
                    <h4 style="margin:0 0 8px 0;">${props.name}</h4>
                    <p style="margin:4px 0;"><strong>Risk:</strong> ${riskEmoji} ${props.riskLevel.toUpperCase()}</p>
                    <p style="margin:4px 0;"><strong>District:</strong> ${props.district || 'N/A'}</p>
                </div>
            `);
        }
    });

    geoJsonLayer.addTo(riskLayer);
    console.log('✅ Risk zones displayed on map');
}

// ============================================================
// Check Location Against Risk Zones
// ============================================================
async function checkLocation(lat, lng) {
    try {
        console.log(`📍 Checking location: ${lat}, ${lng}`);
        const response = await fetch(`${API_URL}/check-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API error response:', errorText);
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('📦 API response:', result);

        if (result.success) {
            updateRiskDisplay(result.riskLevel, result.zoneName, result.district);
            locationStatus.textContent = `📍 Location checked: ${result.riskLevel === 'none' ? 'No risk' : result.riskLevel.toUpperCase() + ' RISK'}`;
            locationStatus.style.color = result.riskLevel === 'high' ? '#e74c3c' : (result.riskLevel === 'medium' ? '#f39c12' : '#27ae60');
        } else {
            locationStatus.textContent = '❌ Error: ' + (result.message || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Check location error:', error);
        locationStatus.textContent = '❌ Failed to check location: ' + error.message;
    }
}

// ============================================================
// Update Risk Display in Sidebar
// ============================================================
function updateRiskDisplay(riskLevel, zoneName, district) {
    const icons = {
        'low': '🟢',
        'medium': '🟠',
        'high': '🔴',
        'none': '✅'
    };
    const labels = {
        'low': 'Low Risk',
        'medium': 'Medium Risk',
        'high': 'HIGH RISK',
        'none': 'No Risk'
    };

    let html = '';
    if (riskLevel === 'none') {
        html = `
            <div class="risk-none">
                <span style="font-size:2rem;display:block;">✅</span>
                <p>No flood risk zone found for this location.</p>
            </div>
        `;
    } else {
        html = `
            <div class="risk-${riskLevel}">
                <span class="risk-level-icon">${icons[riskLevel]}</span>
                <h4 style="font-size:1.3rem;">${labels[riskLevel]}</h4>
                ${zoneName ? `<p><strong>Zone:</strong> ${zoneName}</p>` : ''}
                ${district ? `<p><strong>District:</strong> ${district}</p>` : ''}
            </div>
        `;
    }
    riskDisplay.innerHTML = html;
}

// ============================================================
// Get User Location
// ============================================================
function getUserLocation() {
    locationStatus.textContent = '📍 Getting location...';

    if (!navigator.geolocation) {
        locationStatus.textContent = '❌ Geolocation not supported';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentLocation = { lat, lng };

            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '📍',
                    iconSize: [32, 32]
                })
            }).bindPopup('📍 Your location').addTo(userLayer);

            map.setView([lat, lng], 12);

            locationStatus.textContent = `📍 Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            await checkLocation(lat, lng);
        },
        (error) => {
            console.error('Geolocation error:', error);
            locationStatus.textContent = '❌ Could not get location. Please allow location access.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ============================================================
// ✅ UPDATED: Load Rainfall Data (More Locations)
// ============================================================
async function loadRainfallData() {
    // Added more cities for better coverage
    const cities = [
        { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
        { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
        { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
        { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
        { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
        { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
        { name: 'Kottayam', lat: 9.5916, lng: 76.5222 },
        { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 },
        { name: 'Idukki', lat: 9.8550, lng: 76.9666 },
        { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
        { name: 'Kasaragod', lat: 12.4991, lng: 74.9865 },
        { name: 'Wayanad', lat: 11.6854, lng: 76.1320 }
    ];

    // Simulated rainfall (mm/hr) - more varied values
    const simulatedRainfall = [2.3, 0.5, 1.8, 0.0, 3.1, 0.2, 1.2, 0.8, 0.0, 0.3, 0.0, 2.5];

    try {
        rainLayer.clearLayers();
        
        let html = '';
        const rainLayerGroup = L.layerGroup();

        cities.forEach((city, index) => {
            const rain = simulatedRainfall[index] || 0;
            const radius = Math.max(rain * 500, 2000);

            const circle = L.circle([city.lat, city.lng], {
                radius: radius,
                color: '#2980b9',
                fillColor: '#2980b9',
                fillOpacity: 0.4,
                weight: 2
            }).bindPopup(`
                <div>
                    <h4>${city.name}</h4>
                    <p>Rainfall: ${rain} mm/hr</p>
                    <p>Radius: ${radius.toFixed(0)} m</p>
                </div>
            `);
            circle.addTo(rainLayerGroup);

            // Rainfall emoji based on amount
            let rainEmoji = '☀️';
            if (rain > 2) rainEmoji = '🌧️';
            else if (rain > 1) rainEmoji = '🌦️';
            else if (rain > 0) rainEmoji = '⛅';

            html += `
                <div class="rainfall-item">
                    <span class="rainfall-city">${rainEmoji} ${city.name}</span>
                    <span class="rainfall-value">${rain} mm/hr</span>
                </div>
            `;
        });

        rainLayerGroup.addTo(rainLayer);
        rainfallContainer.innerHTML = html || '<p>No rainfall data available.</p>';
        console.log('✅ Rainfall data loaded for', cities.length, 'cities');
    } catch (error) {
        console.error('Error loading rainfall data:', error);
        rainfallContainer.innerHTML = '<p class="loading-text">Failed to load rainfall data.</p>';
    }
}

// ============================================================
// Event Listeners
// ============================================================
locateBtn.addEventListener('click', getUserLocation);

// ============================================================
// Initialize App
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌊 Flood Risk Checker initializing...');
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }
    initMap();
});