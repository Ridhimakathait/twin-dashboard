import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:5000"

/** Enhanced mock data for better demo experience */
const mockData = [
  {
    entity: "supplier",
    location: "Mumbai Manufacturing Hub",
    inventory_level: 2450,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "supplier",
    location: "Chennai Auto Parts",
    inventory_level: 180,
    status: "alert",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "warehouse",
    location: "Delhi Distribution Center",
    inventory_level: 8750,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "warehouse",
    location: "Bangalore Tech Hub",
    inventory_level: 1200,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "warehouse",
    location: "Pune Logistics Center",
    inventory_level: 450,
    status: "alert",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "store",
    location: "Kolkata Retail Outlet",
    inventory_level: 320,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "store",
    location: "Hyderabad Mega Store",
    inventory_level: 25,
    status: "alert",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "store",
    location: "Ahmedabad Branch",
    inventory_level: 890,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
  {
    entity: "store",
    location: "Jaipur Showroom",
    inventory_level: 156,
    status: "normal",
    timestamp: new Date().toISOString(),
  },
]

export async function GET(_req: NextRequest) {
  try {
    // Skip the upstream call if running locally without backend
    if (BACKEND_URL.startsWith("http://localhost") && process.env.VERCEL_URL) {
      return NextResponse.json(mockData, { status: 200 })
    }

    const upstream = await fetch(`${BACKEND_URL}/data/dashboard`, {
      cache: "no-store",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout?.(3000),
    })

    if (!upstream.ok) {
      console.error("Upstream returned:", upstream.status)
      return NextResponse.json(mockData, { status: upstream.status })
    }

    const data = await upstream.json()
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error("Proxy error:", err)
    return NextResponse.json(mockData, { status: 502 })
  }
}
