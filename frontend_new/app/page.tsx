"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Activity, AlertTriangle, TrendingUp, Package, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SupplyChainData {
  entity: string
  location: string
  inventory_level: number
  status: "normal" | "alert"
  timestamp: string
}

export default function Dashboard() {
  const [data, setData] = useState<SupplyChainData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "normal" | "alert">("all")

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/data/dashboard")
      if (!response.ok && response.status !== 502) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
      setError(null)
      setIsUsingMockData(response.status === 502)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === "normal") {
      return (
        <span className="relative group">
          <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1 flex items-center gap-1 animate-pulse" aria-label="Operational status" tabIndex={0}>
            <span className="mr-1">✅</span>Operational
          </Badge>
          <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-white text-green-800 text-xs rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10 border border-green-200">
            All systems functional
          </span>
        </span>
      )
    } else {
      return (
        <span className="relative group">
          <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-3 py-1 flex items-center gap-1 animate-bounce" aria-label="Critical status" tabIndex={0}>
            <span className="mr-1">🚨</span>Critical
          </Badge>
          <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-white text-red-800 text-xs rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10 border border-red-200">
            Immediate attention required
          </span>
        </span>
      )
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case "supplier":
        return "🏭"
      case "warehouse":
        return "🏢"
      case "store":
        return "🏪"
      case "preview-server":
        return "🖥️"
      default:
        return "📦"
    }
  }

  const alertCount = data.filter((item) => item.status === "alert").length
  const normalCount = data.filter((item) => item.status === "normal").length
  const totalInventory = data.reduce((sum, item) => sum + item.inventory_level, 0)

  // Filtering logic
  const filteredData = statusFilter === "all" ? data : data.filter((item) => item.status === statusFilter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-10 h-10 text-blue-600" />
                Digital Twin Supply Chain Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Real-time monitoring and analytics
                {isUsingMockData && (
                  <span className="ml-2 text-orange-600 font-medium">(Demo Mode - Enhanced Mock Data)</span>
                )}
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Enhanced Demo Mode Notice */}
        {isUsingMockData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-blue-900 font-semibold text-lg">Demo Mode Active</h3>
                <p className="text-blue-700 mt-1">
                  Displaying realistic supply chain simulation data. Connect your Flask backend on port 5000 for live
                  data integration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entities</p>
                  <p className="text-3xl font-bold text-gray-900">{data.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Across supply chain</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Normal Status</p>
                  <p className="text-3xl font-bold text-green-600">{normalCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Operating smoothly</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{alertCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Require attention</p>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inventory</p>
                  <p className="text-3xl font-bold text-purple-600">{totalInventory.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Units in system</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4" aria-label="Status filter">
          <span className="text-gray-700 font-medium mr-2">Filter by status:</span>
          <Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")} aria-pressed={statusFilter === "all"} aria-label="Show all statuses">All</Button>
          <Button variant={statusFilter === "normal" ? "default" : "outline"} onClick={() => setStatusFilter("normal")} aria-pressed={statusFilter === "normal"} aria-label="Show only operational">Operational</Button>
          <Button variant={statusFilter === "alert" ? "default" : "outline"} onClick={() => setStatusFilter("alert")} aria-pressed={statusFilter === "alert"} aria-label="Show only critical">Critical</Button>
        </div>

        {/* Enhanced Main Data Table */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Activity className="w-6 h-6 text-blue-600" />
              Supply Chain Network Status
              <Badge className="ml-auto bg-blue-100 text-blue-800">Live Monitoring</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6" role="alert">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Connection Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Ensure your Flask API is reachable. If it's not on <code>localhost:5000</code>, set{" "}
                  <code>NEXT_PUBLIC_BACKEND_URL</code> environment variable.
                </p>
              </div>
            )}

            {loading && data.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-gray-600 text-lg">Loading supply chain data...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]" aria-label="Supply chain status table">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Entity Type</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Location</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Inventory Level</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg">No data available</p>
                          <p className="text-sm">Make sure your simulation is running</p>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 transition-colors ${item.status === "alert" ? "bg-red-50/60" : "hover:bg-blue-50"}`}
                          aria-label={item.status === "alert" ? "Critical row" : "Operational row"}
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">{getEntityIcon(item.entity)}</span>
                              <div>
                                <span className="font-semibold text-gray-900 capitalize text-lg">{item.entity}</span>
                                <p className="text-sm text-gray-500">
                                  {item.entity === "supplier"
                                    ? "Manufacturing"
                                    : item.entity === "warehouse"
                                      ? "Distribution"
                                      : "Retail"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-gray-900 font-medium">{item.location}</span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xl font-bold text-gray-900">
                                {item.inventory_level.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-500">units</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-5 px-6 text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Twin Supply Chain Management System</h3>
            <p className="text-gray-600 mb-2">Powered by AI-driven analytics and real-time monitoring</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>Auto-refreshes every 5 seconds</span>
              <span>•</span>
              <span>Last refresh: {lastUpdated?.toLocaleTimeString() || "Never"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
