"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Thermometer,
  Gauge,
  Mountain,
  Battery,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Satellite,
  Radio,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TrekkerMap } from "./components/trekker-map"
import { NearbyDevicesPanel } from "./components/nearby-devices-panel"

// Mock data - replace with real sensor data
const mockSensorData = {
  gps: {
    latitude: 27.9881,
    longitude: 86.925,
    altitude: 5364,
    accuracy: 3.2,
    satellites: 8,
  },
  bmp280: {
    temperature: -12.5,
    pressure: 540.2,
    altitude: 5364,
  },
  system: {
    battery: 78,
    signal: 85,
    lastUpdate: new Date(),
    status: "active",
  },
  alerts: [
    {
      id: 1,
      type: "warning",
      message: "Low temperature detected (-12.5°C)",
      timestamp: new Date(Date.now() - 300000),
    },
  ],
}

// Updated nearby devices to only include trekkers
const mockNearbyDevices = [
  {
    id: "device_001",
    name: "Trekker1",
    latitude: 27.9891,
    longitude: 86.926,
    altitude: 5340,
    batteryLevel: 95,
    signalStrength: 92,
    lastSeen: new Date(Date.now() - 30000), // 30 seconds ago
    deviceType: "trekker" as const,
    status: "online" as const,
  },
  {
    id: "device_002",
    name: "Trekker2",
    latitude: 27.9871,
    longitude: 86.924,
    altitude: 5380,
    batteryLevel: 67,
    signalStrength: 78,
    lastSeen: new Date(Date.now() - 120000), // 2 minutes ago
    deviceType: "trekker" as const,
    status: "online" as const,
  },
  {
    id: "device_003",
    name: "Trekker3",
    latitude: 27.9901,
    longitude: 86.927,
    altitude: 5320,
    batteryLevel: 23,
    signalStrength: 45,
    lastSeen: new Date(Date.now() - 60000), // 1 minute ago
    deviceType: "trekker" as const,
    status: "low_battery" as const,
  },
  {
    id: "device_004",
    name: "Trekker4",
    latitude: 27.9851,
    longitude: 86.923,
    altitude: 5420,
    batteryLevel: 12,
    signalStrength: 25,
    lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
    deviceType: "trekker" as const,
    status: "emergency" as const,
  },
]

export default function TrekkerDashboard() {
  const [sensorData, setSensorData] = useState(mockSensorData)
  const [isOnline, setIsOnline] = useState(true)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => ({
        ...prev,
        bmp280: {
          ...prev.bmp280,
          temperature: prev.bmp280.temperature + (Math.random() - 0.5) * 2,
          pressure: prev.bmp280.pressure + (Math.random() - 0.5) * 5,
        },
        system: {
          ...prev.system,
          battery: Math.max(0, prev.system.battery - 0.1),
          lastUpdate: new Date(),
        },
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "danger":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return "bg-green-500"
    if (level > 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trekker Safety Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring and location tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(sensorData.system.status)}`} />
              <span className="text-sm font-medium capitalize">{sensorData.system.status}</span>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
          </div>
        </div>

        {/* Alerts */}
        {sensorData.alerts.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Active Alerts</AlertTitle>
            <AlertDescription className="text-yellow-700">{sensorData.alerts[0].message}</AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Tracking
                </CardTitle>
                <CardDescription>
                  Current position: {sensorData.gps.latitude.toFixed(6)}, {sensorData.gps.longitude.toFixed(6)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrekkerMap
                  latitude={sensorData.gps.latitude}
                  longitude={sensorData.gps.longitude}
                  altitude={sensorData.gps.altitude}
                  accuracy={sensorData.gps.accuracy}
                  nearbyDevices={mockNearbyDevices}
                  showConnections={true}
                  maxDistance={15000} // 15km range
                  className="aspect-video"
                />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{sensorData.gps.satellites} satellites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">±{sensorData.gps.accuracy}m accuracy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="space-y-6">
            {/* Battery & Connectivity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Battery Level</span>
                    <span className="text-sm text-gray-600">{Math.round(sensorData.system.battery)}%</span>
                  </div>
                  <Progress value={sensorData.system.battery} className="h-2" />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LoRa Signal</span>
                    <span className="text-sm text-gray-600">{sensorData.system.signal}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-green-500" />
                    <Progress value={sensorData.system.signal} className="flex-1 h-2" />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Update</span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    {sensorData.system.lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Devices Panel */}
            <NearbyDevicesPanel
              devices={mockNearbyDevices}
              currentLat={sensorData.gps.latitude}
              currentLng={sensorData.gps.longitude}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Send SOS Alert
                </Button>
                <Button variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Share Location
                </Button>
                <Button variant="outline" className="w-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sensor Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* GPS Data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                GPS Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Latitude</div>
                  <div className="font-mono text-sm">{sensorData.gps.latitude.toFixed(6)}°</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Longitude</div>
                  <div className="font-mono text-sm">{sensorData.gps.longitude.toFixed(6)}°</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">GPS Altitude</div>
                  <div className="font-mono text-sm">{sensorData.gps.altitude}m</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="h-4 w-4" />
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.bmp280.temperature.toFixed(1)}°C</div>
              <div className="text-xs text-gray-500 mt-1">
                {sensorData.bmp280.temperature < -10
                  ? "Extreme Cold"
                  : sensorData.bmp280.temperature < 0
                    ? "Very Cold"
                    : "Cold"}
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, (sensorData.bmp280.temperature + 40) * 1.25))}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pressure */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4" />
                Pressure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.bmp280.pressure.toFixed(1)}</div>
              <div className="text-xs text-gray-500">hPa</div>
              <div className="text-xs text-gray-600 mt-1">
                {sensorData.bmp280.pressure < 600 ? "High Altitude" : "Normal"}
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(sensorData.bmp280.pressure / 1013) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Altitude */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mountain className="h-4 w-4" />
                Altitude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.bmp280.altitude}m</div>
              <div className="text-xs text-gray-500 mt-1">
                {sensorData.bmp280.altitude > 5000
                  ? "Extreme Altitude"
                  : sensorData.bmp280.altitude > 3000
                    ? "High Altitude"
                    : "Moderate"}
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (sensorData.bmp280.altitude / 8848) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Trekker Safety System • LoRa Network • Last sync: {sensorData.system.lastUpdate.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
