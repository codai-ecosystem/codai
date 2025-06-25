import * as vscode from 'vscode';

/**
 * PreviewPanel - Live preview of the generated application
 * Shows real-time updates as the project is being built
 */
export class PreviewPanel {
	private panel: vscode.WebviewPanel | undefined;
	private disposables: vscode.Disposable[] = [];
	private previewUrl: string = '';
	private isBuilding: boolean = false;

	constructor(private context: vscode.ExtensionContext) {}

	public show(): void {
		if (this.panel) {
			this.panel.reveal();
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'aide.preview',
			'AIDE Live Preview',
			vscode.ViewColumn.Three,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(this.context.asAbsolutePath('dist')),
					vscode.Uri.file(this.context.asAbsolutePath('assets')),
				],
			}
		);

		this.panel.webview.html = this.getWebviewContent();

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.type) {
					case 'refresh_preview':
						this.refreshPreview();
						break;
					case 'open_external':
						if (this.previewUrl) {
							vscode.env.openExternal(vscode.Uri.parse(this.previewUrl));
						}
						break;
					case 'toggle_responsive_mode':
						this.toggleResponsiveMode(message.mode);
						break;
				}
			},
			undefined,
			this.disposables
		);

		// Clean up when the panel is closed
		this.panel.onDidDispose(
			() => {
				this.panel = undefined;
				this.disposables.forEach(d => d.dispose());
				this.disposables = [];
			},
			null,
			this.disposables
		);
	}

	public hide(): void {
		if (this.panel) {
			this.panel.dispose();
		}
	}

	public updatePreview(url: string): void {
		this.previewUrl = url;
		this.postMessage({
			type: 'update_preview_url',
			data: { url },
		});
	}

	public setBuildingState(isBuilding: boolean): void {
		this.isBuilding = isBuilding;
		this.postMessage({
			type: 'building_state_changed',
			data: { isBuilding },
		});
	}

	public showError(error: string): void {
		this.postMessage({
			type: 'preview_error',
			data: { error },
		});
	}

	private refreshPreview(): void {
		if (this.previewUrl) {
			this.postMessage({
				type: 'refresh_iframe',
				data: { url: this.previewUrl },
			});
		}
	}

	private toggleResponsiveMode(mode: string): void {
		this.postMessage({
			type: 'set_responsive_mode',
			data: { mode },
		});
	}

	private postMessage(message: any) {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	}

	private getWebviewContent(): string {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>AIDE Live Preview</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}

				body {
					font-family: var(--vscode-font-family);
					background: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
					height: 100vh;
					display: flex;
					flex-direction: column;
				}

				.toolbar {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 8px 12px;
					background: var(--vscode-panel-background);
					border-bottom: 1px solid var(--vscode-panel-border);
					min-height: 40px;
				}

				.url-bar {
					flex: 1;
					background: var(--vscode-input-background);
					border: 1px solid var(--vscode-input-border);
					border-radius: 4px;
					padding: 4px 8px;
					color: var(--vscode-input-foreground);
					font-size: 12px;
				}

				.button {
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 4px;
					padding: 4px 8px;
					cursor: pointer;
					font-size: 12px;
					min-width: 60px;
				}

				.button:hover {
					background: var(--vscode-button-hoverBackground);
				}

				.button:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.responsive-controls {
					display: flex;
					gap: 4px;
				}

				.responsive-btn {
					background: var(--vscode-inputOption-activeBackground);
					color: var(--vscode-inputOption-activeForeground);
					border: 1px solid var(--vscode-inputOption-activeBorder);
					border-radius: 4px;
					padding: 2px 6px;
					cursor: pointer;
					font-size: 10px;
				}

				.responsive-btn.active {
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
				}

				.preview-container {
					flex: 1;
					position: relative;
					background: #fff;
				}

				.preview-iframe {
					width: 100%;
					height: 100%;
					border: none;
					transition: width 0.3s ease;
				}

				.preview-iframe.mobile {
					width: 375px;
					margin: 0 auto;
					border: 1px solid #ccc;
					border-radius: 8px;
				}

				.preview-iframe.tablet {
					width: 768px;
					margin: 0 auto;
					border: 1px solid #ccc;
					border-radius: 8px;
				}

				.loading-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: var(--vscode-editor-background);
					display: flex;
					align-items: center;
					justify-content: center;
					flex-direction: column;
					gap: 16px;
				}

				.loading-spinner {
					width: 32px;
					height: 32px;
					border: 3px solid var(--vscode-progressBar-background);
					border-top: 3px solid var(--vscode-button-background);
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}

				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}

				.error-message {
					background: var(--vscode-inputValidation-errorBackground);
					color: var(--vscode-inputValidation-errorForeground);
					border: 1px solid var(--vscode-inputValidation-errorBorder);
					border-radius: 4px;
					padding: 12px;
					margin: 16px;
					font-size: 14px;
				}

				.welcome-message {
					text-align: center;
					padding: 40px 20px;
					color: var(--vscode-descriptionForeground);
				}

				.welcome-message h3 {
					margin-bottom: 12px;
					color: var(--vscode-editor-foreground);
				}

				.welcome-message p {
					font-size: 14px;
					line-height: 1.5;
				}
			</style>
		</head>
		<body>
			<div class="toolbar">
				<input type="text" class="url-bar" id="urlBar" placeholder="Preview URL will appear here..." readonly>
				<button class="button" id="refreshBtn" onclick="refreshPreview()">⟳ Refresh</button>
				<button class="button" id="externalBtn" onclick="openExternal()">⧉ Open</button>
				<div class="responsive-controls">
					<button class="responsive-btn active" onclick="setResponsiveMode('desktop')">Desktop</button>
					<button class="responsive-btn" onclick="setResponsiveMode('tablet')">Tablet</button>
					<button class="responsive-btn" onclick="setResponsiveMode('mobile')">Mobile</button>
				</div>
			</div>

			<div class="preview-container">
				<div class="welcome-message" id="welcomeMessage">
					<h3>🚀 AIDE Live Preview</h3>
					<p>Your application preview will appear here once you start building a project.</p>
					<p>Use the conversation panel to create a new application, and watch it come to life in real-time!</p>
				</div>

				<div class="loading-overlay" id="loadingOverlay" style="display: none;">
					<div class="loading-spinner"></div>
					<div>Building your application...</div>
				</div>

				<iframe id="previewIframe" class="preview-iframe" style="display: none;"></iframe>

				<div class="error-message" id="errorMessage" style="display: none;"></div>
			</div>

			<script>
				const vscode = acquireVsCodeApi();
				let currentMode = 'desktop';
				let currentUrl = '';

				// Handle messages from the extension
				window.addEventListener('message', event => {
					const message = event.data;

					switch (message.type) {
						case 'update_preview_url':
							updatePreviewUrl(message.data.url);
							break;
						case 'building_state_changed':
							setBuildingState(message.data.isBuilding);
							break;
						case 'preview_error':
							showError(message.data.error);
							break;
						case 'refresh_iframe':
							refreshIframe(message.data.url);
							break;
						case 'set_responsive_mode':
							setResponsiveMode(message.data.mode);
							break;
					}
				});

				function updatePreviewUrl(url) {
					currentUrl = url;
					document.getElementById('urlBar').value = url;
					document.getElementById('welcomeMessage').style.display = 'none';
					document.getElementById('errorMessage').style.display = 'none';

					const iframe = document.getElementById('previewIframe');
					iframe.src = url;
					iframe.style.display = 'block';

					// Enable buttons
					document.getElementById('refreshBtn').disabled = false;
					document.getElementById('externalBtn').disabled = false;
				}

				function setBuildingState(isBuilding) {
					const loadingOverlay = document.getElementById('loadingOverlay');
					const welcomeMessage = document.getElementById('welcomeMessage');

					if (isBuilding) {
						loadingOverlay.style.display = 'flex';
						welcomeMessage.style.display = 'none';
					} else {
						loadingOverlay.style.display = 'none';
						if (!currentUrl) {
							welcomeMessage.style.display = 'block';
						}
					}
				}

				function showError(error) {
					const errorMessage = document.getElementById('errorMessage');
					errorMessage.textContent = error;
					errorMessage.style.display = 'block';

					document.getElementById('welcomeMessage').style.display = 'none';
					document.getElementById('loadingOverlay').style.display = 'none';
					document.getElementById('previewIframe').style.display = 'none';
				}

				function refreshPreview() {
					vscode.postMessage({
						type: 'refresh_preview'
					});
				}

				function refreshIframe(url) {
					const iframe = document.getElementById('previewIframe');
					iframe.src = url + '?t=' + Date.now(); // Add timestamp to force refresh
				}

				function openExternal() {
					vscode.postMessage({
						type: 'open_external'
					});
				}

				function setResponsiveMode(mode) {
					currentMode = mode;

					// Update button states
					document.querySelectorAll('.responsive-btn').forEach(btn => {
						btn.classList.remove('active');
					});
					event.target.classList.add('active');

					// Update iframe class
					const iframe = document.getElementById('previewIframe');
					iframe.className = 'preview-iframe ' + (mode === 'desktop' ? '' : mode);

					vscode.postMessage({
						type: 'toggle_responsive_mode',
						mode: mode
					});
				}

				// Initialize
				document.getElementById('refreshBtn').disabled = true;
				document.getElementById('externalBtn').disabled = true;
			</script>
		</body>
		</html>`;
	}
}
