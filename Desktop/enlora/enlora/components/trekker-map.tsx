"use client"

import { useEffect, useRef, useState } from "react"

interface LoRaDevice {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number
  batteryLevel: number
  signalStrength: number
  lastSeen: Date
  deviceType: "trekker" | "base_station" | "emergency_beacon" | "relay"
  status: "online" | "offline" | "low_battery" | "emergency"
}

interface TrekkerMapProps {
  latitude: number
  longitude: number
  altitude: number
  accuracy?: number
  className?: string
  nearbyDevices?: LoRaDevice[]
  showConnections?: boolean
  maxDistance?: number // Maximum distance to show connections (in meters)
}

export function TrekkerMap({
  latitude,
  longitude,
  altitude,
  accuracy = 10,
  className,
  nearbyDevices = [],
  showConnections = true,
  maxDistance = 10000, // 10km default
}: TrekkerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const trailRef = useRef<any>(null)
  const trailPointsRef = useRef<[number, number][]>([])
  const deviceMarkersRef = useRef<any[]>([])
  const connectionLinesRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Get device icon based on type and status
  const getDeviceIcon = (device: LoRaDevice) => {
    const getStatusColor = () => {
      switch (device.status) {
        case "online":
          return "#10b981" // green
        case "offline":
          return "#6b7280" // gray
        case "low_battery":
          return "#f59e0b" // yellow
        case "emergency":
          return "#ef4444" // red
        default:
          return "#6b7280"
      }
    }

    // Always use trekker icon (person)
    return `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 32px; 
          height: 32px; 
          background-color: ${getStatusColor()}; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">👤</div>
        ${
          device.status === "emergency"
            ? `
          <div style="
            position: absolute;
            width: 48px;
            height: 48px;
            border: 2px solid #ef4444;
            border-radius: 50%;
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        `
            : ""
        }
      </div>
    `
  }

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    } else {
      return `${(distance / 1000).toFixed(1)}km`
    }
  }

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => {
          setIsLoaded(true)
        }
        document.head.appendChild(script)
      } else {
        setIsLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = (window as any).L

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add satellite layer option
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      },
    )

    // Layer control
    const baseLayers = {
      "Street Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }),
      Satellite: satelliteLayer,
      Terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenTopoMap contributors",
      }),
    }

    L.control.layers(baseLayers).addTo(map)

    // Custom trekker icon using HTML
    const trekkerIcon = L.divIcon({
      className: "custom-trekker-marker",
      html: `
        <div style="position: relative;">
          <div style="width: 24px; height: 24px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background-color: white; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add initial marker
    const marker = L.marker([latitude, longitude], { icon: trekkerIcon }).addTo(map)

    // Add popup with details
    marker.bindPopup(`
      <div style="padding: 8px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0;">Current Position</h3>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Lat: ${latitude.toFixed(6)}</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Lng: ${longitude.toFixed(6)}</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Alt: ${altitude}m</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Accuracy: ±${accuracy}m</p>
      </div>
    `)

    // Add accuracy circle
    const accuracyCircle = L.circle([latitude, longitude], {
      radius: accuracy,
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
      color: "#3b82f6",
      weight: 1,
    }).addTo(map)

    // Initialize trail
    const trail = L.polyline([], {
      color: "#ef4444",
      weight: 3,
      opacity: 0.7,
      dashArray: "5, 5",
    }).addTo(map)

    // Add scale control
    L.control.scale().addTo(map)

    // Store references
    mapInstanceRef.current = map
    markerRef.current = marker
    accuracyCircleRef.current = accuracyCircle
    trailRef.current = trail
  }, [isLoaded, latitude, longitude, altitude, accuracy])

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    const L = (window as any).L
    const map = mapInstanceRef.current

    // Clear existing device markers and connections
    deviceMarkersRef.current.forEach((marker) => map.removeLayer(marker))
    connectionLinesRef.current.forEach((line) => map.removeLayer(line))
    deviceMarkersRef.current = []
    connectionLinesRef.current = []

    // Add device markers
    nearbyDevices.forEach((device) => {
      const distance = calculateDistance(latitude, longitude, device.latitude, device.longitude)

      // Only show devices within max distance
      if (distance <= maxDistance) {
        const deviceIcon = L.divIcon({
          className: "custom-device-marker",
          html: getDeviceIcon(device),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([device.latitude, device.longitude], { icon: deviceIcon }).addTo(map)

        // Device popup with detailed info
        marker.bindPopup(`
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">
              ${device.name}
            </h3>
            <div style="display: grid; gap: 4px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Status:</span>
                <span style="font-weight: 500; text-transform: capitalize; color: ${
                  device.status === "online"
                    ? "#10b981"
                    : device.status === "emergency"
                      ? "#ef4444"
                      : device.status === "low_battery"
                        ? "#f59e0b"
                        : "#6b7280"
                };">${device.status.replace("_", " ")}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Distance:</span>
                <span style="font-weight: 500;">${formatDistance(distance)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Battery:</span>
                <span style="font-weight: 500;">${device.batteryLevel}%</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Signal:</span>
                <span style="font-weight: 500;">${device.signalStrength}%</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Altitude:</span>
                <span style="font-weight: 500;">${device.altitude}m</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Last Seen:</span>
                <span style="font-weight: 500;">${device.lastSeen.toLocaleTimeString()}</span>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 11px; color: #6b7280;">
                  ${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        `)

        deviceMarkersRef.current.push(marker)

        // Add connection line if showConnections is enabled
        if (showConnections && device.status === "online") {
          const connectionLine = L.polyline(
            [
              [latitude, longitude],
              [device.latitude, device.longitude],
            ],
            {
              color: device.status === "emergency" ? "#ef4444" : "#10b981",
              weight: 2,
              opacity: 0.6,
              dashArray: "5, 10",
            },
          ).addTo(map)

          // Add distance label on the line
          const midLat = (latitude + device.latitude) / 2
          const midLng = (longitude + device.longitude) / 2

          const distanceLabel = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: "distance-label",
              html: `
                <div style="
                  background: rgba(255, 255, 255, 0.9);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: 500;
                  color: #374151;
                  border: 1px solid #d1d5db;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ">${formatDistance(distance)}</div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
          }).addTo(map)

          connectionLinesRef.current.push(connectionLine)
          connectionLinesRef.current.push(distanceLabel)
        }
      }
    })
  }, [isLoaded, latitude, longitude, nearbyDevices, showConnections, maxDistance])

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !markerRef.current || !accuracyCircleRef.current || !trailRef.current)
      return

    const newLatLng = [latitude, longitude]

    // Update marker position
    markerRef.current.setLatLng(newLatLng)

    // Update popup content
    markerRef.current.setPopupContent(`
      <div style="padding: 8px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0;">Current Position</h3>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Lat: ${latitude.toFixed(6)}</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Lng: ${longitude.toFixed(6)}</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Alt: ${altitude}m</p>
        <p style="font-size: 12px; color: #666; margin: 2px 0;">Accuracy: ±${accuracy}m</p>
        <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">Updated: ${new Date().toLocaleTimeString()}</p>
      </div>
    `)

    // Update accuracy circle
    accuracyCircleRef.current.setLatLng(newLatLng)
    accuracyCircleRef.current.setRadius(accuracy)

    // Add to trail (limit to last 50 points)
    trailPointsRef.current.push([latitude, longitude])
    if (trailPointsRef.current.length > 50) {
      trailPointsRef.current.shift()
    }
    trailRef.current.setLatLngs(trailPointsRef.current)

    // Center map on new position (optional - you might want to disable this for manual panning)
    mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom())
  }, [isLoaded, latitude, longitude, altitude, accuracy])

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
        {!isLoaded && <div className="text-gray-500 text-sm">Loading map...</div>}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
