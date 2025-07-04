/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeWindow } from '../../../../base/browser/window.js';
import { Schemas } from '../../../../base/common/network.js';
import { URI } from '../../../../base/common/uri.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import {
	EditorInputCapabilities,
	GroupIdentifier,
	IUntypedEditorInput,
	Verbosity,
} from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IOverlayWebview } from '../../webview/browser/webview.js';
import { WebviewIconManager, WebviewIcons } from './webviewIconManager.js';

export interface WebviewInputInitInfo {
	readonly viewType: string;
	readonly providedId: string | undefined;
	readonly name: string;
}

export class WebviewInput extends EditorInput {
	public static typeId = 'workbench.editors.webviewInput';

	public override get typeId(): string {
		return WebviewInput.typeId;
	}

	public override get editorId(): string {
		return this.viewType;
	}

	public override get capabilities(): EditorInputCapabilities {
		return (
			EditorInputCapabilities.Readonly |
			EditorInputCapabilities.Singleton |
			EditorInputCapabilities.CanDropIntoEditor
		);
	}

	private readonly _resourceId = generateUuid();

	private _name: string;
	private _iconPath?: WebviewIcons;
	private _group?: GroupIdentifier;

	private _webview: IOverlayWebview;

	private _hasTransfered = false;

	get resource() {
		return URI.from({
			scheme: Schemas.webviewPanel,
			path: `webview-panel/webview-${this._resourceId}`,
		});
	}

	public readonly viewType: string;
	public readonly providedId: string | undefined;

	constructor(
		init: WebviewInputInitInfo,
		webview: IOverlayWebview,
		private readonly _iconManager: WebviewIconManager
	) {
		super();

		this.viewType = init.viewType;
		this.providedId = init.providedId;

		this._name = init.name;
		this._webview = webview;
	}

	override dispose() {
		if (!this.isDisposed()) {
			if (!this._hasTransfered) {
				this._webview?.dispose();
			}
		}
		super.dispose();
	}

	public override getName(): string {
		return this._name;
	}

	public override getTitle(_verbosity?: Verbosity): string {
		return this.getName();
	}

	public override getDescription(): string | undefined {
		return undefined;
	}

	public setName(value: string): void {
		this._name = value;
		this.webview.setTitle(value);
		this._onDidChangeLabel.fire();
	}

	public get webview(): IOverlayWebview {
		return this._webview;
	}

	public get extension() {
		return this.webview.extension;
	}

	public get iconPath() {
		return this._iconPath;
	}

	public set iconPath(value: WebviewIcons | undefined) {
		this._iconPath = value;
		this._iconManager.setIcons(this._resourceId, value);
	}

	public override matches(other: EditorInput | IUntypedEditorInput): boolean {
		return super.matches(other) || other === this;
	}

	public get group(): GroupIdentifier | undefined {
		return this._group;
	}

	public updateGroup(group: GroupIdentifier): void {
		this._group = group;
	}

	protected transfer(other: WebviewInput): WebviewInput | undefined {
		if (this._hasTransfered) {
			return undefined;
		}
		this._hasTransfered = true;
		other._webview = this._webview;
		return other;
	}

	public claim(
		claimant: unknown,
		targetWindow: CodeWindow,
		scopedContextKeyService: IContextKeyService | undefined
	): void {
		return this._webview.claim(claimant, targetWindow, scopedContextKeyService);
	}
}
