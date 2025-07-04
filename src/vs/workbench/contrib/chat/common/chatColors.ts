/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Color, RGBA } from '../../../../base/common/color.js';
import { localize } from '../../../../nls.js';
import {
	badgeBackground,
	badgeForeground,
	contrastBorder,
	editorBackground,
	editorSelectionBackground,
	editorWidgetBackground,
	foreground,
	registerColor,
	transparent,
} from '../../../../platform/theme/common/colorRegistry.js';

export const chatRequestBorder = registerColor(
	'chat.requestBorder',
	{
		dark: new Color(new RGBA(255, 255, 255, 0.1)),
		light: new Color(new RGBA(0, 0, 0, 0.1)),
		hcDark: contrastBorder,
		hcLight: contrastBorder,
	},
	localize('chat.requestBorder', 'The border color of a chat request.')
);

export const chatRequestBackground = registerColor(
	'chat.requestBackground',
	{
		dark: transparent(editorBackground, 0.62),
		light: transparent(editorBackground, 0.62),
		hcDark: editorWidgetBackground,
		hcLight: null,
	},
	localize('chat.requestBackground', 'The background color of a chat request.')
);

export const chatSlashCommandBackground = registerColor(
	'chat.slashCommandBackground',
	{ dark: '#34414b8f', light: '#d2ecff99', hcDark: Color.white, hcLight: badgeBackground },
	localize('chat.slashCommandBackground', 'The background color of a chat slash command.')
);

export const chatSlashCommandForeground = registerColor(
	'chat.slashCommandForeground',
	{ dark: '#40A6FF', light: '#306CA2', hcDark: Color.black, hcLight: badgeForeground },
	localize('chat.slashCommandForeground', 'The foreground color of a chat slash command.')
);

export const chatAvatarBackground = registerColor(
	'chat.avatarBackground',
	{ dark: '#1f1f1f', light: '#f2f2f2', hcDark: Color.black, hcLight: Color.white },
	localize('chat.avatarBackground', 'The background color of a chat avatar.')
);

export const chatAvatarForeground = registerColor(
	'chat.avatarForeground',
	foreground,
	localize('chat.avatarForeground', 'The foreground color of a chat avatar.')
);

export const chatEditedFileForeground = registerColor(
	'chat.editedFileForeground',
	{
		light: '#895503',
		dark: '#E2C08D',
		hcDark: '#E2C08D',
		hcLight: '#895503',
	},
	localize(
		'chat.editedFileForeground',
		'The foreground color of a chat edited file in the edited file list.'
	)
);

export const chatRequestCodeBorder = registerColor(
	'chat.requestCodeBorder',
	{ dark: '#004972B8', light: '#0e639c40', hcDark: null, hcLight: null },
	localize('chat.requestCodeBorder', 'Border color of code blocks within the chat request bubble.'),
	true
);

export const chatRequestBubbleBackground = registerColor(
	'chat.requestBubbleBackground',
	{
		light: transparent(editorSelectionBackground, 0.3),
		dark: transparent(editorSelectionBackground, 0.3),
		hcDark: null,
		hcLight: null,
	},
	localize('chat.requestBubbleBackground', 'Background color of the chat request bubble.'),
	true
);
