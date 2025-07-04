/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyboardLayoutContribution } from './_.contribution.js';

KeyboardLayoutContribution.INSTANCE.registerKeyboardLayout({
	layout: { id: 'com.apple.keylayout.PolishPro', lang: 'pl', localizedName: 'Polish - Pro' },
	secondaryLayouts: [],
	mapping: {
		KeyA: ['a', 'A', 'ą', 'Ą', 0],
		KeyB: ['b', 'B', 'ļ', 'ű', 0],
		KeyC: ['c', 'C', 'ć', 'Ć', 0],
		KeyD: ['d', 'D', '∂', 'Ž', 0],
		KeyE: ['e', 'E', 'ę', 'Ę', 0],
		KeyF: ['f', 'F', 'ń', 'ž', 0],
		KeyG: ['g', 'G', '©', 'Ū', 0],
		KeyH: ['h', 'H', 'ķ', 'Ó', 0],
		KeyI: ['i', 'I', '^', 'ť', 4],
		KeyJ: ['j', 'J', '∆', 'Ô', 0],
		KeyK: ['k', 'K', 'Ż', 'ū', 0],
		KeyL: ['l', 'L', 'ł', 'Ł', 0],
		KeyM: ['m', 'M', 'Ķ', 'ų', 0],
		KeyN: ['n', 'N', 'ń', 'Ń', 0],
		KeyO: ['o', 'O', 'ó', 'Ó', 0],
		KeyP: ['p', 'P', 'Ļ', 'ł', 0],
		KeyQ: ['q', 'Q', 'Ō', 'ő', 0],
		KeyR: ['r', 'R', '®', '£', 0],
		KeyS: ['s', 'S', 'ś', 'Ś', 0],
		KeyT: ['t', 'T', '†', 'ś', 0],
		KeyU: ['u', 'U', '¨', 'Ť', 4],
		KeyV: ['v', 'V', '√', '◊', 0],
		KeyW: ['w', 'W', '∑', '„', 0],
		KeyX: ['x', 'X', 'ź', 'Ź', 0],
		KeyY: ['y', 'Y', 'ī', 'Á', 0],
		KeyZ: ['z', 'Z', 'ż', 'Ż', 0],
		Digit1: ['1', '!', 'Ń', 'ŕ', 0],
		Digit2: ['2', '@', '™', 'Ř', 0],
		Digit3: ['3', '#', '€', '‹', 0],
		Digit4: ['4', '$', 'ß', '›', 0],
		Digit5: ['5', '%', 'į', 'ř', 0],
		Digit6: ['6', '^', '§', 'Ŗ', 0],
		Digit7: ['7', '&', '¶', 'ŗ', 0],
		Digit8: ['8', '*', '•', '°', 0],
		Digit9: ['9', '(', 'Ľ', 'Š', 0],
		Digit0: ['0', ')', 'ľ', '‚', 0],
		Enter: [],
		Escape: [],
		Backspace: [],
		Tab: [],
		Space: [' ', ' ', ' ', ' ', 0],
		Minus: ['-', '_', '–', '—', 0],
		Equal: ['=', '+', '≠', 'Ī', 0],
		BracketLeft: ['[', '{', '„', '”', 0],
		BracketRight: [']', '}', '‚', '’', 0],
		Backslash: ['\\', '|', '«', '»', 0],
		Semicolon: [';', ':', '…', 'Ú', 0],
		Quote: ["'", '"', 'ĺ', 'ģ', 0],
		Backquote: ['`', '~', '`', 'Ŕ', 4],
		Comma: [',', '<', '≤', 'Ý', 0],
		Period: ['.', '>', '≥', 'ý', 0],
		Slash: ['/', '?', '÷', 'ņ', 0],
		CapsLock: [],
		F1: [],
		F2: [],
		F3: [],
		F4: [],
		F5: [],
		F6: [],
		F7: [],
		F8: [],
		F9: [],
		F10: [],
		F11: [],
		F12: [],
		Insert: [],
		Home: [],
		PageUp: [],
		Delete: [],
		End: [],
		PageDown: [],
		ArrowRight: [],
		ArrowLeft: [],
		ArrowDown: [],
		ArrowUp: [],
		NumLock: [],
		NumpadDivide: ['/', '/', '/', '/', 0],
		NumpadMultiply: ['*', '*', '*', '*', 0],
		NumpadSubtract: ['-', '-', '-', '-', 0],
		NumpadAdd: ['+', '+', '+', '+', 0],
		NumpadEnter: [],
		Numpad1: ['1', '1', '1', '1', 0],
		Numpad2: ['2', '2', '2', '2', 0],
		Numpad3: ['3', '3', '3', '3', 0],
		Numpad4: ['4', '4', '4', '4', 0],
		Numpad5: ['5', '5', '5', '5', 0],
		Numpad6: ['6', '6', '6', '6', 0],
		Numpad7: ['7', '7', '7', '7', 0],
		Numpad8: ['8', '8', '8', '8', 0],
		Numpad9: ['9', '9', '9', '9', 0],
		Numpad0: ['0', '0', '0', '0', 0],
		NumpadDecimal: ['.', '.', '.', '.', 0],
		IntlBackslash: ['§', '£', '¬', '¬', 0],
		ContextMenu: [],
		NumpadEqual: ['=', '=', '=', '=', 0],
		F13: [],
		F14: [],
		F15: [],
		F16: [],
		F17: [],
		F18: [],
		F19: [],
		F20: [],
		AudioVolumeMute: [],
		AudioVolumeUp: ['', '=', '', '=', 0],
		AudioVolumeDown: [],
		NumpadComma: [],
		IntlRo: [],
		KanaMode: [],
		IntlYen: [],
		ControlLeft: [],
		ShiftLeft: [],
		AltLeft: [],
		MetaLeft: [],
		ControlRight: [],
		ShiftRight: [],
		AltRight: [],
		MetaRight: [],
	},
});
