import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../components/ui/CommandPalette';

// Mock user preferences for CommandPalette
vi.mock('../lib/user-preferences', () => ({
	userPreferences: {
		get: vi.fn((key: string) => {
			const defaults: Record<string, any> = {
				theme: 'system',
				sidebarCollapsed: false,
				recentCommands: [],
				dismissedNotifications: [],
				accessibilityPreferences: {
					reducedMotion: false,
					highContrast: false,
					largeText: false,
				},
			};
			return defaults[key];
		}),
		addRecentCommand: vi.fn(),
	},
}));

// Mock next-themes
vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
	}),
}));

const mockCommands = [
	{
		id: 'new-project',
		name: 'New Project',
		category: 'File',
		action: vi.fn(),
	},
	{
		id: 'open-settings',
		name: 'Open Settings',
		category: 'Navigation',
		action: vi.fn(),
	},
	{
		id: 'toggle-theme',
		name: 'Toggle Theme',
		category: 'Interface',
		action: vi.fn(),
	},
];

describe('CommandPalette', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders correctly when open', () => {
		render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);

		expect(screen.getByPlaceholderText(/search commands/i)).toBeInTheDocument();
		expect(screen.getByText('New Project')).toBeInTheDocument();
		expect(screen.getByText('Open Settings')).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(<CommandPalette isOpen={false} onClose={vi.fn()} commands={mockCommands} />);

		expect(screen.queryByPlaceholderText(/search commands/i)).not.toBeInTheDocument();
	});
	it('filters commands when searching', async () => {
		render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);

		const searchInput = screen.getByPlaceholderText(/search commands/i);

		await act(async () => {
			fireEvent.change(searchInput, { target: { value: 'settings' } });
		});

		// Wait for debounced search to complete
		await waitFor(
			() => {
				expect(screen.getByText('Open Settings')).toBeInTheDocument();
			},
			{ timeout: 300 }
		);

		await waitFor(
			() => {
				expect(screen.queryByText('New Project')).not.toBeInTheDocument();
			},
			{ timeout: 300 }
		);
	});
	it('shows "no commands found" message when search has no matches', async () => {
		render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);

		const searchInput = screen.getByPlaceholderText(/search commands/i);

		await act(async () => {
			fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
		});

		// Wait for debounced search to complete
		await waitFor(
			() => {
				expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
			},
			{ timeout: 300 }
		);
	});
	it('executes command action when clicked', async () => {
		const onClose = vi.fn();
		render(<CommandPalette isOpen={true} onClose={onClose} commands={mockCommands} />);

		// Wait for the command to appear in the list
		const commandElement = await waitFor(() =>
			screen.getByRole('option', { name: /New Project/i })
		);
		expect(commandElement).toBeInTheDocument();

		// Use user events for more realistic interaction with Headless UI Combobox
		await act(async () => {
			await userEvent.click(commandElement);
		});

		// Allow time for async operations
		await waitFor(
			() => {
				expect(mockCommands[0].action).toHaveBeenCalled();
			},
			{ timeout: 3000 }
		);
		expect(onClose).toHaveBeenCalled();
	});

	it('closes when Escape key is pressed', () => {
		const onClose = vi.fn();
		render(<CommandPalette isOpen={true} onClose={onClose} commands={mockCommands} />);

		const searchInput = screen.getByPlaceholderText(/search commands/i);
		fireEvent.keyDown(searchInput, { key: 'Escape' });

		expect(onClose).toHaveBeenCalled();
	});
	it('has the proper accessibility attributes', async () => {
		render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={mockCommands} />);

		const combobox = screen.getByRole('combobox');
		// Check that the combobox has proper aria attributes (HeadlessUI manages aria-expanded)
		expect(combobox).toHaveAttribute('aria-label', 'Search commands');

		// Wait for and check the listbox
		const listbox = await waitFor(() => screen.getByRole('listbox'));
		expect(listbox).toBeInTheDocument();
	});
});
