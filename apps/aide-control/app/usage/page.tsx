'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { UsageRecord } from '../../lib/types'
import Link from 'next/link'

export default function UsagePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }

    // Fetch usage data
    const fetchUsage = async () => {
      if (user) {
        try {
          setIsLoading(true)
          // In a real implementation, we would fetch from the API
          // For now, we'll use mock data

          // Generate mock data based on the selected time range
          const now = new Date();
          const mockData: UsageRecord[] = [];

          // Number of days to generate data for
          const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;

          // Generate mock data for each day
          for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Generate a random number of records for each day (1-5)
            const recordCount = Math.floor(Math.random() * 5) + 1;

            for (let j = 0; j < recordCount; j++) {
              // Randomly select service type and provider
              const serviceTypes: ['llm', 'embedding'][] = [['llm', 'embedding']];
              const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)][0];

              const providers = ['openai', 'anthropic', 'azure'];
              const providerId = providers[Math.floor(Math.random() * providers.length)];

              // Generate random input and output tokens
              const inputTokens = Math.floor(Math.random() * 1000) + 100;
              const outputTokens = serviceType === 'llm' ? Math.floor(Math.random() * 500) + 50 : 0;

              // Calculate mock cost
              const inputCost = inputTokens * 0.0001;
              const outputCost = outputTokens * 0.0002;
              const cost = Math.round((inputCost + outputCost) * 100); // Convert to cents

              mockData.push({
                userId: '1',
                serviceType,
                providerId,
                timestamp: date,
                requestDetails: {
                  endpoint: serviceType === 'llm' ? '/v1/chat/completions' : '/v1/embeddings',
                  inputTokens,
                  outputTokens,
                  model: providerId === 'openai'
                    ? 'gpt-4-turbo'
                    : providerId === 'anthropic'
                    ? 'claude-3-opus'
                    : 'azure-gpt-4'
                },
                cost
              });
            }
          }

          // Sort by timestamp (descending)
          mockData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          setUsageRecords(mockData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching usage data:', error)
          setIsLoading(false)
        }
      }
    }

    if (user) {
      fetchUsage()
    }
  }, [user, loading, router, timeRange])

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

  // Calculate totals
  const totalCost = usageRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  const totalInputTokens = usageRecords.reduce((sum, record) => sum + (record.requestDetails.inputTokens || 0), 0);
  const totalOutputTokens = usageRecords.reduce((sum, record) => sum + (record.requestDetails.outputTokens || 0), 0);

  // Group by service type and provider
  const usageByService: Record<string, {
    inputTokens: number,
    outputTokens: number,
    cost: number,
    requests: number
  }> = {};

  usageRecords.forEach(record => {
    const key = `${record.serviceType}:${record.providerId}`;
    if (!usageByService[key]) {
      usageByService[key] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
    }

    usageByService[key].inputTokens += record.requestDetails.inputTokens || 0;
    usageByService[key].outputTokens += record.requestDetails.outputTokens || 0;
    usageByService[key].cost += record.cost || 0;
    usageByService[key].requests += 1;
  });

  // Format currency
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="border-b pb-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Usage Statistics</h1>
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setTimeRange('day')}
            >
              Last 24 Hours
            </button>
            <button
              className={`px-4 py-2 rounded ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setTimeRange('week')}
            >
              Last 7 Days
            </button>
            <button
              className={`px-4 py-2 rounded ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setTimeRange('month')}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Cost</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalCost)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Tokens</h3>
          <p className="text-3xl font-bold">{totalInputTokens + totalOutputTokens}</p>
          <div className="text-sm text-gray-500 mt-1">
            {totalInputTokens.toLocaleString()} input / {totalOutputTokens.toLocaleString()} output
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Requests</h3>
          <p className="text-3xl font-bold">{usageRecords.length}</p>
        </div>
      </div>

      {/* Usage by Service */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Usage by Service</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border px-4 py-2 text-left">Service</th>
                <th className="border px-4 py-2 text-left">Provider</th>
                <th className="border px-4 py-2 text-left">Requests</th>
                <th className="border px-4 py-2 text-left">Input Tokens</th>
                <th className="border px-4 py-2 text-left">Output Tokens</th>
                <th className="border px-4 py-2 text-left">Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(usageByService).map(([key, data], index) => {
                const [serviceType, providerId] = key.split(':');
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border px-4 py-2">{serviceType}</td>
                    <td className="border px-4 py-2">{providerId}</td>
                    <td className="border px-4 py-2">{data.requests}</td>
                    <td className="border px-4 py-2">{data.inputTokens.toLocaleString()}</td>
                    <td className="border px-4 py-2">{data.outputTokens.toLocaleString()}</td>
                    <td className="border px-4 py-2">{formatCurrency(data.cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Usage */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Service</th>
                <th className="border px-4 py-2 text-left">Provider</th>
                <th className="border px-4 py-2 text-left">Model</th>
                <th className="border px-4 py-2 text-left">Endpoint</th>
                <th className="border px-4 py-2 text-left">Tokens</th>
                <th className="border px-4 py-2 text-left">Cost</th>
              </tr>
            </thead>
            <tbody>
              {usageRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border px-4 py-2">{record.timestamp.toLocaleString()}</td>
                  <td className="border px-4 py-2">{record.serviceType}</td>
                  <td className="border px-4 py-2">{record.providerId}</td>
                  <td className="border px-4 py-2">{record.requestDetails.model}</td>
                  <td className="border px-4 py-2">{record.requestDetails.endpoint}</td>
                  <td className="border px-4 py-2">
                    {record.requestDetails.inputTokens?.toLocaleString() || '0'} in
                    {record.requestDetails.outputTokens ? ` / ${record.requestDetails.outputTokens.toLocaleString()} out` : ''}
                  </td>
                  <td className="border px-4 py-2">{formatCurrency(record.cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
