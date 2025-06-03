'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithCustomToken } from '../../../lib/firebase-client'

export default function AuthSuccess() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    async function handleAuthSuccess() {
      try {
        // Get the custom token from the server
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to get authentication token')
        }

        const { token } = await response.json()

        if (!token) {
          throw new Error('No authentication token received')
        }        // Sign in with the custom token from Firebase
        await signInWithCustomToken(token)

        setStatus('success')

        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (err: any) {
        console.error('Auth success error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')

        // Redirect to login page after error
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleAuthSuccess()
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Completing authentication...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we sign you in.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting you to the dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error || 'An error occurred during authentication.'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
