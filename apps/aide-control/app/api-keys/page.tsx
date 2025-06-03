'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { ServiceConfig, ServiceType } from '../../lib/types'
import Link from 'next/link'

export default function ApiKeysPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Record<ServiceType, ServiceConfig[]>>({
    llm: [],
    embedding: [],
    storage: [],
    'vector-db': [],
    authentication: [],
    analytics: []
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }

    // Fetch user's service configurations
    const fetchServiceConfigs = async () => {
      if (user) {
        try {
          // In a real implementation, we would fetch from the API
          // For now, we'll use mock data
          setServices({
            llm: [
              {
                mode: 'managed',
                providerId: 'openai',
                serviceType: 'llm',
              },
              {
                mode: 'self-managed',
                providerId: 'anthropic',
                serviceType: 'llm',
                apiKey: '••••••••••••••••',
              }
            ],
            embedding: [
              {
                mode: 'managed',
                providerId: 'openai',
                serviceType: 'embedding',
              }
            ],
            storage: [],
            'vector-db': [],
            authentication: [],
            analytics: []
          })
        } catch (error) {
          console.error('Error fetching service configurations:', error)
        }
      }
    }

    if (user) {
      fetchServiceConfigs()
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="border-b pb-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">API Keys Management</h1>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add New API Key
          </button>
        </div>
      </header>

      <div className="space-y-10">
        {/* LLM Services */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">LLM Services</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border px-4 py-2 text-left">Provider</th>
                  <th className="border px-4 py-2 text-left">Mode</th>
                  <th className="border px-4 py-2 text-left">API Key</th>
                  <th className="border px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.llm.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border px-4 py-2">{service.providerId}</td>
                    <td className="border px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        service.mode === 'managed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {service.mode}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      {service.mode === 'self-managed' ? service.apiKey : 'Managed by platform'}
                    </td>
                    <td className="border px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedding Services */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Embedding Services</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border px-4 py-2 text-left">Provider</th>
                  <th className="border px-4 py-2 text-left">Mode</th>
                  <th className="border px-4 py-2 text-left">API Key</th>
                  <th className="border px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.embedding.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border px-4 py-2">{service.providerId}</td>
                    <td className="border px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        service.mode === 'managed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {service.mode}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      {service.mode === 'self-managed' ? service.apiKey : 'Managed by platform'}
                    </td>
                    <td className="border px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
