/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TTree } from '../utils/treeUtils.js';
import { ChatMode } from '../../constants.js';
import { IPromptMetadata } from '../parsers/types.js';
import { URI } from '../../../../../../base/common/uri.js';
import { ITextModel } from '../../../../../../editor/common/model.js';
import { IDisposable } from '../../../../../../base/common/lifecycle.js';
import { TextModelPromptParser } from '../parsers/textModelPromptParser.js';
import { createDecorator } from '../../../../../../platform/instantiation/common/instantiation.js';
import { PromptsType } from '../../../../../../platform/prompts/common/prompts.js';
import { Event } from '../../../../../../base/common/event.js';
import { CancellationToken } from '../../../../../../base/common/cancellation.js';

/**
 * Provides prompt services.
 */
export const IPromptsService = createDecorator<IPromptsService>('IPromptsService');

/**
 * Where the prompt is stored.
 */
export type TPromptsStorage = 'local' | 'user';

/**
 * Represents a prompt path with its type.
 * This is used for both prompt files and prompt source folders.
 */
export interface IPromptPath {
	/**
	 * URI of the prompt.
	 */
	readonly uri: URI;

	/**
	 * Storage of the prompt.
	 */
	readonly storage: TPromptsStorage;

	/**
	 * Type of the prompt (e.g. 'prompt' or 'instructions').
	 */
	readonly type: PromptsType;
}

/**
 * Type for a shared prompt parser instance returned by the {@link IPromptsService}.
 * Because the parser is shared, we omit the `dispose` method from
 * the original type so the caller cannot dispose it prematurely
 */
export type TSharedPrompt = Omit<TextModelPromptParser, 'dispose'>;

/**
 * Metadata node object in a hierarchical tree of prompt references.
 */
export interface IMetadata {
	/**
	 * URI of a prompt file.
	 */
	readonly uri: URI;

	/**
	 * Metadata of the prompt file.
	 */
	readonly metadata: IPromptMetadata;

	/**
	 * List of metadata for each valid child prompt reference.
	 */
	readonly children?: readonly TTree<IMetadata>[];
}

export interface ICustomChatMode {
	/**
	 * URI of a custom chat mode file.
	 */
	readonly uri: URI;

	/**
	 * Name of the custom chat mode.
	 */
	readonly name: string;
	/**
	 * Description of the mode
	 */
	readonly description?: string;

	/**
	 * Tools metadata in the prompt header.
	 */
	readonly tools?: readonly string[];
}

/**
 * Type of combined tools metadata for the case
 * when the prompt is in the agent mode.
 */
interface ICombinedAgentToolsMetadata {
	/**
	 * List of combined tools metadata for
	 * the entire tree of prompt references.
	 */
	readonly tools: readonly string[] | undefined;

	/**
	 * Resulting chat mode of a prompt, based on modes
	 * used in the entire tree of prompt references.
	 */
	readonly mode: ChatMode.Agent;
}

/**
 * Type of combined tools metadata for the case
 * when the prompt is in non-agent mode.
 */
interface ICombinedNonAgentToolsMetadata {
	/**
	 * List of combined tools metadata is empty
	 * when the prompt is in non-agent mode.
	 */
	readonly tools: undefined;

	/**
	 * Resulting chat mode of a prompt, based on modes
	 * used in the entire tree of prompt references.
	 */
	readonly mode?: ChatMode.Ask | ChatMode.Edit;
}

/**
 * General type of the combined tools metadata.
 */
export type TCombinedToolsMetadata = ICombinedAgentToolsMetadata | ICombinedNonAgentToolsMetadata;

/**
 * Provides prompt services.
 */
export interface IPromptsService extends IDisposable {
	readonly _serviceBrand: undefined;

	/**
	 * Get a prompt syntax parser for the provided text model.
	 * See {@link TextModelPromptParser} for more info on the parser API.
	 */
	getSyntaxParserFor(model: ITextModel): TSharedPrompt & { isDisposed: false };

	/**
	 * List all available prompt files.
	 */
	listPromptFiles(type: PromptsType, token: CancellationToken): Promise<readonly IPromptPath[]>;

	/**
	 * Get a list of prompt source folders based on the provided prompt type.
	 */
	getSourceFolders(type: PromptsType): readonly IPromptPath[];

	/**
	 * Returns a prompt command if the command name.
	 * Undefined is returned if the name does not look like a file name of a prompt file.
	 */
	asPromptSlashCommand(name: string): IChatPromptSlashCommand | undefined;

	/**
	 * Gets the prompt file for a slash command.
	 */
	resolvePromptSlashCommand(data: IChatPromptSlashCommand): Promise<IMetadata | undefined>;

	/**
	 * Returns a prompt command if the command name is valid.
	 */
	findPromptSlashCommands(): Promise<IChatPromptSlashCommand[]>;

	/**
	 * Find all instruction files which have a glob pattern in their
	 * 'applyTo' metadata record that match the provided list of files.
	 */
	findInstructionFilesFor(fileUris: readonly URI[]): Promise<readonly URI[]>;

	/**
	 * Event that is triggered when the list of custom chat modes changes.
	 */
	readonly onDidChangeCustomChatModes: Event<void>;

	/**
	 * Finds all available custom chat modes
	 */
	getCustomChatModes(): Promise<readonly ICustomChatMode[]>;

	/**
	 * Gets the metadata for the given prompt file uri.
	 */
	getMetadata(promptFileUri: URI): Promise<IMetadata>;

	/**
	 * Get all metadata for entire prompt references tree
	 * that spans out of each of the provided files.
	 *
	 * In other words, the metadata tree is built starting from
	 * each of the provided files, therefore the result is a number
	 * of metadata trees, one for each file.
	 */
	getAllMetadata(promptUris: readonly URI[]): Promise<readonly IMetadata[]>;
}

export interface IChatPromptSlashCommand {
	readonly command: string;
	readonly detail: string;
	readonly promptPath?: IPromptPath;
}
