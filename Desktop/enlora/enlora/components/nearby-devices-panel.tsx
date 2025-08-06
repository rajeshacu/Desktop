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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500 text-xs px-2 py-1">
            Online
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="secondary" className="text-xs px-2 py-1">
            Offline
          </Badge>
        )
      case "low_battery":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs px-2 py-1">
            Low Battery
          </Badge>
        )
      case "emergency":
        return (
          <Badge variant="destructive" className="animate-pulse text-xs px-2 py-1">
            Emergency
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs px-2 py-1">
            Unknown
          </Badge>
        )
    }
  }

  const onlineDevices = devices.filter((d) => d.status === "online").length
  const emergencyDevices = devices.filter((d) => d.status === "emergency").length

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Nearby Trekkers ({devices.length})
        </CardTitle>
        <CardDescription className="text-sm">
          {onlineDevices} online{emergencyDevices > 0 && ` • ${emergencyDevices} emergency`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[320px] overflow-y-auto">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No nearby trekkers detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices
                .sort((a, b) => {
                  // Sort by status priority (emergency first, then online, etc.)
                  const statusPriority = { emergency: 0, online: 1, low_battery: 2, offline: 3 }
                  return statusPriority[a.status] - statusPriority[b.status]
                })
                .map((device, index) => {
                  return (
                    <div key={device.id}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium text-sm">{device.name}</span>
                          </div>
                          {getStatusBadge(device.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Altitude</span>
                              <span className="font-medium">{device.altitude}m</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <Battery className="h-3 w-3" />
                                  {device.batteryLevel}%
                                </span>
                              </div>
                              <Progress value={device.batteryLevel} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <Radio className="h-3 w-3" />
                                  {device.signalStrength}%
                                </span>
                              </div>
                              <Progress value={device.signalStrength} className="h-1.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Last seen: {device.lastSeen.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      {index < devices.length - 1 && <Separator className="mt-4" />}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
