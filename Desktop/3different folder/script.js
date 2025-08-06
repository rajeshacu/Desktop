// Map setup
let map;
let isMapFullscreen = false;

function initMap() {
  map = L.map('map', {
    minZoom: 11,
    maxZoom: 16
  }).setView([12.961, 77.598], 14);

  L.tileLayer('./tiles/{z}/{x}/{y}.png', {
    maxZoom: 16,
    minZoom: 11,
    attribution: 'Offline Map',
  }).addTo(map);
}

function toggleFullscreen() {
  const mapDiv = document.getElementById('map');
  const mapContainer = document.getElementById('map-container');
  const btn = document.getElementById('fullscreen-btn');

  if (!isMapFullscreen) {
    mapDiv.classList.add('fullscreen');
    mapContainer.classList.add('fullscreen');
    btn.innerHTML = '<span>🔍</span><span>Exit Fullscreen</span>';
    isMapFullscreen = true;
  } else {
    mapDiv.classList.remove('fullscreen');
    mapContainer.classList.remove('fullscreen');
    btn.innerHTML = '<span>🔍</span><span>Fullscreen</span>';
    isMapFullscreen = false;
  }

  setTimeout(function() { 
    map.invalidateSize(); 
  }, 310);
}

document.addEventListener('DOMContentLoaded', function() {
  initMap();
  document.getElementById('fullscreen-btn').onclick = toggleFullscreen;
});

// Device icons for p1 and p2 only
const icons = {
  p1: L.icon({
    iconUrl: 'images/marker-icon-red.png',
    shadowUrl: 'images/marker-shadow.png',
    iconSize: [25, 41], 
    shadowSize: [41, 41],
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34]
  }),
  p2: L.icon({
    iconUrl: 'images/marker-icon-blue.png',
    shadowUrl: 'images/marker-shadow.png',
    iconSize: [25, 41], 
    shadowSize: [41, 41],
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34]
  }),
};

let markers = {p1: null, p2: null};
let lines = [];
let index = 0;
let animationInterval = null;
const LOG_KEY = 'lora_alert_log';

function loadPersistedLog() {
  const raw = localStorage.getItem(LOG_KEY);
  if (!raw) return [];
  try { 
    return JSON.parse(raw); 
  } catch { 
    return []; 
  }
}

function savePersistedLog(logArray) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logArray));
}

function displayAlertLog() {
  const logContainer = document.getElementById('alert-log');
  const logEmpty = document.getElementById('log-empty');
  const logArray = loadPersistedLog();

  logContainer.innerHTML = '';

  if (logArray.length === 0) {
    logEmpty.style.display = 'block';
    return;
  }

  logEmpty.style.display = 'none';

  // Display the log entries in the current (newest-first) order
  for (const entry of logArray) {
    const li = document.createElement('li');
    li.textContent = entry;
    logContainer.appendChild(li);
  }
}

const alertedDevicesThisCycle = new Set();

function updateUI(data, pid) {
  // Update basic values
  document.getElementById('id-' + pid).textContent = data.id || '--';
  document.getElementById('temperature-' + pid).innerHTML = 
    (data.temperature ?? '--') + '<span class="metric-unit">°C</span>';
  document.getElementById('pressure-' + pid).innerHTML = 
    (data.pressure ?? '--') + '<span class="metric-unit">hPa</span>';
  document.getElementById('altitude-' + pid).innerHTML = 
    (data.altitude ?? '--') + '<span class="metric-unit">m</span>';

  // Update battery
  const battery = parseInt(data.battery);
  const batteryElement = document.getElementById('battery-' + pid);
  const fill = document.getElementById('battery-fill-' + pid);

  if (isNaN(battery)) {
    batteryElement.textContent = '--%';
    fill.style.width = '0%';
    fill.className = 'battery-fill';
  } else {
    batteryElement.textContent = battery + '%';
    fill.style.width = battery + '%';

    // Update battery color classes
    fill.className = 'battery-fill';
    if (battery > 60) {
      fill.classList.add('high');
    } else if (battery > 30) {
      fill.classList.add('medium');
    } else {
      fill.classList.add('low');
    }
  }

  // Update alert status
  const alertDiv = document.getElementById('alert-' + pid);
  const alertFlag = parseInt(data.alert);

  if (alertFlag === 1) {
    alertDiv.style.display = 'flex';
    if (!alertedDevicesThisCycle.has(pid)) {
      alertedDevicesThisCycle.add(pid);
      addLogEntry(pid);
    }
  } else {
    alertDiv.style.display = 'none';
    alertedDevicesThisCycle.delete(pid);
  }

  // Update alert summary
  updateAlertSummary();
}

function updateAlertSummary() {
  const alertSummary = document.getElementById('alert-summary');
  if (alertedDevicesThisCycle.size > 0) {
    alertSummary.style.display = 'block';
  } else {
    alertSummary.style.display = 'none';
  }
}

// Add new log entries at the top (latest first)
function addLogEntry(pid) {
  const logArray = loadPersistedLog();
  const now = new Date();
  const ts = now.toLocaleString();
  const logEntry = `${ts}: ALERT detected on device ${pid.toUpperCase()}`;
  if (!logArray.includes(logEntry)) {
    logArray.unshift(logEntry); // Add to the front (top)
    savePersistedLog(logArray);
    displayAlertLog();
  }
}

function startAnimatedPlayback() {
  if (animationInterval) clearInterval(animationInterval);

  animationInterval = setInterval(() => {
    if (lines.length === 0) return;
    if (index >= lines.length) index = 0;

    try {
      const data = JSON.parse(lines[index]);
      if (data.id && ['p1','p2'].includes(data.id)) {
        updateUI(data, data.id);

        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);

        if (!isNaN(lat) && !isNaN(lon)) {
          const popupContent = `
            <div style="font-family: Inter, sans-serif; min-width: 200px;">
              <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.1rem;">Device ${data.id.toUpperCase()}</h4>
              <div style="display: grid; gap: 8px; font-size: 0.9rem;">
                <div><strong>Temperature:</strong> ${data.temperature} °C</div>
                <div><strong>Pressure:</strong> ${data.pressure} hPa</div>
                <div><strong>Altitude:</strong> ${data.altitude} m</div>
                <div><strong>Battery:</strong> ${data.battery}%</div>
                <div><strong>Alert:</strong> ${data.alert === 1 ? '<span style="color: #ef4444; font-weight: bold;">ACTIVE</span>' : '<span style="color: #10b981;">Normal</span>'}</div>
              </div>
            </div>
          `;

          if (!markers[data.id]) {
            markers[data.id] = L.marker([lat, lon], {icon: icons[data.id]})
              .addTo(map)
              .bindPopup(popupContent);
          } else {
            markers[data.id]
              .setLatLng([lat, lon])
              .setPopupContent(popupContent);
          }
        }
      }
    } catch(e) {
      console.warn('Invalid JSON line at index', index);
    }

    index++;
  }, 2000);
}

async function loadData() {
  try {
    const res = await fetch('data.txt?_=' + Date.now());
    const text = await res.text();
    lines = text.trim().split('\n').filter(l => l.length > 0);
    index = 0;
    alertedDevicesThisCycle.clear();
    displayAlertLog();
    startAnimatedPlayback();
  } catch (e) {
    console.error('Failed to load data', e);
  }
}

// Initialize
displayAlertLog();
document.addEventListener('DOMContentLoaded', loadData);
