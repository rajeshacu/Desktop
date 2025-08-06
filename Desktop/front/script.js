// Global variables
let map;
let markers = {};
let alerts = [];
let lastData = {};
let hasData = false;

// Node colors for map markers
const nodeColors = {
    'p1': '#e74c3c',
    'p2': '#3498db', 
    'p3': '#f39c12',
    'p4': '#27ae60'
};

// Default positions for markers when no data is available
const defaultPositions = {
    'p1': [28.6139, 77.2090],
    'p2': [28.6145, 77.2095],
    'p3': [28.6140, 77.2100],
    'p4': [28.6135, 77.2085]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    startDataFetching();
    showNoDataState();
});

// Initialize Leaflet map with offline tiles
function initializeMap() {
    // Initialize map centered on a default location
    map = L.map('map').setView([28.6139, 77.2090], 12);
    
    // Try to load offline tiles from SD card
    try {
        // Path to offline tiles stored on SD card
        const offlineTileLayer = L.tileLayer('/tiles/{z}/{x}/{y}.png', {
            attribution: 'Offline Map Tiles',
            maxZoom: 18,
            minZoom: 12
        });
        
        offlineTileLayer.addTo(map);
        
        // Check if tiles load successfully
        offlineTileLayer.on('tileloadstart', function() {
            console.log('Loading offline tiles...');
        });
        
        offlineTileLayer.on('tileload', function() {
            document.querySelector('.leaflet-container').classList.add('loaded');
        });
        
        offlineTileLayer.on('tileerror', function() {
            console.warn('Offline tiles not found, using fallback');
            loadFallbackTiles();
        });
        
    } catch (error) {
        console.warn('Failed to load offline tiles:', error);
        loadFallbackTiles();
    }
    
    // Initialize markers for each node with default positions
    ['p1', 'p2', 'p3', 'p4'].forEach(nodeId => {
        const defaultPos = defaultPositions[nodeId];
        const marker = L.circleMarker(defaultPos, {
            radius: 10,
            fillColor: nodeColors[nodeId],
            color: '#fff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        // Add popup with default content
        const popupContent = `
            <div style="text-align: center;">
                <h3>🏃 Trekker ${nodeId.toUpperCase()}</h3>
                <p><strong>Status:</strong> No data available</p>
                <p><strong>Last seen:</strong> --</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers[nodeId] = marker;
    });
}

// Load fallback tiles if offline tiles are not available
function loadFallbackTiles() {
    try {
        // Try to use a simple fallback tile layer
        const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors (Fallback)',
            maxZoom: 18
        });
        
        fallbackLayer.addTo(map);
        fallbackLayer.on('tileload', function() {
            document.querySelector('.leaflet-container').classList.add('loaded');
        });
        
    } catch (error) {
        console.error('Failed to load fallback tiles:', error);
        // Create a simple background for the map
        const mapContainer = document.getElementById('map');
        mapContainer.style.background = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
        mapContainer.style.backgroundSize = '20px 20px';
        mapContainer.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
        document.querySelector('.leaflet-container').classList.add('loaded');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Map control buttons
    document.getElementById('center-map').addEventListener('click', centerMapOnMarkers);
    document.getElementById('toggle-markers').addEventListener('click', toggleMarkers);
    
    // Add click listeners to node cards
    ['p1', 'p2', 'p3', 'p4'].forEach(nodeId => {
        const card = document.getElementById(`${nodeId}-card`);
        card.addEventListener('click', () => centerMapOnNode(nodeId));
    });
}

// Fetch data from ESP32
async function fetchData() {
    try {
        const response = await fetch('/data.txt');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        if (lines.length === 0) {
            throw new Error('No data available');
        }
        
        // Parse the latest data for each node
        const nodeData = {};
        let hasValidData = false;
        
        lines.forEach(line => {
            try {
                const data = JSON.parse(line);
                const nodeId = data.node_id || data.id;
                
                if (nodeId && ['p1', 'p2', 'p3', 'p4'].includes(nodeId)) {
                    // Check if data has valid coordinates
                    if (data.latitude && data.longitude && 
                        data.latitude !== 0 && data.longitude !== 0) {
                        nodeData[nodeId] = data;
                        hasValidData = true;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse line:', line);
            }
        });
        
        if (hasValidData) {
            hasData = true;
            updateDashboard(nodeData);
            updateMap(nodeData);
            updateConnectionStatus(true);
            hideNoDataState();
        } else {
            showNoDataState();
            updateConnectionStatus(false);
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
        updateConnectionStatus(false);
        showNoDataState();
    }
}

// Show no data state
function showNoDataState() {
    if (!hasData) {
        // Update all sensor values to show no data
        ['p1', 'p2', 'p3', 'p4'].forEach(nodeId => {
            updateSensorValue(`${nodeId}-temp`, null, '°C');
            updateSensorValue(`${nodeId}-press`, null, ' hPa');
            updateSensorValue(`${nodeId}-alt`, null, ' m');
            updateSensorValue(`${nodeId}-batt`, null, '%');
            updateSensorValue(`${nodeId}-rssi`, null, ' dBm');
            document.getElementById(`${nodeId}-coords`).textContent = 'Lat: --, Lon: --';
            
            // Update alert status to unknown
            updateAlertStatus(nodeId, null);
        });
        
        // Update connection status
        document.getElementById('connection-text').textContent = 'No data available';
        document.getElementById('last-update').textContent = 'Last update: --';
    }
}

// Hide no data state
function hideNoDataState() {
    document.getElementById('connection-text').textContent = 'Connected';
}

// Update dashboard with new data
function updateDashboard(nodeData) {
    const nodes = ['p1', 'p2', 'p3', 'p4'];
    
    nodes.forEach(nodeId => {
        const data = nodeData[nodeId];
        if (!data) {
            // Show default values for nodes without data
            updateSensorValue(`${nodeId}-temp`, null, '°C');
            updateSensorValue(`${nodeId}-press`, null, ' hPa');
            updateSensorValue(`${nodeId}-alt`, null, ' m');
            updateSensorValue(`${nodeId}-batt`, null, '%');
            updateSensorValue(`${nodeId}-rssi`, null, ' dBm');
            document.getElementById(`${nodeId}-coords`).textContent = 'Lat: --, Lon: --';
            updateAlertStatus(nodeId, null);
            return;
        }
        
        // Update sensor values
        updateSensorValue(`${nodeId}-temp`, data.temperature, '°C');
        updateSensorValue(`${nodeId}-press`, data.pressure, ' hPa');
        updateSensorValue(`${nodeId}-alt`, data.altitude, ' m');
        updateSensorValue(`${nodeId}-batt`, data.battery, '%');
        updateSensorValue(`${nodeId}-rssi`, data.rssi, ' dBm');
        
        // Update coordinates
        if (data.latitude && data.longitude) {
            document.getElementById(`${nodeId}-coords`).textContent = 
                `Lat: ${data.latitude.toFixed(4)}, Lon: ${data.longitude.toFixed(4)}`;
        }
        
        // Update alert status
        updateAlertStatus(nodeId, data.alert_flag);
        
        // Store last data for comparison
        lastData[nodeId] = data;
    });
    
    // Update last update time
    document.getElementById('last-update').textContent = 
        `Last update: ${new Date().toLocaleTimeString()}`;
}

// Update sensor value with animation
function updateSensorValue(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const newValue = value !== undefined && value !== null ? value + unit : '--';
    
    if (element.textContent !== newValue) {
        element.style.transform = 'scale(1.1)';
        element.style.color = '#e74c3c';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '#2c3e50';
        }, 150);
    }
}

// Update alert status
function updateAlertStatus(nodeId, alertFlag) {
    const card = document.getElementById(`${nodeId}-card`);
    const indicator = document.getElementById(`${nodeId}-alert`);
    
    if (!card || !indicator) return;
    
    let status, className, icon;
    
    if (alertFlag === null || alertFlag === undefined) {
        status = '❓ Unknown';
        className = 'unknown';
        icon = '❓';
        card.classList.remove('alert');
    } else if (alertFlag === 1 || alertFlag === true) {
        status = '🚨 ALERT';
        className = 'danger';
        icon = '🔴';
        card.classList.add('alert');
        
        // Add to alerts list
        addAlert(nodeId, 'Emergency alert triggered');
    } else if (alertFlag === 2) {
        status = '⚠️ WARNING';
        className = 'warning';
        icon = '🟡';
        card.classList.remove('alert');
    } else {
        status = '🟢 Safe';
        className = 'safe';
        icon = '🟢';
        card.classList.remove('alert');
    }
    
    indicator.innerHTML = `<span class="alert-icon">${icon}</span><span class="alert-text">${status}</span>`;
    indicator.className = `alert-indicator ${className}`;
}

// Update map markers
function updateMap(nodeData) {
    const nodes = ['p1', 'p2', 'p3', 'p4'];
    
    nodes.forEach(nodeId => {
        const data = nodeData[nodeId];
        const marker = markers[nodeId];
        
        if (!data || !data.latitude || !data.longitude) {
            // Use default position if no valid data
            const defaultPos = defaultPositions[nodeId];
            marker.setLatLng(defaultPos);
            
            const popupContent = `
                <div style="text-align: center;">
                    <h3>🏃 Trekker ${nodeId.toUpperCase()}</h3>
                    <p><strong>Status:</strong> No data available</p>
                    <p><strong>Last seen:</strong> --</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.setStyle({ fillColor: nodeColors[nodeId] });
            return;
        }
        
        const latLng = [data.latitude, data.longitude];
        
        // Update marker position
        marker.setLatLng(latLng);
        
        // Update popup content
        const popupContent = `
            <div style="text-align: center;">
                <h3>🏃 Trekker ${nodeId.toUpperCase()}</h3>
                <p><strong>Temperature:</strong> ${data.temperature || '--'}°C</p>
                <p><strong>Pressure:</strong> ${data.pressure || '--'} hPa</p>
                <p><strong>Altitude:</strong> ${data.altitude || '--'} m</p>
                <p><strong>Battery:</strong> ${data.battery || '--'}%</p>
                <p><strong>RSSI:</strong> ${data.rssi || '--'} dBm</p>
                <p><strong>Status:</strong> ${data.alert_flag ? '🚨 ALERT' : '🟢 Safe'}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Change marker color based on alert status
        if (data.alert_flag) {
            marker.setStyle({ fillColor: '#e74c3c' });
        } else {
            marker.setStyle({ fillColor: nodeColors[nodeId] });
        }
    });
}

// Center map on all markers
function centerMapOnMarkers() {
    const bounds = L.latLngBounds();
    let hasMarkers = false;
    
    Object.values(markers).forEach(marker => {
        const latLng = marker.getLatLng();
        bounds.extend(latLng);
        hasMarkers = true;
    });
    
    if (hasMarkers) {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Center map on specific node
function centerMapOnNode(nodeId) {
    const marker = markers[nodeId];
    if (marker) {
        const latLng = marker.getLatLng();
        map.setView(latLng, 15);
        marker.openPopup();
    }
}

// Toggle markers visibility
function toggleMarkers() {
    const isVisible = Object.values(markers)[0].getLatLng().lat !== 0;
    
    Object.values(markers).forEach(marker => {
        if (isVisible) {
            marker.setLatLng([0, 0]);
        } else {
            // Restore last known position or default
            const nodeId = Object.keys(markers).find(key => markers[key] === marker);
            if (lastData[nodeId] && lastData[nodeId].latitude && lastData[nodeId].longitude) {
                marker.setLatLng([lastData[nodeId].latitude, lastData[nodeId].longitude]);
            } else {
                marker.setLatLng(defaultPositions[nodeId]);
            }
        }
    });
}

// Update connection status
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connection-status');
    const textElement = document.getElementById('connection-text');
    
    if (isConnected) {
        statusElement.textContent = '🟢';
        textElement.textContent = 'Connected';
        textElement.style.color = '#27ae60';
    } else {
        statusElement.textContent = '🔴';
        textElement.textContent = 'Disconnected';
        textElement.style.color = '#e74c3c';
    }
}

// Add alert to history
function addAlert(nodeId, message) {
    const alert = {
        id: Date.now(),
        nodeId: nodeId,
        message: message,
        timestamp: new Date()
    };
    
    alerts.unshift(alert);
    
    // Keep only last 10 alerts
    if (alerts.length > 10) {
        alerts = alerts.slice(0, 10);
    }
    
    updateAlertsList();
}

// Update alerts list display
function updateAlertsList() {
    const alertsList = document.getElementById('alerts-list');
    const alertCount = document.getElementById('alert-count');
    
    alertCount.textContent = `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`;
    
    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="no-alerts">
                <div class="no-alerts-icon">📋</div>
                <div class="no-alerts-text">No alerts yet</div>
                <div class="no-alerts-subtext">System is monitoring all trekkers</div>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <strong>${alert.nodeId.toUpperCase()}:</strong> ${alert.message}
            <div class="alert-time">${alert.timestamp.toLocaleString()}</div>
        </div>
    `).join('');
}

// Start data fetching
function startDataFetching() {
    // Initial fetch
    fetchData();
    
    // Set up periodic fetching
    setInterval(fetchData, 3000); // Update every 3 seconds
}

// Utility function to format numbers
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    return Number(num).toFixed(decimals);
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    updateConnectionStatus(false);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden - pausing updates');
    } else {
        console.log('Page visible - resuming updates');
        fetchData(); // Immediate update when page becomes visible
    }
}); 
