'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { ServiceConfig, ServiceType } from '../../lib/types'
import Link from 'next/link'

export default function ConfigurationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Global configuration settings
  const [globalSettings, setGlobalSettings] = useState({
    defaultMode: 'managed',
    allowUserOverride: true,
    requireAdminApproval: false,
  });

  // LLM service configurations
  const [llmConfigs, setLlmConfigs] = useState<Record<string, {
    enabled: boolean,
    managedMode: {
      enabled: boolean,
      defaultModel: string,
      availableModels: string[]
    },
    selfManagedMode: {
      enabled: boolean,
      requireApiKeyVerification: boolean
    }
  }>>({
    openai: {
      enabled: true,
      managedMode: {
        enabled: true,
        defaultModel: 'gpt-4-turbo',
        availableModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o']
      },
      selfManagedMode: {
        enabled: true,
        requireApiKeyVerification: true
      }
    },
    anthropic: {
      enabled: true,
      managedMode: {
        enabled: true,
        defaultModel: 'claude-3-opus',
        availableModels: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
      },
      selfManagedMode: {
        enabled: true,
        requireApiKeyVerification: true
      }
    },
    azure: {
      enabled: true,
      managedMode: {
        enabled: false,
        defaultModel: '',
        availableModels: []
      },
      selfManagedMode: {
        enabled: true,
        requireApiKeyVerification: false
      }
    }
  });

  // Embedding service configurations
  const [embeddingConfigs, setEmbeddingConfigs] = useState<Record<string, {
    enabled: boolean,
    managedMode: {
      enabled: boolean,
      defaultModel: string,
      availableModels: string[]
    },
    selfManagedMode: {
      enabled: boolean,
      requireApiKeyVerification: boolean
    }
  }>>({
    openai: {
      enabled: true,
      managedMode: {
        enabled: true,
        defaultModel: 'text-embedding-3-small',
        availableModels: ['text-embedding-3-small', 'text-embedding-3-large']
      },
      selfManagedMode: {
        enabled: true,
        requireApiKeyVerification: true
      }
    },
    azure: {
      enabled: true,
      managedMode: {
        enabled: false,
        defaultModel: '',
        availableModels: []
      },
      selfManagedMode: {
        enabled: true,
        requireApiKeyVerification: false
      }
    }
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }

    // Simulate loading
    if (user) {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [user, loading, router]);

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

  const handleGlobalSettingChange = (key: string, value: any) => {
    setGlobalSettings({
      ...globalSettings,
      [key]: value
    });
  };

  const handleLlmConfigChange = (provider: string, path: string, value: any) => {
    const newConfigs = { ...llmConfigs };

    // Handle nested paths like 'managedMode.enabled'
    const pathParts = path.split('.');
    let target = newConfigs[provider] as any;

    for (let i = 0; i < pathParts.length - 1; i++) {
      target = target[pathParts[i]];
    }

    target[pathParts[pathParts.length - 1]] = value;

    setLlmConfigs(newConfigs);
  };

  const handleEmbeddingConfigChange = (provider: string, path: string, value: any) => {
    const newConfigs = { ...embeddingConfigs };

    // Handle nested paths like 'managedMode.enabled'
    const pathParts = path.split('.');
    let target = newConfigs[provider] as any;

    for (let i = 0; i < pathParts.length - 1; i++) {
      target = target[pathParts[i]];
    }

    target[pathParts[pathParts.length - 1]] = value;

    setEmbeddingConfigs(newConfigs);
  };

  const handleSaveChanges = () => {
    // In a real implementation, we would save the changes to the backend
    alert('Configuration saved successfully!');
  };

  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="border-b pb-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Platform Configuration</h1>
            <p className="text-gray-600 mt-2">
              Configure the dual-mode infrastructure system for the AIDE platform
            </p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
        </div>
      </header>

      <div className="space-y-10">
        {/* Global Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Global Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Mode
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={globalSettings.defaultMode}
                onChange={(e) => handleGlobalSettingChange('defaultMode', e.target.value)}
              >
                <option value="managed">Managed (Platform-hosted services)</option>
                <option value="self-managed">Self-managed (Bring your own API keys)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                The default mode for new users and services
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowUserOverride"
                checked={globalSettings.allowUserOverride}
                onChange={(e) => handleGlobalSettingChange('allowUserOverride', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="allowUserOverride" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Allow users to override default mode
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireAdminApproval"
                checked={globalSettings.requireAdminApproval}
                onChange={(e) => handleGlobalSettingChange('requireAdminApproval', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="requireAdminApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Require admin approval for mode changes
              </label>
            </div>
          </div>
        </div>

        {/* LLM Services */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">LLM Services</h2>
          <div className="space-y-8">
            {Object.entries(llmConfigs).map(([provider, config]) => (
              <div key={provider} className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">{provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${provider}-enabled`}
                      checked={config.enabled}
                      onChange={(e) => handleLlmConfigChange(provider, 'enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-enabled`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Enabled
                    </label>
                  </div>
                </div>

                {/* Managed Mode */}
                <div className="mb-4 pl-4 border-l-4 border-gray-200">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`${provider}-managed-enabled`}
                      checked={config.managedMode.enabled}
                      onChange={(e) => handleLlmConfigChange(provider, 'managedMode.enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-managed-enabled`} className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Managed Mode
                    </label>
                  </div>

                  {config.managedMode.enabled && (
                    <div className="pl-6 mt-2 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Default Model
                        </label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={config.managedMode.defaultModel}
                          onChange={(e) => handleLlmConfigChange(provider, 'managedMode.defaultModel', e.target.value)}
                        >
                          {config.managedMode.availableModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Models
                        </label>
                        <div className="space-y-2">
                          {config.managedMode.availableModels.map(model => (
                            <div key={model} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${provider}-${model}`}
                                checked={true} // In a real implementation, this would be dynamic
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              />
                              <label htmlFor={`${provider}-${model}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                {model}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Self-Managed Mode */}
                <div className="pl-4 border-l-4 border-gray-200">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`${provider}-self-managed-enabled`}
                      checked={config.selfManagedMode.enabled}
                      onChange={(e) => handleLlmConfigChange(provider, 'selfManagedMode.enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-self-managed-enabled`} className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Self-Managed Mode
                    </label>
                  </div>

                  {config.selfManagedMode.enabled && (
                    <div className="pl-6 mt-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${provider}-verify-api-key`}
                          checked={config.selfManagedMode.requireApiKeyVerification}
                          onChange={(e) => handleLlmConfigChange(provider, 'selfManagedMode.requireApiKeyVerification', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor={`${provider}-verify-api-key`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Verify API keys on entry
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Embedding Services */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Embedding Services</h2>
          <div className="space-y-8">
            {Object.entries(embeddingConfigs).map(([provider, config]) => (
              <div key={provider} className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">{provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${provider}-emb-enabled`}
                      checked={config.enabled}
                      onChange={(e) => handleEmbeddingConfigChange(provider, 'enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-emb-enabled`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Enabled
                    </label>
                  </div>
                </div>

                {/* Managed Mode */}
                <div className="mb-4 pl-4 border-l-4 border-gray-200">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`${provider}-emb-managed-enabled`}
                      checked={config.managedMode.enabled}
                      onChange={(e) => handleEmbeddingConfigChange(provider, 'managedMode.enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-emb-managed-enabled`} className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Managed Mode
                    </label>
                  </div>

                  {config.managedMode.enabled && (
                    <div className="pl-6 mt-2 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Default Model
                        </label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={config.managedMode.defaultModel}
                          onChange={(e) => handleEmbeddingConfigChange(provider, 'managedMode.defaultModel', e.target.value)}
                        >
                          {config.managedMode.availableModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Models
                        </label>
                        <div className="space-y-2">
                          {config.managedMode.availableModels.map(model => (
                            <div key={model} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${provider}-emb-${model}`}
                                checked={true} // In a real implementation, this would be dynamic
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              />
                              <label htmlFor={`${provider}-emb-${model}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                {model}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Self-Managed Mode */}
                <div className="pl-4 border-l-4 border-gray-200">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`${provider}-emb-self-managed-enabled`}
                      checked={config.selfManagedMode.enabled}
                      onChange={(e) => handleEmbeddingConfigChange(provider, 'selfManagedMode.enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor={`${provider}-emb-self-managed-enabled`} className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Self-Managed Mode
                    </label>
                  </div>

                  {config.selfManagedMode.enabled && (
                    <div className="pl-6 mt-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${provider}-emb-verify-api-key`}
                          checked={config.selfManagedMode.requireApiKeyVerification}
                          onChange={(e) => handleEmbeddingConfigChange(provider, 'selfManagedMode.requireApiKeyVerification', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor={`${provider}-emb-verify-api-key`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Verify API keys on entry
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
