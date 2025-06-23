/**
 * API Gateway for CODAI Central Platform
 * Handles routing and communication between Codai ecosystem services
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CommandLineIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface APIRequest {
  id: string
  timestamp: Date
  service: string
  endpoint: string
  method: string
  status: 'pending' | 'success' | 'error'
  responseTime?: number
  statusCode?: number
}

interface APIGatewayProps {
  className?: string
}

export function APIGateway({ className = '' }: APIGatewayProps) {
  const [requests, setRequests] = useState<APIRequest[]>([])
  const [isActive, setIsActive] = useState(false)

  // Service routing configuration
  const serviceRoutes = {
    'auth': 'http://localhost:3002', // LogAI
    'memory': 'http://localhost:6367', // MemorAI
    'platform': 'http://localhost:3001', // CODAI
    'finance': 'http://localhost:3003', // BancAI
    'services': 'http://localhost:3004', // FabricAI
    'wallet': 'http://localhost:3005', // Wallet
    'education': 'http://localhost:3006', // StudiAI
    'social': 'http://localhost:3007', // SociAI
    'shopping': 'http://localhost:3008', // CumparAI
    'civic': 'http://localhost:3009', // PublicAI
    'trading': 'http://localhost:3010', // X
  }

  // API Gateway request handler
  const makeAPIRequest = useCallback(async (
    service: keyof typeof serviceRoutes,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newRequest: APIRequest = {
      id: requestId,
      timestamp: new Date(),
      service: service.toUpperCase(),
      endpoint,
      method,
      status: 'pending'
    }

    setRequests(prev => [newRequest, ...prev.slice(0, 19)]) // Keep last 20 requests

    const startTime = Date.now()

    try {
      const url = `${serviceRoutes[service]}${endpoint}`
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Request-ID': requestId,
          'X-Gateway-Source': 'CODAI-Platform'
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseTime = Date.now() - startTime

      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {
              ...req,
              status: response.ok ? 'success' : 'error',
              responseTime,
              statusCode: response.status
            }
          : req
      ))

      return {
        ok: response.ok,
        status: response.status,
        data: await response.json().catch(() => null),
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {
              ...req,
              status: 'error',
              responseTime,
              statusCode: 0
            }
          : req
      ))

      throw error
    }
  }, [])

  // Test functions for different services
  const testServiceConnections = useCallback(async () => {
    setIsActive(true)
    
    const testEndpoints = [
      { service: 'auth' as const, endpoint: '/api/auth/session' },
      { service: 'memory' as const, endpoint: '/health' },
      { service: 'platform' as const, endpoint: '/api/status' },
      { service: 'finance' as const, endpoint: '/api/health' },
      { service: 'services' as const, endpoint: '/api/health' },
    ]

    for (const test of testEndpoints) {
      try {
        await makeAPIRequest(test.service, test.endpoint)
        await new Promise(resolve => setTimeout(resolve, 500)) // Stagger requests
      } catch (error) {
        console.error(`Test failed for ${test.service}:`, error)
      }
    }

    setIsActive(false)
  }, [makeAPIRequest])

  // Authentication service integration
  const authenticateUser = useCallback(async (credentials: { email: string, password: string }) => {
    return makeAPIRequest('auth', '/api/auth/signin', 'POST', credentials)
  }, [makeAPIRequest])

  // Memory service integration
  const storeMemory = useCallback(async (content: string, metadata?: any) => {
    return makeAPIRequest('memory', '/api/memory/store', 'POST', { content, metadata })
  }, [makeAPIRequest])

  // Finance service integration
  const checkWalletBalance = useCallback(async (userId: string) => {
    return makeAPIRequest('finance', `/api/wallet/${userId}/balance`)
  }, [makeAPIRequest])

  const getStatusIcon = (status: APIRequest['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: APIRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800'
      case 'POST':
        return 'bg-green-100 text-green-800'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowsRightLeftIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                API Gateway
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inter-service communication and request routing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={testServiceConnections}
              disabled={isActive}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <CommandLineIcon className="h-4 w-4 mr-1" />
              {isActive ? 'Testing...' : 'Test Connections'}
            </button>
          </div>
        </div>
      </div>

      {/* API Request Functions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Available API Functions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => authenticateUser({ email: 'test@example.com', password: 'test123' })}
            className="text-left p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
          >
            <div className="font-medium text-blue-900 dark:text-blue-100">Authentication</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Test user login</div>
          </button>
          <button
            onClick={() => storeMemory('Test memory from API Gateway', { source: 'codai-platform' })}
            className="text-left p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800"
          >
            <div className="font-medium text-green-900 dark:text-green-100">Memory Storage</div>
            <div className="text-xs text-green-700 dark:text-green-300">Store test memory</div>
          </button>
          <button
            onClick={() => checkWalletBalance('user123')}
            className="text-left p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800"
          >
            <div className="font-medium text-yellow-900 dark:text-yellow-100">Wallet Balance</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">Check user wallet</div>
          </button>
        </div>
      </div>

      {/* Request History */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Recent API Requests
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No API requests yet. Click "Test Connections" to see the gateway in action.
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {request.service}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(request.method)}`}>
                        {request.method}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {request.endpoint}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  {request.responseTime && (
                    <span>{request.responseTime}ms</span>
                  )}
                  {request.statusCode && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getStatusColor(request.status)}`}>
                      {request.statusCode}
                    </span>
                  )}
                  <span>{request.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
