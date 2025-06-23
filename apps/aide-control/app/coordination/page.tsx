'use client'

import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { ServiceOrchestration } from '../../components/coordination/ServiceOrchestration'
import { APIGateway } from '../../components/coordination/APIGateway'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  HomeIcon,
  UsersIcon,
  KeyIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ServerIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'

export default function CoordinationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Define navigation items for the dashboard layout
  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <HomeIcon className="h-5 w-5" />
    },
    {
      label: 'Coordination',
      href: '/coordination',
      icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
      isActive: true
    },
    {
      label: 'Users',
      href: '/users',
      icon: <UsersIcon className="h-5 w-5" />
    },
    {
      label: 'API Keys',
      href: '/api-keys',
      icon: <KeyIcon className="h-5 w-5" />
    },
    {
      label: 'Billing',
      href: '/billing',
      icon: <CreditCardIcon className="h-5 w-5" />
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <ChartBarIcon className="h-5 w-5" />,
      subItems: [
        {
          label: 'Usage Metrics',
          href: '/analytics/usage',
          icon: <ChartBarIcon className="h-4 w-4" />
        },
        {
          label: 'Performance',
          href: '/analytics/performance',
          icon: <ServerIcon className="h-4 w-4" />
        }
      ]
    },
    {
      label: 'Documentation',
      href: '/docs',
      icon: <DocumentTextIcon className="h-5 w-5" />
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <CogIcon className="h-5 w-5" />
    }
  ]

  // User info for dashboard layout
  const userInfo = user ? {
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: 'Administrator'
  } : undefined

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading coordination dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <DashboardLayout 
      navigationItems={navigationItems}
      userInfo={userInfo}
    >
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Service Coordination
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Monitor and coordinate all Codai ecosystem services
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Coordination Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Orchestration */}
        <ServiceOrchestration className="mb-8" />

        {/* API Gateway */}
        <APIGateway className="mb-8" />

        {/* Service Integration Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Integration Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Authentication</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">LogAI Integration</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Memory Core</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">MemorAI Integration</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Financial Services</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">BancAI Integration</p>
                </div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
