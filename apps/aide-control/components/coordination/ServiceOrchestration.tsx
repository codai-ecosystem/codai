/**
 * Service Orchestration Component for CODAI Central Platform
 * Coordinates communication between all Codai ecosystem services
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  ServerIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface ServiceStatus {
  name: string
  url: string
  status: 'online' | 'offline' | 'degraded'
  responseTime: number
  lastChecked: Date
  priority: 1 | 2 | 3 | 4
  description: string
}

interface ServiceOrchestrationProps {
  className?: string
}

export function ServiceOrchestration({ className = '' }: ServiceOrchestrationProps) {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Initialize services configuration
  const initializeServices = useCallback(() => {
    const serviceConfig: Omit<ServiceStatus, 'status' | 'responseTime' | 'lastChecked'>[] = [
      {
        name: 'LOGAI',
        url: 'http://localhost:3002',
        priority: 1,
        description: 'Identity & Authentication Hub'
      },
      {
        name: 'MEMORAI',
        url: 'http://localhost:6367',
        priority: 1,
        description: 'AI Memory & Database Core'
      },
      {
        name: 'CODAI',
        url: 'http://localhost:3001',
        priority: 1,
        description: 'Central Platform & AIDE Hub'
      },
      {
        name: 'BANCAI',
        url: 'http://localhost:3003',
        priority: 2,
        description: 'Financial Platform'
      },
      {
        name: 'FABRICAI',
        url: 'http://localhost:3004',
        priority: 2,
        description: 'AI Services Platform'
      },
      {
        name: 'WALLET',
        url: 'http://localhost:3005',
        priority: 2,
        description: 'Programmable Wallet'
      },
      {
        name: 'STUDIAI',
        url: 'http://localhost:3006',
        priority: 3,
        description: 'AI Education Platform'
      },
      {
        name: 'SOCIAI',
        url: 'http://localhost:3007',
        priority: 3,
        description: 'AI Social Platform'
      },
      {
        name: 'CUMPARAI',
        url: 'http://localhost:3008',
        priority: 3,
        description: 'AI Shopping Platform'
      },
      {
        name: 'PUBLICAI',
        url: 'http://localhost:3009',
        priority: 4,
        description: 'Civic AI & Transparency Tools'
      },
      {
        name: 'X',
        url: 'http://localhost:3010',
        priority: 4,
        description: 'AI Trading Platform'
      }
    ]

    return serviceConfig.map(service => ({
      ...service,
      status: 'offline' as const,
      responseTime: 0,
      lastChecked: new Date()
    }))
  }, [])

  // Health check function
  const checkServiceHealth = useCallback(async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(service.url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return {
        ...service,
        status: response.ok ? 'online' : 'degraded',
        responseTime,
        lastChecked: new Date()
      }
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }, [])

  // Check all services
  const checkAllServices = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    
    try {
      const currentServices = services.length > 0 ? services : initializeServices()
      const healthChecks = currentServices.map(service => checkServiceHealth(service))
      const updatedServices = await Promise.all(healthChecks)
      
      setServices(updatedServices)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error checking services:', error)
    } finally {
      setIsChecking(false)
    }
  }, [services, isChecking, initializeServices, checkServiceHealth])

  // Initialize services on mount
  useEffect(() => {
    if (services.length === 0) {
      setServices(initializeServices())
    }
  }, [services.length, initializeServices])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkAllServices, 30000)
    return () => clearInterval(interval)
  }, [checkAllServices])

  // Initial health check
  useEffect(() => {
    if (services.length > 0) {
      checkAllServices()
    }
  }, [services.length, checkAllServices])

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'offline':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-50 border-red-200'
      case 2:
        return 'bg-orange-50 border-orange-200'
      case 3:
        return 'bg-blue-50 border-blue-200'
      case 4:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const servicesByPriority = services.reduce((acc, service) => {
    if (!acc[service.priority]) {
      acc[service.priority] = []
    }
    acc[service.priority].push(service)
    return acc
  }, {} as Record<number, ServiceStatus[]>)

  const priorityLabels = {
    1: 'Critical Services',
    2: 'Important Services', 
    3: 'Standard Services',
    4: 'Support Services'
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Service Orchestration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time monitoring of all Codai ecosystem services
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={checkAllServices}
              disabled={isChecking}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(priorityLabels).map(([priority, label]) => {
          const priorityServices = servicesByPriority[Number(priority)] || []
          if (priorityServices.length === 0) return null

          return (
            <div key={priority} className={`rounded-lg border p-4 ${getPriorityColor(Number(priority))}`}>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                  Number(priority) === 1 ? 'bg-red-100 text-red-800' :
                  Number(priority) === 2 ? 'bg-orange-100 text-orange-800' :
                  Number(priority) === 3 ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  P{priority}
                </span>
                {label}
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {priorityServices.map((service) => (
                  <div
                    key={service.name}
                    className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Response: {service.responseTime}ms
                      </span>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center hover:text-indigo-600"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
