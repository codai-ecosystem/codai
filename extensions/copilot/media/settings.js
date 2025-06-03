(function () {
	// VS Code API
	const vscode = acquireVsCodeApi();

	// DOM elements
	const saveSettingsButton = document.getElementById('save-settings');
	const testAllButton = document.getElementById('test-all');
	const resetSettingsButton = document.getElementById('reset-settings');
	const exportSettingsButton = document.getElementById('export-settings');
	const importSettingsButton = document.getElementById('import-settings');
	const statusMessage = document.getElementById('status-message');
	const temperatureSlider = document.getElementById('temperature');
	const temperatureValue = document.getElementById('temperature-value');

	// Provider-specific elements
	const providerInputs = {
		openai: {
			enabled: document.getElementById('openai-enabled'),
			apiKey: document.getElementById('openai-api-key'),
			status: document.getElementById('openai-status'),
			config: document.getElementById('openai-config'),
			testButton: document.querySelector('[data-provider="openai"]')
		},
		anthropic: {
			enabled: document.getElementById('anthropic-enabled'),
			apiKey: document.getElementById('anthropic-api-key'),
			status: document.getElementById('anthropic-status'),
			config: document.getElementById('anthropic-config'),
			testButton: document.querySelector('[data-provider="anthropic"]')
		},
		azure: {
			enabled: document.getElementById('azure-enabled'),
			apiKey: document.getElementById('azure-api-key'),
			endpoint: document.getElementById('azure-endpoint'),
			deployment: document.getElementById('azure-deployment'),
			status: document.getElementById('azure-status'),
			config: document.getElementById('azure-config'),
			testButton: document.querySelector('[data-provider="azure"]')
		},
		local: {
			enabled: document.getElementById('local-enabled'),
			endpoint: document.getElementById('local-endpoint'),
			model: document.getElementById('local-model'),
			status: document.getElementById('local-status'),
			config: document.getElementById('local-config'),
			testButton: document.querySelector('[data-provider="local"]')
		}
	};

	// Initialize event listeners
	function initialize() {
		// Provider toggle handlers
		for (const [provider, elements] of Object.entries(providerInputs)) {
			if (elements.enabled) {
				elements.enabled.addEventListener('change', () => {
					elements.config.style.display = elements.enabled.checked ? 'block' : 'none';
				});
			}

			// Initially hide config sections
			if (elements.config) {
				elements.config.style.display = 'none';
			}

			// Test connection button
			if (elements.testButton) {
				elements.testButton.addEventListener('click', () => {
					testConnection(provider);
				});
			}
		}

		// Temperature slider
		temperatureSlider.addEventListener('input', () => {
			temperatureValue.textContent = temperatureSlider.value;
		});

		// Action buttons
		saveSettingsButton.addEventListener('click', saveSettings);
		testAllButton.addEventListener('click', testAllConnections);
		resetSettingsButton.addEventListener('click', resetSettings);
		exportSettingsButton.addEventListener('click', exportSettings);
		importSettingsButton.addEventListener('click', importSettings);

		// Load initial settings
		loadSettings();
	}

	// Save all settings
	function saveSettings() {
		const settings = {
			aiProviders: {},
			userPreferences: {
				temperature: parseFloat(temperatureSlider.value),
				maxTokens: parseInt(document.getElementById('max-tokens').value),
				defaultProvider: document.getElementById('default-provider').value,
				memoryRetention: parseInt(document.getElementById('memory-retention').value),
				debugMode: document.getElementById('debug-mode').checked,
				telemetry: document.getElementById('telemetry').checked
			},
			deploymentConfigs: [{
				platform: document.getElementById('default-platform').value,
				autoDeploy: document.getElementById('auto-deploy').checked
			}]
		};

		// Add AI providers
		for (const [provider, elements] of Object.entries(providerInputs)) {
			if (elements.enabled && elements.enabled.checked) {
				const providerConfig = {
					provider,
					enabled: true
				};

				// Add provider-specific properties
				if (elements.apiKey) {
					providerConfig.apiKey = elements.apiKey.value;
				}

				if (elements.endpoint) {
					providerConfig.endpoint = elements.endpoint.value;
				}

				if (elements.model) {
					providerConfig.model = elements.model.value;
				}

				if (elements.deployment) {
					providerConfig.deployment = elements.deployment.value;
				}

				settings.aiProviders[provider] = providerConfig;
			}
		}

		vscode.postMessage({
			type: 'saveSettings',
			settings
		});

		showStatusMessage('Saving settings...', 'info');
	}

	// Load settings from extension
	function loadSettings() {
		vscode.postMessage({
			type: 'loadSettings'
		});

		showStatusMessage('Loading settings...', 'info');
	}

	// Test connection for a specific provider
	function testConnection(provider) {
		const elements = providerInputs[provider];
		if (!elements || !elements.enabled || !elements.enabled.checked) {
			return;
		}

		const apiKey = elements.apiKey ? elements.apiKey.value : '';
		if (!apiKey && provider !== 'local') {
			showStatusMessage(`API key required for ${provider}`, 'error');
			return;
		}

		vscode.postMessage({
			type: 'testConnection',
			provider,
			apiKey
		});

		// Update UI for testing state
		elements.status.className = 'status-indicator testing';
		elements.testButton.disabled = true;
		showStatusMessage(`Testing ${provider} connection...`, 'info');
	}

	// Test all enabled connections
	function testAllConnections() {
		for (const [provider, elements] of Object.entries(providerInputs)) {
			if (elements.enabled && elements.enabled.checked) {
				testConnection(provider);
			}
		}
	}

	// Reset settings to defaults
	function resetSettings() {
		if (confirm('Are you sure you want to reset all settings to defaults?')) {
			vscode.postMessage({
				type: 'resetSettings'
			});

			showStatusMessage('Resetting settings...', 'info');
		}
	}

	// Export settings
	function exportSettings() {
		vscode.postMessage({
			type: 'exportSettings'
		});
	}

	// Import settings
	function importSettings() {
		vscode.postMessage({
			type: 'importSettings'
		});
	}

	// Update UI with settings data
	function updateUI(settings) {
		// Update AI providers
		if (settings.aiProviders) {
			for (const [provider, config] of Object.entries(settings.aiProviders)) {
				const elements = providerInputs[provider];
				if (!elements) continue;

				// Enable provider
				if (elements.enabled) {
					elements.enabled.checked = true;
					elements.config.style.display = 'block';
				}

				// Set API key
				if (elements.apiKey && config.apiKey) {
					elements.apiKey.value = config.apiKey === '***' ? '' : config.apiKey;
				}

				// Set endpoint
				if (elements.endpoint && config.endpoint) {
					elements.endpoint.value = config.endpoint;
				}

				// Set model
				if (elements.model && config.model) {
					elements.model.value = config.model;
				}

				// Set deployment
				if (elements.deployment && config.deployment) {
					elements.deployment.value = config.deployment;
				}

				// Set status
				if (elements.status) {
					elements.status.className = 'status-indicator ' +
						(config.apiKey ? 'connected' : 'disconnected');
				}
			}
		}

		// Update user preferences
		if (settings.userPreferences) {
			const prefs = settings.userPreferences;

			if (prefs.temperature) {
				temperatureSlider.value = prefs.temperature;
				temperatureValue.textContent = prefs.temperature;
			}

			if (prefs.maxTokens) {
				document.getElementById('max-tokens').value = prefs.maxTokens;
			}

			if (prefs.defaultProvider) {
				document.getElementById('default-provider').value = prefs.defaultProvider;
			}

			if (prefs.memoryRetention) {
				document.getElementById('memory-retention').value = prefs.memoryRetention;
			}

			if (prefs.debugMode !== undefined) {
				document.getElementById('debug-mode').checked = prefs.debugMode;
			}

			if (prefs.telemetry !== undefined) {
				document.getElementById('telemetry').checked = prefs.telemetry;
			}
		}

		// Update deployment settings
		if (settings.deploymentConfigs && settings.deploymentConfigs.length > 0) {
			const deployConfig = settings.deploymentConfigs[0];

			if (deployConfig.platform) {
				document.getElementById('default-platform').value = deployConfig.platform;
			}

			if (deployConfig.autoDeploy !== undefined) {
				document.getElementById('auto-deploy').checked = deployConfig.autoDeploy;
			}
		}
	}

	// Show status message
	function showStatusMessage(message, type = 'info') {
		statusMessage.textContent = message;
		statusMessage.className = type;
		statusMessage.style.display = 'block';

		setTimeout(() => {
			statusMessage.style.display = 'none';
		}, 5000);
	}

	// Handle messages from the extension
	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.type) {
			case 'settingsLoaded':
				updateUI(message.settings);
				showStatusMessage('Settings loaded', 'success');
				break;

			case 'settingsSaved':
				showStatusMessage(
					message.success ? 'Settings saved successfully' : 'Failed to save settings',
					message.success ? 'success' : 'error'
				);
				break;

			case 'connectionTesting':
				const testingElements = providerInputs[message.provider];
				if (testingElements) {
					testingElements.status.className = 'status-indicator testing';
				}
				break;

			case 'connectionTested':
				const testedElements = providerInputs[message.provider];
				if (testedElements) {
					testedElements.status.className = 'status-indicator ' +
						(message.success ? 'connected' : 'disconnected');
					testedElements.testButton.disabled = false;
				}

				showStatusMessage(
					message.provider + ' connection ' +
					(message.success ? 'successful' : 'failed: ' + message.message),
					message.success ? 'success' : 'error'
				);
				break;

			case 'settingsError':
				showStatusMessage(message.message, 'error');
				break;

			case 'settingsReset':
				if (message.success) {
					showStatusMessage('Settings reset to defaults', 'success');
					loadSettings();
				}
				break;
		}
	});

	// Initialize on DOM load
	document.addEventListener('DOMContentLoaded', initialize);

	// If the document is already loaded, initialize immediately
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		initialize();
	}
})();
