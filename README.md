# 🌊 Flood Risk Checker

A full-stack web application that checks if a user's location falls within a flood risk zone using geospatial queries. Built with Node.js, Express, MongoDB, and Leaflet.js.



## 📋 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Technologies](#-technologies)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🗺️ Map Features
- **Interactive Map** – Leaflet.js with OpenStreetMap tiles
- **Flood Risk Zones** – Color-coded polygons (🔴 High / 🟠 Medium / 🟢 Low)
- **Rain Gauges** – Circles sized by rainfall intensity
- **User Location** – GPS-enabled location marker
- **Layer Toggle** – Show/hide layers (Risk Zones, Rain Gauges, My Location)

### 🔍 Risk Assessment
- **Point-in-Polygon Detection** – Uses MongoDB `$geoIntersects` query
- **Instant Feedback** – Shows risk level when you click or use GPS
- **Zone Details** – Displays zone name and district information
- **Visual Indicators** – Color-coded risk display (Red/Orange/Green)

### 📊 Data Features
- **Flood Zone Database** – Pre-loaded with Kerala flood zones
- **Rainfall Data** – Simulated rainfall for 12+ cities
- **Real-time Updates** – No page reloads needed
- **Responsive Design** – Works on desktop, tablet, and mobile

---

## 🎥 Demo

### Live Demo
- **Frontend:** https://flood-risk-checker.vercel.app
- **Backend API:** https://flood-risk-checker-api.onrender.com/api/zones

### How It Works
1. User opens the app
2. Clicks "Get My Location" or clicks anywhere on the map
3. App sends coordinates to the backend
4. MongoDB checks if point is inside any flood zone polygon
5. Risk level (High/Medium/Low/None) is displayed instantly

---

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| **Node.js** | Backend runtime environment |
| **Express.js** | REST API framework |
| **MongoDB** | NoSQL database with geospatial support |
| **Mongoose** | ODM for MongoDB schema modeling |
| **Leaflet.js** | Interactive map library |
| **OpenStreetMap** | Free map tiles |
| **OSM Nominatim** | Geocoding (optional) |
| **HTML5, CSS3** | Frontend structure and styling |
| **Vanilla JavaScript** | All frontend logic |
| **GeoJSON** | Geospatial data format |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (v4.0 or higher) installed locally
- A modern web browser
- Internet connection (for map tiles)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/flood-risk-checker.git
cd flood-risk-checker
