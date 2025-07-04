/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../../../nls.js';
import { URI } from '../../../../../../base/common/uri.js';
import * as dom from '../../../../../../base/browser/dom.js';
import { ResourceLabels } from '../../../../../browser/labels.js';
import { Codicon } from '../../../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../../../base/common/themables.js';
import { ResourceContextKey } from '../../../../../common/contextkeys.js';
import { Button } from '../../../../../../base/browser/ui/button/button.js';
import { DisposableStore } from '../../../../../../base/common/lifecycle.js';
import { basename, dirname } from '../../../../../../base/common/resources.js';
import { ILabelService } from '../../../../../../platform/label/common/label.js';
import { StandardMouseEvent } from '../../../../../../base/browser/mouseEvent.js';
import { IModelService } from '../../../../../../editor/common/services/model.js';
import { IHoverService } from '../../../../../../platform/hover/browser/hover.js';
import { ILanguageService } from '../../../../../../editor/common/languages/language.js';
import { FileKind, IFileService } from '../../../../../../platform/files/common/files.js';
import { IMenuService, MenuId } from '../../../../../../platform/actions/common/actions.js';
import { getCleanPromptName } from '../../../../../../platform/prompts/common/prompts.js';
import { ObservableDisposable } from '../../../../../../base/common/observableDisposable.js';
import { IContextKeyService } from '../../../../../../platform/contextkey/common/contextkey.js';
import { ChatPromptAttachmentModel } from '../../chatAttachmentModel/chatPromptAttachmentModel.js';
import { IContextMenuService } from '../../../../../../platform/contextview/browser/contextView.js';
import { getDefaultHoverDelegate } from '../../../../../../base/browser/ui/hover/hoverDelegateFactory.js';
import { getFlatContextMenuActions } from '../../../../../../platform/actions/browser/menuEntryActionViewItem.js';

/**
 * Widget for a single prompt instructions attachment.
 */
export class InstructionsAttachmentWidget extends ObservableDisposable {
	/**
	 * The root DOM node of the widget.
	 */
	public readonly domNode: HTMLElement;

	/**
	 * Get the `URI` associated with the model reference.
	 */
	public get uri(): URI {
		return this.model.reference.uri;
	}

	/**
	 * Temporary disposables used for rendering purposes.
	 */
	private readonly renderDisposables = this._register(new DisposableStore());

	constructor(
		private readonly model: ChatPromptAttachmentModel,
		private readonly resourceLabels: ResourceLabels,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
		@IContextMenuService private readonly contextMenuService: IContextMenuService,
		@IHoverService private readonly hoverService: IHoverService,
		@ILabelService private readonly labelService: ILabelService,
		@IMenuService private readonly menuService: IMenuService,
		@IFileService private readonly fileService: IFileService,
		@ILanguageService private readonly languageService: ILanguageService,
		@IModelService private readonly modelService: IModelService
	) {
		super();

		this.domNode = dom.$(
			'.chat-prompt-attachment.chat-attached-context-attachment.show-file-icons.implicit'
		);

		this._register(this.model.onUpdate(this.render.bind(this)));
		this._register(this.model.onDispose(this.dispose.bind(this)));

		this.render();
	}

	/**
	 * Render this widget.
	 */
	private render() {
		dom.clearNode(this.domNode);
		this.renderDisposables.clear();
		this.domNode.classList.remove('warning', 'error', 'disabled');

		const { topError } = this.model;

		const label = this.resourceLabels.create(this.domNode, { supportIcons: true });
		const file = this.model.reference.uri;

		const fileBasename = basename(file);
		const fileDirname = dirname(file);
		const friendlyName = `${fileBasename} ${fileDirname}`;
		const isPrompt = this.languageService.guessLanguageIdByFilepathOrFirstLine(file) === 'prompt';
		const ariaLabel = isPrompt
			? localize('chat.promptAttachment', 'Prompt file, {0}', friendlyName)
			: localize('chat.instructionsAttachment', 'Instructions attachment, {0}', friendlyName);
		const typeLabel = isPrompt
			? localize('prompt', 'Prompt')
			: localize('instructions', 'Instructions');

		const uriLabel = this.labelService.getUriLabel(file, { relative: true });

		let title = `${typeLabel} ${uriLabel}`;

		// if there are some errors/warning during the process of resolving
		// attachment references (including all the nested child references),
		// add the issue details in the hover title for the attachment, one
		// error/warning at a time because there is a limited space available
		if (topError) {
			const { errorSubject: subject } = topError;
			const isError = subject === 'root';

			this.domNode.classList.add(isError ? 'error' : 'warning');

			const severity = isError ? localize('error', 'Error') : localize('warning', 'Warning');

			title += `\n[${severity}]: ${topError.localizedMessage}`;
		}

		const fileWithoutExtension = getCleanPromptName(file);
		label.setFile(URI.file(fileWithoutExtension), {
			fileKind: FileKind.FILE,
			hidePath: true,
			range: undefined,
			title,
			icon: ThemeIcon.fromId(Codicon.bookmark.id),
			extraClasses: [],
		});
		this.domNode.ariaLabel = ariaLabel;
		this.domNode.tabIndex = 0;

		const hintElement = dom.append(
			this.domNode,
			dom.$('span.chat-implicit-hint', undefined, typeLabel)
		);
		this._register(
			this.hoverService.setupManagedHover(getDefaultHoverDelegate('element'), hintElement, title)
		);

		// create the `remove` button
		const removeButton = this.renderDisposables.add(
			new Button(this.domNode, {
				supportIcons: true,
				title: localize('remove', 'Remove'),
			})
		);

		removeButton.icon = Codicon.close;
		this.renderDisposables.add(
			removeButton.onDidClick(e => {
				e.stopPropagation();
				this.model.dispose();
			})
		);

		// context menu
		const scopedContextKeyService = this.renderDisposables.add(
			this.contextKeyService.createScoped(this.domNode)
		);

		const resourceContextKey = this.renderDisposables.add(
			new ResourceContextKey(
				scopedContextKeyService,
				this.fileService,
				this.languageService,
				this.modelService
			)
		);
		resourceContextKey.set(file);

		this.renderDisposables.add(
			dom.addDisposableListener(this.domNode, dom.EventType.CONTEXT_MENU, async domEvent => {
				const event = new StandardMouseEvent(dom.getWindow(domEvent), domEvent);
				dom.EventHelper.stop(domEvent, true);

				this.contextMenuService.showContextMenu({
					contextKeyService: scopedContextKeyService,
					getAnchor: () => event,
					getActions: () => {
						const menu = this.menuService.getMenuActions(
							MenuId.ChatInputResourceAttachmentContext,
							scopedContextKeyService,
							{ arg: file }
						);
						return getFlatContextMenuActions(menu);
					},
				});
			})
		);
	}
}
