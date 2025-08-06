"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Radio, Battery, Clock, Wifi, Users } from "lucide-react"

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

interface NearbyDevicesPanelProps {
  devices: LoRaDevice[]
  currentLat: number
  currentLng: number
}

export function NearbyDevicesPanel({ devices, currentLat, currentLng }: NearbyDevicesPanelProps) {
  // Calculate distance between two points
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

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    } else {
      return `${(distance / 1000).toFixed(1)}km`
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500">
            Online
          </Badge>
        )
      case "offline":
        return <Badge variant="secondary">Offline</Badge>
      case "low_battery":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Low Battery
          </Badge>
        )
      case "emergency":
        return (
          <Badge variant="destructive" className="animate-pulse">
            Emergency
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const onlineDevices = devices.filter((d) => d.status === "online").length
  const emergencyDevices = devices.filter((d) => d.status === "emergency").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Nearby Trekkers ({devices.length})
        </CardTitle>
        <CardDescription>
          {onlineDevices} online • {emergencyDevices > 0 && `${emergencyDevices} emergency`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No nearby trekkers detected</p>
          </div>
        ) : (
          devices
            .sort((a, b) => {
              // Sort by status priority (emergency first, then online, etc.)
              const statusPriority = { emergency: 0, online: 1, low_battery: 2, offline: 3 }
              return statusPriority[a.status] - statusPriority[b.status]
            })
            .map((device, index) => {
              const distance = calculateDistance(currentLat, currentLng, device.latitude, device.longitude)

              return (
                <div key={device.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">{device.name}</div>
                        </div>
                      </div>
                      {getStatusBadge(device.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Distance</span>
                          <span className="font-medium">{formatDistance(distance)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Altitude</span>
                          <span className="font-medium">{device.altitude}m</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Battery className="h-3 w-3" />
                              Battery
                            </span>
                            <span className="font-medium">{device.batteryLevel}%</span>
                          </div>
                          <Progress value={device.batteryLevel} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Radio className="h-3 w-3" />
                              Signal
                            </span>
                            <span className="font-medium">{device.signalStrength}%</span>
                          </div>
                          <Progress value={device.signalStrength} className="h-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Last seen: {device.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>
                  {index < devices.length - 1 && <Separator className="mt-4" />}
                </div>
              )
            })
        )}
      </CardContent>
    </Card>
  )
}
