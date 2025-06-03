'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
    // System stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    averageDailyRequests: 0,
    serviceUptime: 0,
    errorRate: 0,
  })

  // Service health data
  const [serviceHealth, setServiceHealth] = useState<any>(null)
  const [refreshingHealth, setRefreshingHealth] = useState(false)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      if (user) {
        // In a real implementation, we would fetch the user profile from Firestore
        // For now, we'll assume the user is an admin
        setIsAdmin(true)
        setIsLoading(false)        // Set mock stats
        setStats({
          totalUsers: 213,
          activeUsers: 78,
          totalRequests: 124567,
          averageDailyRequests: 3421,
          serviceUptime: 99.98,
          errorRate: 0.12,
        })

        // Fetch service health
        fetchServiceHealth()
      }
    }

    if (user) {
      checkAdminStatus()
    }
  }, [user, loading, router])

  const fetchServiceHealth = async () => {
    setRefreshingHealth(true)
    try {
      const response = await fetch('/api/services/health')
      if (response.ok) {
        const health = await response.json()
        setServiceHealth(health)
      }
    } catch (error) {
      console.error('Failed to fetch service health:', error)
    } finally {
      setRefreshingHealth(false)
    }
  }

  if (loading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl text-red-600">Access denied</div>
        <p className="mt-4">You do not have permission to access this page.</p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="border-b pb-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Admin Settings</h1>
            <p className="text-gray-600 mt-2">
              Advanced configuration settings for the AIDE platform
            </p>
          </div>
        </div>      </header>

      {/* Admin Navigation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm mb-6">
        <nav className="flex space-x-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-blue-600 pb-1"
          >
            Overview
          </Link>
          <Link
            href="/services"
            className="text-gray-600 hover:text-blue-600 font-medium pb-1 hover:border-b-2 hover:border-blue-600"
          >
            Service Management
          </Link>
          <Link
            href="/admin/users"
            className="text-gray-600 hover:text-blue-600 font-medium pb-1 hover:border-b-2 hover:border-blue-600"
          >
            User Management
          </Link>
          <Link
            href="/admin/billing"
            className="text-gray-600 hover:text-blue-600 font-medium pb-1 hover:border-b-2 hover:border-blue-600"
          >
            Billing
          </Link>
        </nav>
      </div>

      <div className="space-y-10">
        {/* System Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">System Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Users</div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.activeUsers} active in last 24h
              </div>
            </div>

            <div className="border p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Requests</div>
              <div className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.averageDailyRequests.toLocaleString()} average daily
              </div>
            </div>

            <div className="border p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Service Uptime</div>
              <div className="text-3xl font-bold">{stats.serviceUptime}%</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.errorRate}% error rate
              </div>
            </div>          </div>
        </div>

        {/* Service Health */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Service Health</h2>
            <button
              onClick={fetchServiceHealth}
              disabled={refreshingHealth}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshingHealth ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {serviceHealth ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Firebase Status</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      serviceHealth.firebase.connected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {serviceHealth.firebase.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{serviceHealth.firebase.status}</p>
                </div>

                <div className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">LLM Services</h3>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {serviceHealth.services?.llm?.length || 0} providers
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Available: {serviceHealth.services?.llm?.join(', ') || 'None'}
                  </p>
                </div>

                <div className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Embedding Services</h3>
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {serviceHealth.services?.embedding?.length || 0} providers
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Available: {serviceHealth.services?.embedding?.join(', ') || 'None'}
                  </p>
                </div>

                <div className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">System Status</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      serviceHealth.healthy
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {serviceHealth.healthy ? 'Healthy' : 'Degraded'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Last checked: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {serviceHealth.warnings && serviceHealth.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-yellow-800 mb-2">Warnings</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {serviceHealth.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-sm text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Click "Refresh" to check service health
            </div>
          )}
        </div>

        {/* System Maintenance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">System Maintenance</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Run Database Backup</h3>
                <p className="text-gray-600">Create a full backup of all system data</p>
              </div>
              <button className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Start Backup
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Clear Cache</h3>
                <p className="text-gray-600">Clear system cache to resolve performance issues</p>
              </div>
              <button className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Clear Cache
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-red-600">Maintenance Mode</h3>
                <p className="text-gray-600">Put the system in maintenance mode to perform updates</p>
              </div>
              <button className="mt-2 sm:mt-0 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Enable Maintenance Mode
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Advanced Settings</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="logLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Log Level
              </label>
              <select
                id="logLevel"
                className="w-full p-2 border rounded-md"
                defaultValue="info"
                aria-label="Log level"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Controls the verbosity of system logs
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableDetailedMetrics"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="enableDetailedMetrics" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable detailed performance metrics
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableDebugMode"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="enableDebugMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable debug mode
              </label>
            </div>

            <div>
              <label htmlFor="maxConcurrentRequests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Concurrent Requests
              </label>
              <input
                type="number"
                id="maxConcurrentRequests"
                className="w-full p-2 border rounded-md"
                defaultValue={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of concurrent requests allowed
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save Advanced Settings
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
