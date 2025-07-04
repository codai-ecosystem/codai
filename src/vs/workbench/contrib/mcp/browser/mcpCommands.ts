/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { h } from '../../../../base/browser/dom.js';
import { assertNever } from '../../../../base/common/assert.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { groupBy } from '../../../../base/common/collections.js';
import { Event } from '../../../../base/common/event.js';
import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js';
import { autorun, derived } from '../../../../base/common/observable.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { URI } from '../../../../base/common/uri.js';
import { ILocalizedString, localize, localize2 } from '../../../../nls.js';
import { IActionViewItemService } from '../../../../platform/actions/browser/actionViewItemService.js';
import { MenuEntryActionViewItem } from '../../../../platform/actions/browser/menuEntryActionViewItem.js';
import { Action2, MenuId, MenuItemAction } from '../../../../platform/actions/common/actions.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { ConfigurationTarget } from '../../../../platform/configuration/common/configuration.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { ExtensionsLocalizedLabel } from '../../../../platform/extensionManagement/common/extensionManagement.js';
import {
	IInstantiationService,
	ServicesAccessor,
} from '../../../../platform/instantiation/common/instantiation.js';
import { IMcpGalleryService } from '../../../../platform/mcp/common/mcpManagement.js';
import {
	IQuickInputService,
	IQuickPickItem,
	IQuickPickSeparator,
} from '../../../../platform/quickinput/common/quickInput.js';
import { StorageScope } from '../../../../platform/storage/common/storage.js';
import { spinningLoading } from '../../../../platform/theme/common/iconRegistry.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { ActiveEditorContext, ResourceContextKey } from '../../../common/contextkeys.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { ChatContextKeys } from '../../chat/common/chatContextKeys.js';
import { ChatMode } from '../../chat/common/constants.js';
import {
	extensionsFilterSubMenu,
	IExtensionsWorkbenchService,
} from '../../extensions/common/extensions.js';
import { TEXT_FILE_EDITOR_ID } from '../../files/common/files.js';
import { McpCommandIds } from '../common/mcpCommandIds.js';
import { McpContextKeys } from '../common/mcpContextKeys.js';
import { IMcpRegistry } from '../common/mcpRegistryTypes.js';
import { McpResourceQuickAccess } from './mcpResourceQuickAccess.js';
import {
	IMcpServer,
	IMcpServerStartOpts,
	IMcpService,
	IMcpWorkbenchService,
	InstalledMcpServersViewId,
	LazyCollectionState,
	McpConnectionState,
	McpServersGalleryEnabledContext,
	McpServerCacheState,
} from '../common/mcpTypes.js';
import { McpAddConfigurationCommand } from './mcpCommandsAddConfiguration.js';
import { McpUrlHandler } from './mcpUrlHandler.js';

// acroynms do not get localized
const category: ILocalizedString = {
	original: 'MCP',
	value: 'MCP',
};

export class ListMcpServerCommand extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ListServer,
			title: localize2('mcp.list', 'List Servers'),
			icon: Codicon.server,
			category,
			f1: true,
			menu: {
				when: ContextKeyExpr.and(
					ContextKeyExpr.or(McpContextKeys.hasUnknownTools, McpContextKeys.hasServersWithErrors),
					ChatContextKeys.chatMode.isEqualTo(ChatMode.Agent)
				),
				id: MenuId.ChatExecute,
				group: 'navigation',
				order: 2,
			},
		});
	}

	override async run(accessor: ServicesAccessor) {
		const mcpService = accessor.get(IMcpService);
		const commandService = accessor.get(ICommandService);
		const quickInput = accessor.get(IQuickInputService);
		const mcpWorkbenchService = accessor.get(IMcpWorkbenchService);
		const extensionWorkbenchService = accessor.get(IExtensionsWorkbenchService);
		const viewsService = accessor.get(IViewsService);
		const mcpGalleryService = accessor.get(IMcpGalleryService);

		if (mcpGalleryService.isEnabled()) {
			if (mcpWorkbenchService.local.length) {
				return viewsService.openView(InstalledMcpServersViewId, true);
			} else {
				return extensionWorkbenchService.openSearch('@mcp');
			}
		}

		type ItemType = { id: string } & IQuickPickItem;

		const store = new DisposableStore();
		const pick = quickInput.createQuickPick<ItemType>({ useSeparators: true });
		pick.placeholder = localize('mcp.selectServer', 'Select an MCP Server');

		store.add(pick);

		store.add(
			autorun(reader => {
				const servers = groupBy(
					mcpService.servers
						.read(reader)
						.slice()
						.sort(
							(a, b) =>
								(a.collection.presentation?.order || 0) - (b.collection.presentation?.order || 0)
						),
					s => s.collection.id
				);
				const firstRun = pick.items.length === 0;
				pick.items = [
					{
						id: '$add',
						label: localize('mcp.addServer', 'Add Server'),
						description: localize('mcp.addServer.description', 'Add a new server configuration'),
						alwaysShow: true,
						iconClass: ThemeIcon.asClassName(Codicon.add),
					},
					...Object.values(servers)
						.filter(s => s.length)
						.flatMap((servers): (ItemType | IQuickPickSeparator)[] => [
							{
								type: 'separator',
								label: servers[0].collection.label,
								id: servers[0].collection.id,
							},
							...servers.map(server => ({
								id: server.definition.id,
								label: server.definition.label,
								description: McpConnectionState.toString(server.connectionState.read(reader)),
							})),
						]),
				];

				if (firstRun && pick.items.length > 3) {
					pick.activeItems = pick.items.slice(2, 3) as ItemType[]; // select the first server by default
				}
			})
		);

		const picked = await new Promise<ItemType | undefined>(resolve => {
			store.add(
				pick.onDidAccept(() => {
					resolve(pick.activeItems[0]);
				})
			);
			store.add(
				pick.onDidHide(() => {
					resolve(undefined);
				})
			);
			pick.show();
		});

		store.dispose();

		if (!picked) {
			// no-op
		} else if (picked.id === '$add') {
			commandService.executeCommand(AddConfigurationAction.ID);
		} else {
			commandService.executeCommand(McpCommandIds.ServerOptions, picked.id);
		}
	}
}

export class McpServerOptionsCommand extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ServerOptions,
			title: localize2('mcp.options', 'Server Options'),
			category,
			f1: false,
		});
	}

	override async run(accessor: ServicesAccessor, id: string): Promise<void> {
		const mcpService = accessor.get(IMcpService);
		const quickInputService = accessor.get(IQuickInputService);
		const mcpRegistry = accessor.get(IMcpRegistry);
		const editorService = accessor.get(IEditorService);
		const server = mcpService.servers.get().find(s => s.definition.id === id);
		if (!server) {
			return;
		}

		const collection = mcpRegistry.collections.get().find(c => c.id === server.collection.id);
		const serverDefinition = collection?.serverDefinitions
			.get()
			.find(s => s.id === server.definition.id);

		interface ActionItem extends IQuickPickItem {
			action: 'start' | 'stop' | 'restart' | 'showOutput' | 'config';
		}

		const items: ActionItem[] = [];
		const serverState = server.connectionState.get();

		// Only show start when server is stopped or in error state
		if (McpConnectionState.canBeStarted(serverState.state)) {
			items.push({
				label: localize('mcp.start', 'Start Server'),
				action: 'start',
			});
		} else {
			items.push({
				label: localize('mcp.stop', 'Stop Server'),
				action: 'stop',
			});
			items.push({
				label: localize('mcp.restart', 'Restart Server'),
				action: 'restart',
			});
		}

		items.push({
			label: localize('mcp.showOutput', 'Show Output'),
			action: 'showOutput',
		});

		const configTarget = serverDefinition?.presentation?.origin || collection?.presentation?.origin;
		if (configTarget) {
			items.push({
				label: localize('mcp.config', 'Show Configuration'),
				action: 'config',
			});
		}

		const pick = await quickInputService.pick(items, {
			title: server.definition.label,
			placeHolder: localize('mcp.selectAction', 'Select Server Action'),
		});

		if (!pick) {
			return;
		}

		switch (pick.action) {
			case 'start':
				await server.start({ isFromInteraction: true });
				server.showOutput();
				break;
			case 'stop':
				await server.stop();
				break;
			case 'restart':
				await server.stop();
				await server.start({ isFromInteraction: true });
				break;
			case 'showOutput':
				server.showOutput();
				break;
			case 'config':
				editorService.openEditor({
					resource: URI.isUri(configTarget) ? configTarget : configTarget!.uri,
					options: { selection: URI.isUri(configTarget) ? undefined : configTarget!.range },
				});
				break;
			default:
				assertNever(pick.action);
		}
	}
}

export class MCPServerActionRendering extends Disposable implements IWorkbenchContribution {
	constructor(
		@IActionViewItemService actionViewItemService: IActionViewItemService,
		@IMcpService mcpService: IMcpService,
		@IInstantiationService instaService: IInstantiationService,
		@ICommandService commandService: ICommandService
	) {
		super();

		const enum DisplayedState {
			None,
			NewTools,
			Error,
			Refreshing,
		}

		const displayedState = derived(reader => {
			const servers = mcpService.servers.read(reader);
			const serversPerState: IMcpServer[][] = [];
			for (const server of servers) {
				let thisState = DisplayedState.None;
				switch (server.cacheState.read(reader)) {
					case McpServerCacheState.Unknown:
					case McpServerCacheState.Outdated:
						if (server.trusted.read(reader) === false) {
							thisState = DisplayedState.None;
						} else {
							thisState =
								server.connectionState.read(reader).state === McpConnectionState.Kind.Error
									? DisplayedState.Error
									: DisplayedState.NewTools;
						}
						break;
					case McpServerCacheState.RefreshingFromUnknown:
						thisState = DisplayedState.Refreshing;
						break;
					default:
						thisState =
							server.connectionState.read(reader).state === McpConnectionState.Kind.Error
								? DisplayedState.Error
								: DisplayedState.None;
						break;
				}

				serversPerState[thisState] ??= [];
				serversPerState[thisState].push(server);
			}

			const unknownServerStates = mcpService.lazyCollectionState.read(reader);
			if (unknownServerStates === LazyCollectionState.LoadingUnknown) {
				serversPerState[DisplayedState.Refreshing] ??= [];
			} else if (unknownServerStates === LazyCollectionState.HasUnknown) {
				serversPerState[DisplayedState.NewTools] ??= [];
			}

			const maxState = (serversPerState.length - 1) as DisplayedState;
			return { state: maxState, servers: serversPerState[maxState] || [] };
		});

		this._store.add(
			actionViewItemService.register(
				MenuId.ChatInput,
				McpCommandIds.ListServer,
				(action, options) => {
					if (!(action instanceof MenuItemAction)) {
						return undefined;
					}

					return instaService.createInstance(
						class extends MenuEntryActionViewItem {
							override render(container: HTMLElement): void {
								super.render(container);
								container.classList.add('chat-mcp');

								const action = h('button.chat-mcp-action', [h('span@icon')]);

								this._register(
									autorun(r => {
										const { state } = displayedState.read(r);
										const { root, icon } = action;
										this.updateTooltip();
										container.classList.toggle(
											'chat-mcp-has-action',
											state !== DisplayedState.None
										);

										if (!root.parentElement) {
											container.appendChild(root);
										}

										root.ariaLabel = this.getLabelForState(displayedState.read(r));
										root.className = 'chat-mcp-action';
										icon.className = '';
										if (state === DisplayedState.NewTools) {
											root.classList.add('chat-mcp-action-new');
											icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.refresh));
										} else if (state === DisplayedState.Error) {
											root.classList.add('chat-mcp-action-error');
											icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.warning));
										} else if (state === DisplayedState.Refreshing) {
											root.classList.add('chat-mcp-action-refreshing');
											icon.classList.add(...ThemeIcon.asClassNameArray(spinningLoading));
										} else {
											root.remove();
										}
									})
								);
							}

							override async onClick(e: MouseEvent): Promise<void> {
								e.preventDefault();
								e.stopPropagation();

								const { state, servers } = displayedState.get();
								if (state === DisplayedState.NewTools) {
									servers.forEach(server => server.stop().then(() => server.start()));
									mcpService.activateCollections();
								} else if (state === DisplayedState.Refreshing) {
									servers.at(-1)?.showOutput();
								} else if (state === DisplayedState.Error) {
									const server = servers.at(-1);
									if (server) {
										commandService.executeCommand(
											McpCommandIds.ServerOptions,
											server.definition.id
										);
									}
								} else {
									commandService.executeCommand(McpCommandIds.ListServer);
								}
							}

							protected override getTooltip(): string {
								return this.getLabelForState() || super.getTooltip();
							}

							private getLabelForState({ state, servers } = displayedState.get()) {
								if (state === DisplayedState.NewTools) {
									return localize('mcp.newTools', 'New tools available ({0})', servers.length || 1);
								} else if (state === DisplayedState.Error) {
									return localize(
										'mcp.toolError',
										'Error loading {0} tool(s)',
										servers.length || 1
									);
								} else if (state === DisplayedState.Refreshing) {
									return localize('mcp.toolRefresh', 'Discovering tools...');
								} else {
									return null;
								}
							}
						},
						action,
						{ ...options, keybindingNotRenderedWithLabel: true }
					);
				},
				Event.fromObservable(displayedState)
			)
		);
	}
}

export class ResetMcpTrustCommand extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ResetTrust,
			title: localize2('mcp.resetTrust', 'Reset Trust'),
			category,
			f1: true,
			precondition: McpContextKeys.toolsCount.greater(0),
		});
	}

	run(accessor: ServicesAccessor): void {
		const mcpService = accessor.get(IMcpRegistry);
		mcpService.resetTrust();
	}
}

export class ResetMcpCachedTools extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ResetCachedTools,
			title: localize2('mcp.resetCachedTools', 'Reset Cached Tools'),
			category,
			f1: true,
			precondition: McpContextKeys.toolsCount.greater(0),
		});
	}

	run(accessor: ServicesAccessor): void {
		const mcpService = accessor.get(IMcpService);
		mcpService.resetCaches();
	}
}

export class AddConfigurationAction extends Action2 {
	static readonly ID = 'workbench.mcp.addConfiguration';

	constructor() {
		super({
			id: AddConfigurationAction.ID,
			title: localize2('mcp.addConfiguration', 'Add Server...'),
			metadata: {
				description: localize2(
					'mcp.addConfiguration.description',
					'Installs a new Model Context protocol to the mcp.json settings'
				),
			},
			category,
			f1: true,
			menu: {
				id: MenuId.EditorContent,
				when: ContextKeyExpr.and(
					ContextKeyExpr.regex(ResourceContextKey.Path.key, /\.vscode[/\\]mcp\.json$/),
					ActiveEditorContext.isEqualTo(TEXT_FILE_EDITOR_ID)
				),
			},
		});
	}

	async run(accessor: ServicesAccessor, configUri?: string): Promise<void> {
		return accessor
			.get(IInstantiationService)
			.createInstance(McpAddConfigurationCommand, configUri)
			.run();
	}
}

export class RemoveStoredInput extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.RemoveStoredInput,
			title: localize2('mcp.resetCachedTools', 'Reset Cached Tools'),
			category,
			f1: false,
		});
	}

	run(accessor: ServicesAccessor, scope: StorageScope, id?: string): void {
		accessor.get(IMcpRegistry).clearSavedInputs(scope, id);
	}
}

export class EditStoredInput extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.EditStoredInput,
			title: localize2('mcp.editStoredInput', 'Edit Stored Input'),
			category,
			f1: false,
		});
	}

	run(
		accessor: ServicesAccessor,
		inputId: string,
		uri: URI | undefined,
		configSection: string,
		target: ConfigurationTarget
	): void {
		const workspaceFolder = uri && accessor.get(IWorkspaceContextService).getWorkspaceFolder(uri);
		accessor
			.get(IMcpRegistry)
			.editSavedInput(inputId, workspaceFolder || undefined, configSection, target);
	}
}

export class ShowConfiguration extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ShowConfiguration,
			title: localize2('mcp.command.showConfiguration', 'Show Configuration'),
			category,
			f1: false,
		});
	}

	run(accessor: ServicesAccessor, collectionId: string, serverId: string): void {
		const collection = accessor
			.get(IMcpRegistry)
			.collections.get()
			.find(c => c.id === collectionId);
		if (!collection) {
			return;
		}

		const server = collection?.serverDefinitions.get().find(s => s.id === serverId);
		const editorService = accessor.get(IEditorService);
		if (server?.presentation?.origin) {
			editorService.openEditor({
				resource: server.presentation.origin.uri,
				options: { selection: server.presentation.origin.range },
			});
		} else if (collection.presentation?.origin) {
			editorService.openEditor({
				resource: collection.presentation.origin,
			});
		}
	}
}

export class ShowOutput extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.ShowOutput,
			title: localize2('mcp.command.showOutput', 'Show Output'),
			category,
			f1: false,
		});
	}

	run(accessor: ServicesAccessor, serverId: string): void {
		accessor
			.get(IMcpService)
			.servers.get()
			.find(s => s.definition.id === serverId)
			?.showOutput();
	}
}

export class RestartServer extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.RestartServer,
			title: localize2('mcp.command.restartServer', 'Restart Server'),
			category,
			f1: false,
		});
	}

	async run(accessor: ServicesAccessor, serverId: string, opts?: IMcpServerStartOpts) {
		const s = accessor
			.get(IMcpService)
			.servers.get()
			.find(s => s.definition.id === serverId);
		s?.showOutput();
		await s?.stop();
		await s?.start({ isFromInteraction: true, ...opts });
	}
}

export class StartServer extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.StartServer,
			title: localize2('mcp.command.startServer', 'Start Server'),
			category,
			f1: false,
		});
	}

	async run(accessor: ServicesAccessor, serverId: string, opts?: IMcpServerStartOpts) {
		const s = accessor
			.get(IMcpService)
			.servers.get()
			.find(s => s.definition.id === serverId);
		await s?.start({ isFromInteraction: true, ...opts });
	}
}

export class StopServer extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.StopServer,
			title: localize2('mcp.command.stopServer', 'Stop Server'),
			category,
			f1: false,
		});
	}

	async run(accessor: ServicesAccessor, serverId: string) {
		const s = accessor
			.get(IMcpService)
			.servers.get()
			.find(s => s.definition.id === serverId);
		await s?.stop();
	}
}

export class InstallFromActivation extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.InstallFromActivation,
			title: localize2('mcp.command.installFromActivation', 'Install...'),
			category,
			f1: false,
			menu: {
				id: MenuId.EditorContent,
				when: ContextKeyExpr.equals('resourceScheme', McpUrlHandler.scheme),
			},
		});
	}

	async run(accessor: ServicesAccessor, uri: URI) {
		const addConfigHelper = accessor
			.get(IInstantiationService)
			.createInstance(McpAddConfigurationCommand, undefined);
		addConfigHelper.pickForUrlHandler(uri);
	}
}

export class McpBrowseCommand extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.Browse,
			title: localize2('mcp.command.browse', 'MCP Servers'),
			category: ExtensionsLocalizedLabel,
			menu: [
				{
					id: MenuId.CommandPalette,
					when: McpServersGalleryEnabledContext,
				},
				{
					id: extensionsFilterSubMenu,
					when: McpServersGalleryEnabledContext,
					group: '1_predefined',
					order: 1,
				},
			],
		});
	}

	async run(accessor: ServicesAccessor) {
		accessor.get(IExtensionsWorkbenchService).openSearch('@mcp ');
	}
}

export class McpBrowseResourcesCommand extends Action2 {
	constructor() {
		super({
			id: McpCommandIds.BrowseResources,
			title: localize2('mcp.browseResources', 'Browse Resources...'),
			category,
			precondition: McpContextKeys.serverCount.greater(0),
			f1: true,
		});
	}

	run(accessor: ServicesAccessor): void {
		accessor.get(IQuickInputService).quickAccess.show(McpResourceQuickAccess.PREFIX);
	}
}
