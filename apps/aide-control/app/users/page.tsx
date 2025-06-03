'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { UserProfile } from '../../lib/types'
import Link from 'next/link'
import { UserService } from '../../lib/services/user-service'

export default function UsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }

    // Fetch users
    const fetchUsers = async () => {
      if (user) {
        try {
          setIsLoading(true)
          // In a real implementation, we would fetch from the API
          // For now, we'll use mock data
          setUsers([
            {
              userId: '1',
              email: 'admin@example.com',
              displayName: 'Admin User',
              role: 'admin',
              createdAt: new Date(),
              updatedAt: new Date(),
              serviceConfigs: {
                llm: [
                  { providerId: 'openai', serviceType: 'llm', mode: 'managed' }
                ],
                embedding: [],
                storage: [],
                'vector-db': [],
                authentication: [],
                analytics: []
              }
            },
            {
              userId: '2',
              email: 'user@example.com',
              displayName: 'Regular User',
              role: 'user',
              billingPlanId: 'plan_123',
              customerId: 'cus_123',
              createdAt: new Date(),
              updatedAt: new Date(),
              serviceConfigs: {
                llm: [
                  { providerId: 'anthropic', serviceType: 'llm', mode: 'self-managed', apiKey: '••••••••••' }
                ],
                embedding: [],
                storage: [],
                'vector-db': [],
                authentication: [],
                analytics: []
              }
            }
          ])
          setIsLoading(false)
        } catch (error) {
          console.error('Error fetching users:', error)
          setIsLoading(false)
        }
      }
    }

    if (user) {
      fetchUsers()
    }
  }, [user, loading, router])

  if (loading || isLoading) {
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
            <h1 className="text-4xl font-bold">User Management</h1>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add New User
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Role</th>
              <th className="border px-4 py-2 text-left">Billing Plan</th>
              <th className="border px-4 py-2 text-left">Created</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border px-4 py-2">{user.userId}</td>
                <td className="border px-4 py-2">{user.displayName || 'N/A'}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="border px-4 py-2">{user.billingPlanId || 'None'}</td>
                <td className="border px-4 py-2">{user.createdAt.toLocaleDateString()}</td>
                <td className="border px-4 py-2">
                  <div className="flex space-x-2">
                    <Link
                      href={`/users/${user.userId}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
