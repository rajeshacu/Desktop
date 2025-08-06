"use client"

import dynamic from "next/dynamic"

// Use dynamic import with no SSR to avoid Leaflet issues
const TrekkerDashboard = dynamic(() => import("../dashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
})

export default function Page() {
  return <TrekkerDashboard />
}
