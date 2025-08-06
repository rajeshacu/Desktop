# LoRa Trekker Safety Dashboard

A real-time monitoring dashboard for tracking multiple trekkers using LoRa-based sensors. The system displays sensor data, GPS coordinates, and alert status for up to 4 trekker nodes on an interactive map.

## Features

- **Real-time Monitoring**: Track 4 trekker nodes (P1-P4) simultaneously
- **Interactive Map**: Visualize trekker locations using OpenStreetMap
- **Sensor Data Display**: Temperature, pressure, altitude, battery, and RSSI
- **Alert System**: Visual alerts for emergency situations
- **Responsive Design**: Works on desktop and mobile devices
- **ESP32 Compatible**: Designed to work with ESP32 microcontrollers

## Data Format

The system expects data in JSON format from `/data.txt`:

```json
{
  "node_id": "p1",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "temperature": 25.5,
  "pressure": 1013.2,
  "altitude": 216,
  "battery": 85,
  "rssi": -45,
  "alert_flag": 0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Field Descriptions

- `node_id`: Node identifier (p1, p2, p3, p4)
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `temperature`: Temperature in Celsius
- `pressure`: Atmospheric pressure in hPa
- `altitude`: Altitude in meters
- `battery`: Battery percentage (0-100)
- `rssi`: Signal strength in dBm
- `alert_flag`: Alert status (0=safe, 1=alert, 2=warning)
- `timestamp`: ISO timestamp

## Setup Instructions

### 1. ESP32 Setup

Your ESP32 should send data in the following format to a web server:

```cpp
// Example ESP32 code structure
void sendData() {
  String jsonData = "{";
  jsonData += "\"node_id\":\"p1\",";
  jsonData += "\"latitude\":" + String(latitude, 6) + ",";
  jsonData += "\"longitude\":" + String(longitude, 6) + ",";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"pressure\":" + String(pressure, 1) + ",";
  jsonData += "\"altitude\":" + String(altitude) + ",";
  jsonData += "\"battery\":" + String(batteryLevel) + ",";
  jsonData += "\"rssi\":" + String(rssi) + ",";
  jsonData += "\"alert_flag\":" + String(alertFlag) + ",";
  jsonData += "\"timestamp\":\"" + getTimestamp() + "\"";
  jsonData += "}\n";
  
  // Send to server and append to data.txt
}
```

### 2. Web Server Setup

1. Place all files in your web server directory:
   - `index.html`
   - `style.css`
   - `script.js`
   - `data.txt` (will be created by ESP32)

2. Ensure your web server can serve static files

3. The ESP32 should append JSON data to `data.txt` file

### 3. Access the Dashboard

Open `index.html` in a web browser. The dashboard will:
- Load the latest data from `data.txt`
- Display sensor readings for all 4 nodes
- Show trekker locations on the map
- Update every 3 seconds automatically

## Dashboard Features

### Map Controls
- **Center Map**: Fit all markers in view
- **Toggle Markers**: Show/hide trekker markers
- **Click Node Cards**: Center map on specific trekker

### Alert System
- **Green**: Safe status
- **Yellow**: Warning status  
- **Red**: Emergency alert
- Alert history is maintained at the bottom

### Real-time Updates
- Data refreshes every 3 seconds
- Visual indicators for new data
- Connection status monitoring

## Customization

### Change Default Location
Edit the map initialization in `script.js`:
```javascript
map = L.map('map').setView([YOUR_LAT, YOUR_LON], ZOOM_LEVEL);
```

### Modify Update Interval
Change the interval in `script.js`:
```javascript
setInterval(fetchData, 5000); // Update every 5 seconds
```

### Add More Nodes
1. Add new node cards in `index.html`
2. Update node arrays in `script.js`
3. Add new node colors in `nodeColors` object

## Troubleshooting

### No Data Displayed
- Check if `data.txt` exists and has valid JSON
- Verify web server permissions
- Check browser console for errors

### Map Not Loading
- Ensure internet connection for OpenStreetMap tiles
- Check if Leaflet library is loading correctly

### ESP32 Connection Issues
- Verify ESP32 is sending data to correct endpoint
- Check JSON format matches expected structure
- Ensure proper line endings in data file

## File Structure

```
├── index.html      # Main dashboard page
├── style.css       # Styling and responsive design
├── script.js       # JavaScript functionality
├── data.txt        # Sensor data (created by ESP32)
└── README.md       # This file
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License. 